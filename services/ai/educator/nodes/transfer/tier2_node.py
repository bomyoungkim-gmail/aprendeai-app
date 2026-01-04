"""
Tier2 Node - Vocabulary expansion using Tier 2 words.

Helps students expand academic vocabulary.
"""

from educator.transfer_state import TransferState
import logging

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Provide Tier 2 vocabulary expansion."""
    logger.info("Tier2 node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    concept = transfer_metadata.get('concept', '')
    
    # Simplified implementation - in production, would use LLM or vocabulary database
    response_text = f"""📚 Vocabulário Acadêmico (Tier 2)

Conceito: {concept}

Palavras relacionadas que você deveria conhecer:
- Termos técnicos associados
- Sinônimos mais formais
- Expressões acadêmicas

(Esta é uma versão simplificada - a implementação completa virá em breve)"""
    
    return {
        **state,
        "response_text": response_text,
        "current_node": "tier2"
    }
