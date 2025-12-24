"""
AI Service Metrics Tracker
Collects and exposes metrics for monitoring AI optimization impact
"""
import time
import logging
from typing import Dict, Any, Optional
from collections import defaultdict
from datetime import datetime, timedelta
import redis

logger = logging.getLogger(__name__)

# In-memory metrics (reset on restart - could use Redis for persistence)
_metrics = {
    'cache_hits': 0,
    'cache_misses': 0,
    'total_requests': 0,
    'total_tokens_before': 0,
    'total_tokens_after': 0,
    'response_times': [],
    'memory_jobs_processed': 0,
    'memory_jobs_failed': 0,
    'last_reset': time.time(),
}

# Redis client for persistent metrics (optional)
_redis_client: Optional[redis.Redis] = None


def _get_redis():
    """Get Redis client for persistent metrics"""
    global _redis_client
    if _redis_client is None:
        try:
            import os
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            _redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
            _redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis not available for metrics: {e}")
            _redis_client = None
    return _redis_client


def track_cache_hit():
    """Track a cache hit event"""
    _metrics['cache_hits'] += 1
    _metrics['total_requests'] += 1
    
    # Also persist to Redis
    r = _get_redis()
    if r:
        try:
            r.hincrby('ai:metrics:cache', 'hits', 1)
            r.hincrby('ai:metrics:cache', 'total', 1)
        except Exception as e:
            logger.debug(f"Failed to persist cache hit: {e}")


def track_cache_miss():
    """Track a cache miss event"""
    _metrics['cache_misses'] += 1
    _metrics['total_requests'] += 1
    
    r = _get_redis()
    if r:
        try:
            r.hincrby('ai:metrics:cache', 'misses', 1)
            r.hincrby('ai:metrics:cache', 'total', 1)
        except Exception as e:
            logger.debug(f"Failed to persist cache miss: {e}")


def track_token_usage(tokens_before: int, tokens_after: int):
    """Track token reduction from context optimization"""
    _metrics['total_tokens_before'] += tokens_before
    _metrics['total_tokens_after'] += tokens_after
    
    r = _get_redis()
    if r:
        try:
            r.hincrby('ai:metrics:tokens', 'before', tokens_before)
            r.hincrby('ai:metrics:tokens', 'after', tokens_after)
        except Exception as e:
            logger.debug(f"Failed to persist token usage: {e}")


def track_response_time(duration_ms: float):
    """Track LLM response time"""
    _metrics['response_times'].append(duration_ms)
    
    # Keep only last 1000 response times (memory-efficient)
    if len(_metrics['response_times']) > 1000:
        _metrics['response_times'] = _metrics['response_times'][-1000:]
    
    r = _get_redis()
    if r:
        try:
            # Store in sorted set with timestamp as score
            r.zadd('ai:metrics:response_times', {str(duration_ms): time.time()})
            # Keep only last 24 hours
            cutoff = time.time() - 86400
            r.zremrangebyscore('ai:metrics:response_times', 0, cutoff)
        except Exception as e:
            logger.debug(f"Failed to persist response time: {e}")


def track_memory_job_success():
    """Track successful memory compaction job"""
    _metrics['memory_jobs_processed'] += 1
    
    r = _get_redis()
    if r:
        try:
            r.hincrby('ai:metrics:memory', 'processed', 1)
        except Exception as e:
            logger.debug(f"Failed to persist memory job success: {e}")


def track_memory_job_failure():
    """Track failed memory compaction job"""
    _metrics['memory_jobs_failed'] += 1
    
    r = _get_redis()
    if r:
        try:
            r.hincrby('ai:metrics:memory', 'failed', 1)
        except Exception as e:
            logger.debug(f"Failed to persist memory job failure: {e}")


