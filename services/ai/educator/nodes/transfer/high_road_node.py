"""
High Road Node - Generates transfer missions with rubrics.

AGENT SCRIPT B: Strict JSON output - mission markdown + rubric JSON.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import HIGH_ROAD_PROMPT
from llm_factory import llm_factory
import logging
import json

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Generate High Road transfer mission with rubric."""
    logger.info("High Road node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    concept = transfer_metadata.get('concept', 'este conceito')
    target_domain = transfer_metadata.get('target_domain', 'um novo contexto')
    
    user_profile = state.get('user_profile', {})
    student_level = user_profile.get('schooling_level', 'ensino médio')
    
    llm = llm_factory.get_llm(tier="SMART")  # Use SMART tier for mission generation
    chain = HIGH_ROAD_PROMPT | llm
    
    try:
        response = chain.invoke({
            "concept": concept,
            "target_domain": target_domain,
            "student_level": student_level,
            "style_instructions": state.get('style_instructions', ''),
            "max_tokens": state.get('max_tokens', 250)
        })
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON output
        try:
            structured_output = json.loads(response_text)
            if 'mission_markdown' not in structured_output or 'rubric_json' not in structured_output:
                raise ValueError("Missing required fields")
            
            # Format response text
            formatted_text = "# Missão de Transferência\n\n"
            formatted_text += structured_output['mission_markdown']
            formatted_text += "\n\n## Rubrica de Avaliação\n"
            
            rubric = structured_output.get('rubric_json', {})
            for criterion in rubric.get('criteria', []):
                formatted_text += f"- **{criterion.get('name')}** ({criterion.get('points')} pts): {criterion.get('description')}\n"
            
            return {
                **state,
                "response_text": formatted_text,
                "structured_output": structured_output,
                "current_node": "high_road"
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}")
            return {
                **state,
                "response_text": f"Missão: Aplique '{concept}' em {target_domain}",
                "current_node": "high_road"
            }
            
    except Exception as e:
        logger.error(f"High Road node failed: {e}")
        return {
            **state,
            "response_text": f"Missão: Aplique '{concept}' em {target_domain}",
            "current_node": "high_road"
        }
