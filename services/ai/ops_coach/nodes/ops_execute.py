"""
OpsCoach Execute Node
Returns next item from queue
"""

from ..state import OpsCoachState


def handle(state: OpsCoachState) -> OpsCoachState:
    """
    ExecuteNext - Return next TODO item from queue
    """
    ops_context = state.get('ops_context', {})
    weekly_plan = ops_context.get('weekly_plan', {})
    items = weekly_plan.get('items', [])
    
    # Find next TODO item
    next_item = next((item for item in items if item.get('status') == 'TODO'), None)
    
    if next_item:
        item_type = next_item.get('type', 'READ_UNIT')
        est_min = next_item.get('estMin', 30)
        
        state['next_prompt'] = (
            f"📋 Próximo da fila:\n\n"
            f"**{next_item.get('title', 'Item')}**\n"
            f"Estimativa: {est_min} min\n\n"
            "Iniciar agora?"
        )
        state['quick_replies'] = [
            "Começar",
            "Ver alternativas",
            "Pular este item"
        ]
    else:
        # Queue empty!
        state['next_prompt'] = (
            "🎉 Fila vazia!\n\n"
            "Parabéns, você completou o plano do dia.\n"
            "Fechar o dia?"
        )
        state['quick_replies'] = [
            "Fechar dia",
            "Adicionar mais itens"
        ]
    
    return state