def get_metrics() -> Dict[str, Any]:
    """
    Get current metrics snapshot
    
    Returns:
        Dict with all tracked metrics
    """
    # Calculate derived metrics
    total_requests = _metrics['total_requests']
    cache_hit_rate = 0.0
    if total_requests > 0:
        cache_hit_rate = (_metrics['cache_hits'] / total_requests) * 100
    
    tokens_before = _metrics['total_tokens_before']
    tokens_after = _metrics['total_tokens_after']
    token_reduction = 0.0
    if tokens_before > 0:
        token_reduction = ((tokens_before - tokens_after) / tokens_before) * 100
    
    avg_response_time = 0.0
    if _metrics['response_times']:
        avg_response_time = sum(_metrics['response_times']) / len(_metrics['response_times'])
    
    uptime_seconds = time.time() - _metrics['last_reset']
    
    return {
        'cache': {
            'hits': _metrics['cache_hits'],
            'misses': _metrics['cache_misses'],
            'total_requests': total_requests,
            'hit_rate_percent': round(cache_hit_rate, 2),
        },
        'tokens': {
            'total_before_optimization': _metrics['total_tokens_before'],
            'total_after_optimization': _metrics['total_tokens_after'],
            'reduction_percent': round(token_reduction, 2),
            'tokens_saved': tokens_before - tokens_after,
        },
        'memory_jobs': {
            'processed': _metrics['memory_jobs_processed'],
            'failed': _metrics['memory_jobs_failed'],
            'success_rate_percent': round(
                (_metrics['memory_jobs_processed'] / 
                 max(1, _metrics['memory_jobs_processed'] + _metrics['memory_jobs_failed'])) * 100,
                2
            ),
        },
        'performance': {
            'avg_response_time_ms': round(avg_response_time, 2),
            'min_response_time_ms': round(min(_metrics['response_times']), 2) if _metrics['response_times'] else 0,
            'max_response_time_ms': round(max(_metrics['response_times']), 2) if _metrics['response_times'] else 0,
            'samples': len(_metrics['response_times']),
        },
        'system': {
            'uptime_seconds': round(uptime_seconds),
            'uptime_hours': round(uptime_seconds / 3600, 2),
            'metrics_reset_at': datetime.fromtimestamp(_metrics['last_reset']).isoformat(),
        },
    }


def get_metrics_from_redis() -> Optional[Dict[str, Any]]:
    """
    Get persistent metrics from Redis (aggregated across restarts)
    
    Returns:
        Dict with Redis-persisted metrics or None if Redis unavailable
    """
    r = _get_redis()
    if not r:
        return None
    
    try:
        # Get cache metrics
        cache_data = r.hgetall('ai:metrics:cache')
        cache_hits = int(cache_data.get('hits', 0))
        cache_misses = int(cache_data.get('misses', 0))
        cache_total = int(cache_data.get('total', 0))
        
        # Get token metrics
        token_data = r.hgetall('ai:metrics:tokens')
        tokens_before = int(token_data.get('before', 0))
        tokens_after = int(token_data.get('after', 0))
        
        # Get memory job metrics
        memory_data = r.hgetall('ai:metrics:memory')
        memory_processed = int(memory_data.get('processed', 0))
        memory_failed = int(memory_data.get('failed', 0))
        
        # Get response times (last 24h from sorted set)
        response_times = r.zrange('ai:metrics:response_times', 0, -1)
        response_times_float = [float(rt) for rt in response_times]
        
        # Calculate derived metrics
        cache_hit_rate = (cache_hits / cache_total * 100) if cache_total > 0 else 0
        token_reduction = ((tokens_before - tokens_after) / tokens_before * 100) if tokens_before > 0 else 0
        avg_response_time = sum(response_times_float) / len(response_times_float) if response_times_float else 0
        
        return {
            'cache': {
                'hits': cache_hits,
                'misses': cache_misses,
                'total_requests': cache_total,
                'hit_rate_percent': round(cache_hit_rate, 2),
            },
            'tokens': {
                'total_before_optimization': tokens_before,
                'total_after_optimization': tokens_after,
                'reduction_percent': round(token_reduction, 2),
                'tokens_saved': tokens_before - tokens_after,
            },
            'memory_jobs': {
                'processed': memory_processed,
                'failed': memory_failed,
                'success_rate_percent': round(
                    (memory_processed / max(1, memory_processed + memory_failed)) * 100,
                    2
                ),
            },
            'performance': {
                'avg_response_time_ms': round(avg_response_time, 2),
                'min_response_time_ms': round(min(response_times_float), 2) if response_times_float else 0,
                'max_response_time_ms': round(max(response_times_float), 2) if response_times_float else 0,
                'samples_24h': len(response_times_float),
            },
            'source': 'redis_persistent',
        }
    
    except Exception as e:
        logger.error(f"Failed to get metrics from Redis: {e}")
        return None


def reset_metrics():
    """Reset all in-memory metrics"""
    global _metrics
    _metrics = {
        'cache_hits': 0,
        'cache_misses': 0,
        'total_requests': 0,
        'total_tokens_before': 0,
        'total_tokens_after': 0,
        'response_times': [],
        'memory_jobs_processed': 0,
        'memory_jobs_failed': 0,
        'last_reset': time.time(),
    }
    logger.info("Metrics reset")


# Auto-track decorator
def track_llm_call(tokens_before: int, tokens_after: int):
    """Decorator to auto-track LLM calls"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                track_response_time(duration_ms)
                track_token_usage(tokens_before, tokens_after)
                return result
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                track_response_time(duration_ms)
                raise e
        return wrapper
    return decorator
