"""
Metacognition Node - Contextual self-regulation prompts.

Helps students reflect on their learning process.
"""

from educator.transfer_state import TransferState
from llm_factory import llm_factory
from langchain.prompts import ChatPromptTemplate
import logging

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """Generate metacognitive prompt."""
    logger.info("Metacognition node executing")
    
    transfer_metadata = state.get('transfer_metadata', {})
    concept = transfer_metadata.get('concept', 'este tópico')
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are helping students develop metacognitive awareness."),
        ("user", """Concept: {concept}

Generate a metacognitive prompt that helps the student:
1. Reflect on their understanding
2. Identify what they know vs. what they're unsure about
3. Plan their next learning steps

Keep it concise and actionable.""")
    ])
    
    llm = llm_factory.get_llm(tier="FAST")
    chain = prompt | llm
    
    try:
        response = chain.invoke({"concept": concept})
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            **state,
            "response_text": response_text,
            "current_node": "metacognition"
        }
    except Exception as e:
        logger.error(f"Metacognition node failed: {e}")
        return {
            **state,
            "response_text": f"🤔 Pare e reflita: O que você realmente entendeu sobre '{concept}'? O que ainda precisa esclarecer?",
            "current_node": "metacognition"
        }
