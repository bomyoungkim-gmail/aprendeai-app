"""
Transfer Graph - Just-in-Time pedagogical interventions.

This graph is triggered by DecisionService when specific intents are needed,
replacing the "always-on" chat behavior with precision tools.
"""

from langgraph.graph import StateGraph, END
from .transfer_state import TransferState, TransferIntent
import logging

logger = logging.getLogger(__name__)


def route_by_intent(state: TransferState) -> str:
    """
    Route to appropriate transfer node based on intent.
    
    Returns:
        Node name matching the intent
    """
    intent = state['intent']
    logger.debug(f"Routing to transfer node: {intent}")
    
    # Map intent to node name (lowercase for consistency)
    return intent.lower()


def create_transfer_graph():
    """
    Create Transfer Graph for just-in-time interventions.
    
    Graph structure:
    - Entry: route_by_intent
    - Nodes: One per TransferIntent type
    - Exit: All nodes → END
    
    Note: This graph is stateless or short-lived (no persistent checkpointing needed)
    """
    
    # Import nodes (lazy to avoid circular imports)
    from educator.nodes.transfer.scaffolding_node import handle as scaffolding_handle  # AGENT SCRIPT C
    from educator.nodes.transfer.analogy_node import handle as analogy_handle
    from educator.nodes.transfer.mission_feedback_node import handle as feedback_handle
    from educator.nodes.transfer.hugging_node import handle as hugging_handle
    from educator.nodes.transfer.bridging_node import handle as bridging_handle
    from educator.nodes.transfer.tier2_node import handle as tier2_handle
    from educator.nodes.transfer.morphology_node import handle as morphology_handle
    from educator.nodes.transfer.iceberg_node import handle as iceberg_handle
    from educator.nodes.transfer.connection_circle_node import handle as connection_circle_handle
    from educator.nodes.transfer.pkm_node import handle as pkm_handle
    from educator.nodes.transfer.metacognition_node import handle as metacognition_handle
    from educator.nodes.transfer.high_road_node import handle as high_road_handle  # AGENT SCRIPT B
    
    workflow = StateGraph(TransferState)
    
    # Add scaffolding node (AGENT SCRIPT C: Entry point for all requests)
    workflow.add_node("scaffolding", scaffolding_handle)
    
    # Add all specialized nodes
    workflow.add_node("analogy", analogy_handle)
    workflow.add_node("mission_feedback", feedback_handle)
    workflow.add_node("hugging", hugging_handle)
    workflow.add_node("bridging", bridging_handle)
    workflow.add_node("tier2", tier2_handle)
    workflow.add_node("morphology", morphology_handle)
    workflow.add_node("iceberg", iceberg_handle)
    workflow.add_node("connection_circle", connection_circle_handle)
    workflow.add_node("pkm", pkm_handle)
    workflow.add_node("metacognition", metacognition_handle)
    workflow.add_node("high_road", high_road_handle)  # AGENT SCRIPT B
    
    # Set entry point to scaffolding node (AGENT SCRIPT C)
    workflow.set_entry_point("scaffolding")
    
    # Conditional routing from scaffolding to intent-specific nodes
    workflow.add_conditional_edges(
        "scaffolding",
        route_by_intent,
        {
            "analogy": "analogy",
            "mission_feedback": "mission_feedback",
            "hugging": "hugging",
            "bridging": "bridging",
            "tier2": "tier2",
            "morphology": "morphology",
            "iceberg": "iceberg",
            "connection_circle": "connection_circle",
            "pkm": "pkm",
            "metacognition": "metacognition",
            "high_road": "high_road",  # AGENT SCRIPT B
        }
    )
    
    # All nodes terminate (single-turn execution)
    workflow.add_edge("analogy", END)
    workflow.add_edge("mission_feedback", END)
    workflow.add_edge("hugging", END)
    workflow.add_edge("bridging", END)
    workflow.add_edge("tier2", END)
    workflow.add_edge("morphology", END)
    workflow.add_edge("iceberg", END)
    workflow.add_edge("connection_circle", END)
    workflow.add_edge("pkm", END)
    workflow.add_edge("metacognition", END)
    workflow.add_edge("high_road", END)  # AGENT SCRIPT B
    
    logger.info("Transfer graph compiled (stateless, just-in-time)")
    
    # Compile without checkpointer (stateless execution)
    return workflow.compile()


# Global transfer graph instance
try:
    transfer_graph = create_transfer_graph()
    logger.info("Transfer graph created successfully")
except Exception as e:
    logger.error(f"Failed to create transfer graph: {e}")
    transfer_graph = None
