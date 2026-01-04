"""PKM Node - Assists in Atomic Note generation."""
from educator.transfer_state import TransferState
import logging

logger = logging.getLogger(__name__)

def handle(state: TransferState) -> TransferState:
    logger.info("PKM node executing")
    
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
