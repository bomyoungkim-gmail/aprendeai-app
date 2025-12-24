"""
Middleware pipeline for game processing.
Modular, composable, traceable.
"""
from typing import Callable, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class GameMiddleware:
    """Base middleware class - all middleware must inherit from this"""
    
    def process(self, context: Dict[str, Any], next_handler: Callable) -> Dict[str, Any]:
        """
        Process request and call next handler.
        
        Args:
            context: Request context with all data
            next_handler: Next middleware in chain
            
        Returns:
            Result from handler (potentially modified)
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} must implement process()"
        )


class GamePipeline:
    """
    Composable middleware pipeline.
    Order matters - middleware execute in order added.
    
    Usage:
        pipeline = GamePipeline([
            CorrelationIdMiddleware(),
            MetricsMiddleware(),
            EventEmitterMiddleware(),
        ])
        
        result = pipeline.execute(
            context={'game_mode': 'BOSS_FIGHT_VOCAB'},
            handler=lambda ctx: game.create_round(ctx)
        )
    """
    
    def __init__(self, middlewares: List[GameMiddleware]):
        """
        Initialize pipeline with middlewares.
        
        Args:
            middlewares: List of middleware instances (order matters!)
        """
        self.middlewares = middlewares
        logger.info(
            f"Game pipeline created with {len(middlewares)} middleware(s)",
            extra={'middleware_count': len(middlewares)}
        )
    
    def execute(self, context: Dict[str, Any], handler: Callable) -> Dict[str, Any]:
        """
        Execute pipeline with middlewares.
        
        Args:
            context: Request context dict
            handler: Final handler function to execute
            
        Returns:
            Result from handler
        """
        def build_chain(index: int) -> Callable:
            """Build nested chain of middleware"""
            if index >= len(self.middlewares):
                # End of chain - execute actual handler
                return handler
            
            def next_handler(ctx: Dict[str, Any]) -> Dict[str, Any]:
                # Get next middleware in chain
                next_chain = build_chain(index + 1)
                # Execute current middleware
                return self.middlewares[index].process(ctx, next_chain)
            
            return next_handler
        
        # Execute from first middleware
        return build_chain(0)(context)
    
    async def execute_async(self, context: Dict[str, Any], handler: Callable) -> Dict[str, Any]:
        """
        Execute pipeline with async handler support.
        
        Args:
            context: Request context dict
            handler: Final async handler function to execute
            
        Returns:
            Result from handler
        """
        # For MVP, skip middleware for async and call handler directly
        # TODO: Implement async middleware chain if needed
        return await handler(context)
    
    def add_middleware(self, middleware: GameMiddleware):
        """Add middleware to end of pipeline"""
        self.middlewares.append(middleware)
        logger.info(
            f"Added middleware: {middleware.__class__.__name__}",
            extra={'middleware': middleware.__class__.__name__}
        )
    
    def count(self) -> int:
        """Get number of middlewares in pipeline"""
        return len(self.middlewares)
