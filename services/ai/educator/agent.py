"""
Educator Agent - LangGraph Implementation

Simple but extensible LangGraph agent for reading sessions.
Routes to phase-specific handlers based on session phase.
"""

from langgraph.graph import StateGraph, END

# Robust import for RedisSaver handling potential package structure differences
try:
    # Try standard namespace path first
    from langgraph.checkpoint.redis import RedisSaver
except ImportError:
    try:
        # Try flat package name (common in newer refactors)
        from langgraph_checkpoint_redis import RedisSaver
    except ImportError:
        try:
            # Try legacy or alternative name
            from langgraph_redis import RedisSaver
        except ImportError:
            # Fallback to MemorySaver if Redis unavailable (and log warning)
            import logging
            logging.getLogger(__name__).warning("RedisSaver not found. Falling back to MemorySaver.")
            from langgraph.checkpoint.memory import MemorySaver as RedisSaver

from .state import EducatorState
import logging
import redis
import os

logger = logging.getLogger(__name__)


def route_by_phase(state: EducatorState) -> str:
    """
    Route to appropriate phase handler.
    
    Returns:
        "pre" | "during" | "post" | "game"
    """
    phase = state['current_phase'].lower()
    
    # Check if starting a game
    user_text = state.get('user_text', '').upper()
    if user_text == 'START_GAME' or state.get('game_mode'):
        logger.debug("Routing to game phase")
        return "game"
    
    logger.debug(f"Routing to phase: {phase}")
    return phase


def create_educator_graph():
    """
    Create LangGraph for Educator Agent.
    
    Graph structure:
    - Entry: route_by_phase
    - Nodes: pre_phase, during_phase, post_phase
    - Exit: All nodes → END
    
    Checkpointing: MemorySaver (upgrade to Postgres in Phase 2b)
    """
    
    # Import nodes here to avoid circular imports
    from educator.nodes.pre_phase import handle as pre_phase_handle
    from educator.nodes.during_phase import handle as during_phase_handle
    from educator.nodes.post_phase import handle as post_phase_handle
    from educator.nodes.game_phase import handle as game_phase_handle
    
    workflow = StateGraph(EducatorState)
    
    # Add phase handler nodes
    workflow.add_node("pre", pre_phase_handle)
    workflow.add_node("during", during_phase_handle)
    workflow.add_node("post", post_phase_handle)
    workflow.add_node("game", game_phase_handle)  # NEW: Game node
    
    # Set entry point with conditional routing
    workflow.set_conditional_entry_point(
        route_by_phase,
        {
            "pre": "pre",
            "during": "during",
            "post": "post",
            "game": "game",  # NEW: Route to game
        }
    )
    
    # All nodes terminate
    workflow.add_edge("pre", END)
    workflow.add_edge("during", END)
    workflow.add_edge("post", END)
    workflow.add_edge("game", END)  # NEW: Game terminates
    
    # Compile with Redis checkpointer for persistent, shared state
    # Benefits: survives restarts, shared across instances, TTL support
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis.Redis.from_url(redis_url, decode_responses=False)
    
    checkpointer = RedisSaver(redis_client)
    checkpointer.setup()  # Creates necessary Redis structures
    
    logger.info(f"Educator graph compiled with RedisSaver (Redis: {redis_url})")
    
    return workflow.compile(checkpointer=checkpointer)


# Global graph instance
try:
    educator_graph = create_educator_graph()
    logger.info("Educator graph created successfully")
except Exception as e:
    logger.error(f"Failed to create educator graph: {e}")
    educator_graph = None
