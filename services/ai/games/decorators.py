"""Game decorators for automatic tracking and logging"""
import logging
import functools
import time
from typing import Callable, Any
from contextvars import ContextVar

logger = logging.getLogger(__name__)

# Context variable for correlation ID (thread-safe)
correlation_id_var: ContextVar[str] = ContextVar('correlation_id', default=None)


def track_round(func: Callable) -> Callable:
    """
    Decorator to automatically track game round execution.
    
    Adds:
    - Execution timing
    - Structured logging with correlation ID
    - Error handling with context
    
    Usage:
        @track_round
        def create_round(self, state, difficulty):
            ...
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        # Get game instance (self)
        game_instance = args[0] if args else None
        game_id = getattr(game_instance, 'GAME_ID', 'UNKNOWN')
        
        # Get correlation ID from context
        correlation_id = correlation_id_var.get()
        
        # Start timing
        start_time = time.time()
        
        logger.info(
            f"Starting {func.__name__}",
            extra={
                'game_id': game_id,
                'function': func.__name__,
                'correlation_id': correlation_id,
            }
        )
        
        try:
            # Execute function
            result = func(*args, **kwargs)
            
            # Log success
            duration_ms = (time.time() - start_time) * 1000
            logger.info(
                f"Completed {func.__name__}",
                extra={
                    'game_id': game_id,
                    'function': func.__name__,
                    'correlation_id': correlation_id,
                    'duration_ms': round(duration_ms, 2),
                    'success': True,
                }
            )
            
            return result
            
        except Exception as e:
            # Log error with context
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"Failed {func.__name__}",
                extra={
                    'game_id': game_id,
                    'function': func.__name__,
                    'correlation_id': correlation_id,
                    'duration_ms': round(duration_ms, 2),
                    'error': str(e),
                    'success': False,
                },
                exc_info=True
            )
            raise
    
    return wrapper


def with_metrics(func: Callable) -> Callable:
    """
    Decorator to track function execution metrics.
    
    Integrates with existing metrics.py system.
    
    Usage:
        @with_metrics
        def evaluate_answer(self, round_data, answer):
            ...
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            
            # Track metrics
            duration_ms = (time.time() - start_time) * 1000
            
            try:
                from metrics import track_response_time
                track_response_time(duration_ms)
            except ImportError:
                # metrics.py not available, skip
                pass
            
            return result
            
        except Exception as e:
            # Track failed execution
            try:
                from metrics import track_memory_job_failure
                track_memory_job_failure()
            except ImportError:
                pass
            raise
    
    return wrapper


def set_correlation_id(correlation_id: str):
    """Set correlation ID in context"""
    correlation_id_var.set(correlation_id)


def get_correlation_id() -> str:
    """Get current correlation ID from context"""
    return correlation_id_var.get() or 'unknown'
