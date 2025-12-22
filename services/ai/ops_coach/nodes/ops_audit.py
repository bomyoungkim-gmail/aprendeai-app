"""
OpsCoach Audit Node
Handles weekly audit and recovery recommendations
"""

from ..state import OpsCoachState


def handle(state: OpsCoachState) -> OpsCoachState:
    """
    WeeklyAudit - Summarize week and recommend stress tests
    """
    ops_context = state.get('ops_context', {})
    weekly_audit = ops_context.get('weekly_audit', {})
    
    if weekly_audit:
        # Audit exists - present summary
        total_minutes = weekly_audit.get('totalMinutes', 0)
        breakdown = weekly_audit.get('breakdown', {})
        flags = weekly_audit.get('flags', {})
        
        # Format breakdown
        breakdown_text = '\n'.join([
            f"- {subject}: {mins} min" 
            for subject, mins in breakdown.items()
        ])
        
        state['next_prompt'] = (
            f"📊 Auditoria Semanal\n\n"
            f"**Total: {total_minutes} min de estudo**\n\n"
            f"Distribuição:\n{breakdown_text}\n\n"
            f"{'⚠️ ' + flags.get('bias', '') if flags.get('bias') else '✅ Distribuição balanceada'}"
        )
        
        quick_replies = ["OK, entendi"]
        
        if flags.get('missingStressTest'):
            quick_replies.append("Agendar stress test")
        
        state['quick_replies'] = quick_replies
    else:
        # No audit yet
        state['next_prompt'] = (
            "Auditoria semanal ainda não disponível.\n"
            "Volte no domingo à noite!"
        )
        state['quick_replies'] = ["OK"]
    
    return state
