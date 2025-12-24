"""
Cache-aware chain helpers
Utilities to optimize LLM cache usage per chain task
"""
from functools import wraps
from typing import Callable, Any
from langchain.globals import get_llm_cache, set_llm_cache
import logging

logger = logging.getLogger(__name__)

# Tasks that benefit from semantic cache (high repetition)
CACHE_FRIENDLY_TASKS = {
    'cues',          # Cornell cues are repetitive across similar texts
    'checkpoints',   # Checkpoint questions follow templates  
    'extract_words', # Vocabulary extraction has patterns
}

# Tasks that should always get fresh responses
NO_CACHE_TASKS = {
    'summarize',     # Summaries should be unique
    'quiz',          # Quiz questions should vary
    'glossary',      # Definitions should be tailored
}


def cache_aware(task_name: str):
    """
    Decorator to manage cache per task.
    
    Usage:
        @cache_aware('cues')
        def my_chain_function(...):
            return chain.invoke(...)
    
    For cache-friendly tasks: cache remains active
    For no-cache tasks: cache is temporarily disabled
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Get current cache state
            original_cache = get_llm_cache()
            
            # Disable cache for no-cache tasks
            if task_name in NO_CACHE_TASKS and original_cache is not None:
                logger.debug(f"Disabling cache for task: {task_name}")
                set_llm_cache(None)
                try:
                    result = func(*args, **kwargs)
                finally:
                    # Restore original cache
                    set_llm_cache(original_cache)
                return result
            
            # For cache-friendly tasks or when cache is already off, run normally
            else:
                if task_name in CACHE_FRIENDLY_TASKS:
                    logger.debug(f"Cache-friendly task: {task_name}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def with_fresh_response(func: Callable) -> Callable:
    """
    Decorator to force fresh LLM response (disable cache for this call).
    
    Usage:
        @with_fresh_response
        def generate_unique_quiz(...):
            return chain.invoke(...)
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        original_cache = get_llm_cache()
        set_llm_cache(None)
        try:
            return func(*args, **kwargs)
        finally:
            set_llm_cache(original_cache)
    
    return wrapper


# Context manager for temporary cache control
class CacheControl:
    """
    Context manager for fine- grained cache control.
    
    Usage:
        with CacheControl(enabled=False):
            result = chain.invoke(...)  # Fresh response
    """
    def __init__(self, enabled: bool):
        self.enabled = enabled
        self.original_cache = None
    
    def __enter__(self):
        self.original_cache = get_llm_cache()
        if not self.enabled:
            set_llm_cache(None)
        return self
    
    def __exit__(self, *args):
        set_llm_cache(self.original_cache)
