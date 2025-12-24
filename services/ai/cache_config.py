"""
Redis-based Semantic Cache for LangChain
Optimizes repeated LLM calls for template-based tasks.

Usage:
    from cache_config import setup_semantic_cache
    setup_semantic_cache()  # Call once at startup
"""
import os
import logging
from typing import Optional
from langchain.globals import set_llm_cache
from langchain_redis import RedisSemanticCache
from langchain_openai.embeddings import OpenAIEmbeddings
import redis

logger = logging.getLogger(__name__)

# Cache configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
ENABLE_CACHE = os.getenv("ENABLE_SEMANTIC_CACHE", "true").lower() == "true"
CACHE_DISTANCE_THRESHOLD = float(os.getenv("CACHE_DISTANCE_THRESHOLD", "0.15"))

# Singleton cache instance
_cache_instance: Optional[RedisSemanticCache] = None


def get_cache() -> Optional[RedisSemanticCache]:
    """
    Get or create semantic cache instance.
    
    Returns None if caching is disabled or Redis unavailable.
    Lazy initialization for efficiency.
    """
    global _cache_instance
    
    if not ENABLE_CACHE:
        logger.info("Semantic cache disabled (ENABLE_SEMANTIC_CACHE=false)")
        return None
    
    if _cache_instance is not None:
        return _cache_instance
    
    try:
        # Test Redis connection first (fail fast)
        redis_client = redis.Redis.from_url(REDIS_URL, socket_connect_timeout=2)
        redis_client.ping()
        
        # Create cache with OpenAI embeddings (reuse across app)
        # Using text-embedding-3-small for cost efficiency
        _cache_instance = RedisSemanticCache(
            redis_url=REDIS_URL,
            embedding=OpenAIEmbeddings(model="text-embedding-3-small"),
            ttl=86400 * 7,  # 7 days TTL (balance freshness vs hits)
            distance_threshold=CACHE_DISTANCE_THRESHOLD,
            # Index name for namespacing
            index_name="llm:cache:semantic"
        )
        
        logger.info(
            f"Semantic cache initialized (threshold={CACHE_DISTANCE_THRESHOLD}, "
            f"TTL=7d, Redis={REDIS_URL})"
        )
        return _cache_instance
        
    except Exception as e:
        logger.warning(f"Failed to initialize semantic cache: {e}. Running without cache.")
        return None


def setup_semantic_cache() -> bool:
    """
    Setup global LangChain semantic cache.
    
    Call this once at application startup.
    Safe to call multiple times (idempotent).
    
    Returns:
        True if cache was enabled, False otherwise
    """
    cache = get_cache()
    
    if cache:
        set_llm_cache(cache)
        return True
    else:
        set_llm_cache(None)
        return False


def disable_cache_temporarily():
    """
    Temporarily disable cache for specific operations.
    
    Use in contexts where you need fresh responses:
        with disable_cache_temporarily():
            result = chain.invoke(...)
    """
    from contextlib import contextmanager
    
    @contextmanager
    def _disable():
        original = get_cache()
        set_llm_cache(None)
        try:
            yield
        finally:
            set_llm_cache(original)
    
    return _disable()


# Cache statistics (optional)
def get_cache_stats() -> dict:
    """
    Get cache statistics from Redis.
    
    Returns dict with:
        - enabled: bool
        - redis_keys: int (approximate)
        - index_exists: bool
    """
    if not ENABLE_CACHE:
        return {"enabled": False}
    
    try:
        redis_client = redis.Redis.from_url(REDIS_URL)
        
        # Approximate key count (scan for llm:cache:*)
        cursor = 0
        keys_count = 0
        while True:
            cursor, keys = redis_client.scan(cursor, match="llm:cache:*", count=100)
            keys_count += len(keys)
            if cursor == 0:
                break
        
        return {
            "enabled": True,
            "redis_url": REDIS_URL,
            "approximate_keys": keys_count,
            "threshold": CACHE_DISTANCE_THRESHOLD
        }
    except Exception as e:
        return {"enabled": False, "error": str(e)}
