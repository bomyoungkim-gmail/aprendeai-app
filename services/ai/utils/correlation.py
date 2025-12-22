"""
Correlation ID Logging for FastAPI

Phase 0: MVP-Hardening - Observability
Propagates correlation ID from NestJS through FastAPI and into structured logs.
"""
import logging
from contextvars import ContextVar
from typing import Optional

# Context variable for correlation ID (thread-safe)
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")

def set_correlation_id(correlation_id: str):
    """Set correlation ID for current request context"""
    correlation_id_var.set(correlation_id)

def get_correlation_id() -> str:
    """Get correlation ID from current request context"""
    return correlation_id_var.get()

class CorrelationIDFilter(logging.Filter):
    """Add correlation ID to all log records"""
    
    def filter(self, record):
        record.correlation_id = get_correlation_id() or "none"
        return True

def setup_logging():
    """Configure structured logging with correlation ID"""
    
    # Create formatter
    formatter = logging.Formatter(
        '{"timestamp":"%(asctime)s","level":"%(levelname)s","correlation_id":"%(correlation_id)s","name":"%(name)s","message":"%(message)s"}'
    )
    
    # Get root logger
    logger = logging.getLogger()
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Add console handler with formatter
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.addFilter(CorrelationIDFilter())
    logger.addHandler(console_handler)
    
    return logger
