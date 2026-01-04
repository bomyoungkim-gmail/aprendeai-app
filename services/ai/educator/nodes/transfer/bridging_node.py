"""
Bridging Node - Generates "Bridging" (Lateral) connection prompts.

AGENT SCRIPT B: Strict JSON output - deep structure + generalization question.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import BRIDGING_PROMPT
from llm_factory import llm_factory
import logging
import json

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Generate bridging (lateral connection) prompt with strict JSON output."""
    logger.info("Bridging node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    concept = transfer_metadata.get('concept', 'este conceito')
    domains = transfer_metadata.get('domains_json', [])
    
    llm = llm_factory.get_llm(tier="FAST")
    chain = BRIDGING_PROMPT | llm
    
    try:
        response = chain.invoke({
            "concept": concept,
            "domains": str(domains) if domains else "various fields",
            "style_instructions": state.get('style_instructions', ''),
            "max_tokens": state.get('max_tokens', 250)
        })
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON output
        try:
            structured_output = json.loads(response_text)
            if 'deep_structure' not in structured_output or 'generalization_question' not in structured_output:
                raise ValueError("Missing required fields")
            
            # Format response text
            formatted_text = f"**Estrutura Profunda:**\n{structured_output['deep_structure']}\n\n"
            formatted_text += f"**Pergunta de Generalização:**\n{structured_output['generalization_question']}"
            
            return {
                **state,
                "response_text": formatted_text,
                "structured_output": structured_output,
                "current_node": "bridging"
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}")
            return {
                **state,
                "response_text": f"Pense: Onde mais você vê estruturas similares a '{concept}'?",
                "current_node": "bridging"
            }
            
    except Exception as e:
        logger.error(f"Bridging node failed: {e}")
        return {
            **state,
            "response_text": f"Pense: Onde mais você vê estruturas similares a '{concept}'?",
            "current_node": "bridging"
        }
