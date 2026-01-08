"""
Hugging Node - Generates "Hugging" (Generality) prompts.

AGENT SCRIPT B: Strict JSON output - 1 question + 2 examples.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import HUGGING_PROMPT
from educator.policies.decision_policy import parse_decision_policy
from llm_factory import llm_factory
import logging
import json

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Generate hugging (generality) prompt with strict JSON output."""
    logger.info("Hugging node executing")
    
    # Check decision_policy gate
    policy_dict = state.get("decision_policy", {})
    policy = parse_decision_policy(policy_dict)
    
    if not policy.features.huggingEnabled:
        logger.info("Hugging disabled by decision_policy")
        return {
            **state,
            "response_text": "⚠️ Prompts de generalização estão desabilitados no momento.",
            "current_node": "hugging",
        }
    
    transfer_metadata = state.get('transfer_metadata', {})
    concept = transfer_metadata.get('concept', 'este conceito')
    domains = transfer_metadata.get('domains_json', [])
    
    llm = llm_factory.get_llm(tier="FAST")
    chain = HUGGING_PROMPT | llm
    
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
            # Validate schema
            if 'question' not in structured_output or 'examples' not in structured_output:
                raise ValueError("Missing required fields")
            
            # Format response text from structured output
            formatted_text = f"**{structured_output['question']}**\n\n"
            formatted_text += "Exemplos:\n"
            for i, example in enumerate(structured_output.get('examples', [])[:2], 1):
                formatted_text += f"{i}. {example}\n"
            
            return {
                **state,
                "response_text": formatted_text,
                "structured_output": structured_output,
                "current_node": "hugging"
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}")
            # Fallback to simple response
            return {
                **state,
                "response_text": f"Pense: Qual é o princípio geral por trás de '{concept}'?",
                "current_node": "hugging"
            }
            
    except Exception as e:
        logger.error(f"Hugging node failed: {e}")
        return {
            **state,
            "response_text": f"Pense: Qual é o princípio geral por trás de '{concept}'?",
            "current_node": "hugging"
        }
