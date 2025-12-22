"""
OpsCoach Log Node
Handles time logging telemetry
"""

from ..state import OpsCoachState


def handle(state: OpsCoachState) -> OpsCoachState:
    """
    TimeLogAssist - Acknowledge time logs, encourage consistency
    """
    prompt_text = state.get('prompt_text', '')
    
    # Parse log command: /log 10m label
    minutes = 10  # Default
    label = "focused study"
    
    if '/log' in prompt_text:
        parts = prompt_text.split()
        for part in parts:
            if 'm' in part:
                try:
                    minutes = int(part.replace('m', ''))
                except:
                    pass
        
        # Label is anything after minutes
        if len(parts) > 2:
            label = ' '.join(parts[2:])
    
    # Acknowledge
    state['next_prompt'] = (
        f"✅ Registrado: **{minutes} min** de {label}\n\n"
        "Continue assim! Próximo bloco?"
    )
    state['quick_replies'] = [
        "Continuar +10m",
        "Break 5m",
        "Ver fila"
    ]
    
    # Event: Time logged
    state['events_to_write'] = [{
        "domain": "OPS",
        "type": "TIME_LOG",
        "data": {
            "minutes": minutes,
            "label": label
        }
    }]
    
    return state
