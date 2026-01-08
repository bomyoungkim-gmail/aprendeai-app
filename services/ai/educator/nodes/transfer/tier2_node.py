"""
Tier2 Node - Vocabulary expansion using Tier 2 words.

Helps students expand academic vocabulary.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import TIER2_PROMPT
from llm_factory import llm_factory
import logging
import json

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Provide Tier 2 vocabulary expansion."""
    logger.info("Tier2 node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    word = transfer_metadata.get('word') or transfer_metadata.get('concept', '')
    
    # Use FAST tier for vocabulary
    llm = llm_factory.get_llm(tier="FAST")
    chain = TIER2_PROMPT | llm
    
    try:
        response = chain.invoke({
            "word": word,
            "metadata": str(transfer_metadata),
            "style_instructions": state.get('style_instructions', ''),
            "max_tokens": state.get('max_tokens', 300)
        })
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON output
        try:
            import json
            structured_output = json.loads(response_text)
            
            definition = structured_output.get('definition', "Definição indisponível.")
            usage = structured_output.get('usage_examples', [])
            morphology = structured_output.get('morphology_note') # New field
            
            # Format friendly response
            formatted_text = f"📖 **{word}**\n\n{definition}\n\n"
            
            if morphology:
                formatted_text += f"💡 *{morphology}*\n\n"
                
            formatted_text += "**Exemplos:**\n"
            for ex in usage:
                formatted_text += f"- {ex}\n"
            
            return {
                **state,
                "response_text": formatted_text,
                "structured_output": structured_output,
                "current_node": "tier2"
            }
            
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON for {word}")
            return {
                **state,
                "response_text": f"Definição de '{word}': {response_text}",
                "current_node": "tier2"
            }
            
    except Exception as e:
        logger.error(f"Tier2 node failed: {e}")
        return {
            **state,
            "response_text": f"Não consegui definir '{word}' no momento.",
            "current_node": "tier2"
        }
