"""
Educator Agent - LangGraph Implementation

Simple but extensible LangGraph agent for reading sessions.
Routes to phase-specific handlers based on session phase.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .state import EducatorState
import logging

logger = logging.getLogger(__name__)


def route_by_phase(state: EducatorState) -> str:
    """
    Route to appropriate phase handler.
    
    Returns:
        "pre" | "during" | "post"
    """
    phase = state['current_phase'].lower()
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
    
    workflow = StateGraph(EducatorState)
    
    # Add phase handler nodes
    workflow.add_node("pre", pre_phase_handle)
    workflow.add_node("during", during_phase_handle)
    workflow.add_node("post", post_phase_handle)
    
    # Set entry point with conditional routing
    workflow.set_conditional_entry_point(
        route_by_phase,
        {
            "pre": "pre",
            "during": "during",
            "post": "post"
        }
    )
    
    # All nodes terminate
    workflow.add_edge("pre", END)
    workflow.add_edge("during", END)
    workflow.add_edge("post", END)
    
    # Compile with memory checkpointer
    # Phase 2a: In-memory (simple)
    # Phase 2b: PostgresSaver for persistence
    checkpointer = MemorySaver()
    
    logger.info("Educator graph compiled with MemorySaver checkpointer")
    
    return workflow.compile(checkpointer=checkpointer)


# Global graph instance
try:
    educator_graph = create_educator_graph()
    logger.info("Educator graph created successfully")
except Exception as e:
    logger.error(f"Failed to create educator graph: {e}")
    educator_graph = None
