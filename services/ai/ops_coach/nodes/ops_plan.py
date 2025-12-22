"""
OpsCoach Plan Node
Handles weekly sprint planning (Sunday flow)
"""

from ..state import OpsCoachState


def handle(state: OpsCoachState) -> OpsCoachState:
    """
    WeeklySprintPlanning - Guide user through Sunday planning
    
    Minimal prompts to define:
    - 3 priorities
    - 1 weakness to address
    - Items distribution
    """
    prompt_text = state.get('prompt_text', '').lower()
    
    # Simple state machine for planning flow
    if '/plan sunday' in prompt_text or 'start planning' in prompt_text:
        # Step 1: Priorities
        state['next_prompt'] = (
            "📅 Planejamento Semanal\n\n"
            "Quais suas **3 prioridades** para esta semana?\n"
            "(Ex: Matemática, Literatura, Projeto)"
        )
        state['quick_replies'] = [
            "Matemática, Física, Literatura",
            "Estudar para prova",
            "Definir depois"
        ]
    elif 'priorities:' in prompt_text or len(prompt_text.split(',')) >= 2:
        # Step 2: Weekness
        priorities = prompt_text.replace('/plan sunday:', '').strip()
        
        state['next_prompt'] = (
            f"Prioridades: {priorities}\n\n"
            "Qual sua **maior fraqueza** a trabalhar?\n"
            "(Ex: Procrastinação, Foco, Revisão)"
        )
        state['quick_replies'] = [
            "Procrastinação",
            "Falta de foco",
            "Revisão insuficiente"
        ]
    else:
        # Default: confirm plan
        state['next_prompt'] = (
            "Plano semanal registrado! ✅\n\n"
            "Backlog criado. Começar execução?"
        )
        state['quick_replies'] = [
            "Ver fila",
            "Ajustar plano"
        ]
        
        # Event: Weekly plan created
        state['events_to_write'] = [{
            "domain": "OPS",
            "type": "WEEKLY_PLAN",
            "data": {
                "priorities": ["Math", "Literature", "Physics"],  # Parse from prompt
                "weakness": "Procrastination",
                "items": []  # To be filled by service
            }
        }]
    
    return state
