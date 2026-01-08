"""PKM Node - Assists in Atomic Note generation."""
from educator.transfer_state import TransferState
from educator.policies.decision_policy import parse_decision_policy
import logging

logger = logging.getLogger(__name__)

def handle(state: TransferState) -> TransferState:
    logger.info("PKM node executing")
    
    # Check decision_policy gate
    policy_dict = state.get("decision_policy", {})
    policy = parse_decision_policy(policy_dict)
    
    if not policy.features.pkmEnabled:
        logger.info("PKM disabled by decision_policy")
        return {
            **state,
            "response_text": "⚠️ A geração de notas atômicas está desabilitada no momento.",
            "current_node": "pkm",
        }
    
    transfer_metadata = state.get('transfer_metadata', {})
    concept = transfer_metadata.get('concept', '')
    
    # Simplified PKM draft generation
    response_text = f"""📝 Rascunho de Nota Atômica

# {concept}

## Definição
[A ser preenchido com base nos metadados]

## Estrutura
[Componentes principais]

## Backlinks
- Near domain: [conceitos relacionados próximos]
- Far domain: [conceitos relacionados distantes]

(Esta é uma versão simplificada - integração completa com PkmGenerationService virá em breve)"""
    
    return {
        **state,
        "response_text": response_text,
        "current_node": "pkm",
        "structured_output": {
            "pkm_draft": True,
            "concept": concept
        }
    }
