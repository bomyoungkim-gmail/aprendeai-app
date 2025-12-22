"""
OpsCoach LangGraph Agent
Handles operational algorithm: meta → plan → execute → telemetry → audit → recovery
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .state import OpsCoachState
from .nodes.ops_boot import handle as boot_handle
from .nodes.ops_plan import handle as plan_handle
from .nodes.ops_execute import handle as execute_handle
from .nodes.ops_log import handle as log_handle
from .nodes.ops_audit import handle as audit_handle


def detect_phase(prompt_text: str, ui_mode: str) -> str:
    """
    Detect which phase to route to based on prompt and UI mode
    Simple heuristic-based routing (can be enhanced with LLM later)
    """
    text_lower = prompt_text.lower()
    
    # Command-based routing
    if '/start day' in text_lower or '/goal' in text_lower:
        return 'BOOT'
    elif '/plan sunday' in text_lower or 'planning' in text_lower:
        return 'PLAN'
    elif '/today queue' in text_lower or '/execute' in text_lower:
        return 'EXECUTE'
    elif '/log' in text_lower and ('5m' in text_lower or '10m' in text_lower):
        return 'LOG'
    elif '/audit' in text_lower or ui_mode == 'AUDIT':
        return 'AUDIT'
    elif '/close day' in text_lower:
        return 'CLOSE'
    elif '/slump' in text_lower or '/recovery' in text_lower:
        return 'RECOVERY'
    
    # Default to BOOT if unclear
    return 'BOOT'


def route_by_phase(state: OpsCoachState) -> str:
    """Route to appropriate node based on current phase"""
    phase = state.get('current_phase', 'BOOT').upper()
    
    # Map phases to nodes
    phase_map = {
        'BOOT': 'boot',
        'PLAN': 'plan',
        'EXECUTE': 'execute',
        'LOG': 'log',
        'CLOSE': 'log',  # Close day is similar to log
        'AUDIT': 'audit',
        'RECOVERY': 'audit',  # Recovery recommendations via audit
    }
    
    return phase_map.get(phase, 'boot')


def create_ops_coach_graph():
    """
    Create OpsCoach LangGraph
    Parallel structure to Educator Agent but for dashboard ops
    """
    workflow = StateGraph(OpsCoachState)
    
    # Add nodes (parallel to Educator's PRE/DURING/POST)
    workflow.add_node("boot", boot_handle)
    workflow.add_node("plan", plan_handle)
    workflow.add_node("execute", execute_handle)
    workflow.add_node("log", log_handle)
    workflow.add_node("audit", audit_handle)
    
    # Conditional entry point (route based on phase)
    workflow.set_conditional_entry_point(
        route_by_phase,
        {
            "boot": "boot",
            "plan": "plan",
            "execute": "execute",
            "log": "log",
            "audit": "audit",
        }
    )
    
    # All end after single turn (stateless like Educator)
    workflow.add_edge("boot", END)
    workflow.add_edge("plan", END)
    workflow.add_edge("execute", END)
    workflow.add_edge("log", END)
    workflow.add_edge("audit", END)
    
    return workflow.compile(checkpointer=MemorySaver())


# Global instance (lazy init)
_ops_coach_graph = None

def get_ops_coach_graph():
    """Get or create global OpsCoach graph instance"""
    global _ops_coach_graph
    if _ops_coach_graph is None:
        _ops_coach_graph = create_ops_coach_graph()
    return _ops_coach_graph
