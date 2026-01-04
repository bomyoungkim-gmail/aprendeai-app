"""
Morphology Node - Word structure analysis.

AGENT SCRIPT B: Strict JSON output - decomposition + 2 applications.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import MORPHOLOGY_PROMPT
from llm_factory import llm_factory
import logging
import json

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Analyze word morphology with strict JSON output."""
    logger.info("Morphology node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    word = transfer_metadata.get('word') or transfer_metadata.get('concept', 'palavra')
    user_profile = state.get('user_profile', {})
    language = user_profile.get('language_proficiency', 'pt')
    
    llm = llm_factory.get_llm(tier="FAST")
    chain = MORPHOLOGY_PROMPT | llm
    
    try:
        response = chain.invoke({
            "word": word,
            "language": language,
            "style_instructions": state.get('style_instructions', ''),
            "max_tokens": state.get('max_tokens', 250)
        })
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON output
        try:
            structured_output = json.loads(response_text)
            if 'decomposition' not in structured_output or 'applications' not in structured_output:
                raise ValueError("Missing required fields")
            
            # Format response text
            formatted_text = f"**Decomposição:**\n{structured_output['decomposition']}\n\n"
            formatted_text += "**Aplicações:**\n"
            for i, app in enumerate(structured_output.get('applications', [])[:2], 1):
                formatted_text += f"{i}. {app}\n"
            
            return {
                **state,
                "response_text": formatted_text,
                "structured_output": structured_output,
                "current_node": "morphology"
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}")
            return {
                **state,
                "response_text": f"Análise morfológica de '{word}' (em desenvolvimento)",
                "current_node": "morphology"
            }
            
    except Exception as e:
        logger.error(f"Morphology node failed: {e}")
        return {
            **state,
            "response_text": f"Análise morfológica de '{word}' (em desenvolvimento)",
            "current_node": "morphology"
        }
