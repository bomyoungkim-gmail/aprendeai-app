"""
OpsCoach Boot Node
Handles daily boot gate: check if meta do dia exists, request if not
"""

from typing import Dict, Any
from ..state import OpsCoachState


def handle(state: OpsCoachState) -> OpsCoachState:
    """
    DailyBootGate - Check if daily goal exists, request HIL if not
    
    This is the entry point for the daily operational flow
    """
    ops_context = state.get('ops_context', {})
    daily_goal = ops_context.get('goals', {}).get('day')
    
    # Extract user name for personalization (if available)
    learner_profile = ops_context.get('learner_profile', {})
    name = learner_profile.get('name', 'there')
    
    if not daily_goal:
        # Request HIL-L (1-2 lines goal + why)
        state['next_prompt'] = (
            f"Bom dia, {name}! 🌅\n\n"
            "Meta do dia (1-2 linhas): o que você quer conquistar hoje?"
        )
        state['quick_replies'] = [
            "Estudar conteúdo",
            "Fazer assessment",
            "Revisar vocabulário",
            "Pular por hoje"
        ]
        state['hil_request'] = {
            "type": "HIL-L",
            "field": "daily_goal",
            "prompt": "What's your goal for today?"
        }
    else:
        # Daily goal exists - confirm execution
        state['next_prompt'] = (
            f"Meta do dia: **{daily_goal}**\n\n"
            "Pronto para executar?"
        )
        state['quick_replies'] = [
            "OK, executar",
            "Ajustar meta",
            "Ver fila do dia"
        ]
        
        # Mark boot as complete (event to write)
        state['events_to_write'] = [{
            "domain": "OPS",
            "type": "DAILY_BOOT",
            "data": {
                "goal": daily_goal,
                "confirmed": True
            }
        }]
    
    return state
