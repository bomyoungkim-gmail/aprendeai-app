"""Correlation ID middleware for request tracing"""
from typing import Dict, Any, Callable
import uuid
import logging
from .pipeline import GameMiddleware
from ..decorators import set_correlation_id

logger = logging.getLogger(__name__)


class CorrelationIdMiddleware(GameMiddleware):
    """
    Inject correlation ID for full request traceability.
    
    If correlation_id already exists in context, uses it.
    Otherwise, generates a new UUID.
    
    Also sets the correlation ID in the context variable for decorators.
    """
    
    def process(self, context: Dict[str, Any], next_handler: Callable) -> Dict[str, Any]:
        """Inject or use existing correlation ID"""
        
        # Get or generate correlation ID
        if 'correlation_id' not in context:
            context['correlation_id'] = str(uuid.uuid4())
            generated = True
        else:
            generated = False
        
        correlation_id = context['correlation_id']
        
        # Set in context variable for decorators
        set_correlation_id(correlation_id)
        
        logger.info(
            "Request started" if generated else "Request resumed",
            extra={
                'correlation_id': correlation_id,
                'game_mode': context.get('metadata', {}).get('gameMode'),
                'generated': generated,
            }
        )
        
        # Execute next handler
        try:
            result = next_handler(context)
            
            logger.info(
                "Request completed",
                extra={
                    'correlation_id': correlation_id,
                    'success': True,
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "Request failed",
                extra={
                    'correlation_id': correlation_id,
                    'error': str(e),
                    'success': False,
                },
                exc_info=True
            )
            raise
