"""Event emitter middleware for automatic event tracking"""
from typing import Dict, Any, Callable
import logging
from .pipeline import GameMiddleware

logger = logging.getLogger(__name__)


class EventEmitterMiddleware(GameMiddleware):
    """
    Emit game events automatically.
    
    Events are logged for now - will integrate with actual
    event persistence system (SessionEvent) later.
    """
    
    def process(self, context: Dict[str, Any], next_handler: Callable) -> Dict[str, Any]:
        """Emit game events at key points"""
        
        correlation_id = context.get('correlation_id', 'unknown')
        game_mode = context.get('metadata', {}).get('gameMode', 'unknown')
        
        # Emit GAME_ROUND_STARTED (placeholder)
        self._emit_event('GAME_ROUND_STARTED', {
            'correlation_id': correlation_id,
            'game_mode': game_mode,
            'timestamp': None,  # Will be set by actual event system
        })
        
        try:
            # Execute next handler
            result = next_handler(context)
            
            # Emit GAME_ROUND_COMPLETED
            self._emit_event('GAME_ROUND_COMPLETED', {
                'correlation_id': correlation_id,
                'game_mode': game_mode,
                'score': result.get('score'),
                'success': True,
            })
            
            return result
            
        except Exception as e:
            # Emit GAME_ROUND_FAILED
            self._emit_event('GAME_ROUND_FAILED', {
                'correlation_id': correlation_id,
                'game_mode': game_mode,
                'error': str(e),
                'success': False,
            })
            raise
    
    def _emit_event(self, event_type: str, payload: Dict[str, Any]):
        """
        Emit event (placeholder - will integrate with SessionEvent).
        
        TODO: Actual implementation should:
        1. Create SessionEvent record in Postgres
        2. Set domain="GAME"
        3. Set eventType=event_type
        4. Set payloadJson=payload
        """
        logger.info(
            f"Event: {event_type}",
            extra={
                'event_type': event_type,
                **payload
            }
        )
        
        # TODO: Integrate with actual event system
        # await prisma.sessionEvent.create({
        #     data: {
        #         domain: "GAME",
        #         eventType: event_type,
        #         payloadJson: payload,
        #     }
        # })
