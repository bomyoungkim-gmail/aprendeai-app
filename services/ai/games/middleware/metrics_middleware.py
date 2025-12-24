"""Metrics middleware for automatic tracking"""
from typing import Dict, Any, Callable
import time
import logging
from .pipeline import GameMiddleware

logger = logging.getLogger(__name__)


class MetricsMiddleware(GameMiddleware):
    """
    Track game metrics automatically.
    
    Integrates with existing metrics.py system to track:
    - Response time
    - Success/failure rate
    """
    
    def process(self, context: Dict[str, Any], next_handler: Callable) -> Dict[str, Any]:
        """Track execution metrics"""
        
        start_time = time.time()
        correlation_id = context.get('correlation_id', 'unknown')
        game_mode = context.get('metadata', {}).get('gameMode', 'unknown')
        
        try:
            # Execute next handler
            result = next_handler(context)
            
            # Track successful execution
            duration_ms = (time.time() - start_time) * 1000
            
            logger.info(
                "Game round completed",
                extra={
                    'correlation_id': correlation_id,
                    'game_mode': game_mode,
                    'duration_ms': round(duration_ms, 2),
                    'success': True,
                }
            )
            
            # Integrate with metrics.py
            try:
                from metrics import track_response_time
                track_response_time(duration_ms)
            except ImportError:
                # metrics.py not available
                pass
            
            return result
            
        except Exception as e:
            # Track failed execution
            duration_ms = (time.time() - start_time) * 1000
            
            logger.error(
                "Game round failed",
                extra={
                    'correlation_id': correlation_id,
                    'game_mode': game_mode,
                    'duration_ms': round(duration_ms, 2),
                    'error': str(e),
                    'success': False,
                },
                exc_info=True
            )
            
            # Track failure metric
            try:
                from metrics import track_memory_job_failure
                track_memory_job_failure()
            except ImportError:
                pass
            
            raise
