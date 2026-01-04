"""
Analogy Node - Generates structural analogies for transfer learning.

Uses section_transfer_metadata to ground analogies in the content being read.
"""

from educator.transfer_state import TransferState
from llm_factory import llm_factory
from langchain.prompts import ChatPromptTemplate
import logging

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """
    Generate structural analogy based on transfer metadata.
    
    Args:
        state: Must contain transfer_metadata with concept info
        
    Returns:
        Updated state with response_text containing the analogy
    """
    logger.info("Analogy node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    user_profile = state.get('user_profile', {})
    
    # Extract concept from metadata
    concept = transfer_metadata.get('concept', 'the concept')
    existing_analogies = transfer_metadata.get('analogies_json', [])
    
    # Get schooling level for appropriate complexity
    schooling_level = user_profile.get('schooling_level', 'MEDIO')
    
    # Build prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a pedagogical expert creating structural analogies.
Your goal is to help students transfer understanding by connecting new concepts to familiar domains.

Guidelines:
- Use analogies appropriate for {schooling_level} level
- Focus on structural similarity, not surface features
- Make the analogy concrete and relatable
- Explain the mapping explicitly"""),
        ("user", """Create a structural analogy for: {concept}

Existing analogies (avoid repeating): {existing_analogies}

Provide:
1. The analogy (source domain)
2. Explicit mapping (what corresponds to what)
3. Limitations of the analogy""")
    ])
    
    # Get LLM (use SMART tier for quality)
    llm = llm_factory.get_llm(tier="SMART")
    
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "concept": concept,
            "schooling_level": schooling_level,
            "existing_analogies": str(existing_analogies) if existing_analogies else "None"
        })
        
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        logger.info(f"Analogy generated for concept: {concept}")
        
        return {
            **state,
            "response_text": response_text,
            "current_node": "analogy",
            "events_to_write": [
                {
                    "type": "TRANSFER_ANALOGY_GENERATED",
                    "concept": concept,
                    "user_id": state['user_id']
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Analogy generation failed: {e}")
        return {
            **state,
            "response_text": f"Desculpe, não consegui gerar uma analogia no momento. Conceito: {concept}",
            "current_node": "analogy"
        }
