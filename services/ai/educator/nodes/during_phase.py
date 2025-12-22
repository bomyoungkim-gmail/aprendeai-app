"""
DURING Phase Handler

Handles active reading phase:
1. Responds to marked unknown words
2. Generates checkpoints
3. Provides scaffolding if needed
"""

from ..state import EducatorState
from llm_factory import get_cheap_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import logging

logger = logging.getLogger(__name__)


def handle(state: EducatorState) -> EducatorState:
    """
    Handle DURING phase - active reading with support.
    
    Responds to:
    - Unknown words marked
    - Checkpoint requests
    - Progress updates
    """
    
    context = state['context']
    session = context['session']
    parsed_events = state['parsed_events']
    user_text = state['user_text']
    
    logger.info(f"DURING phase handler for session {session['id']}")
    
    # 1. Check if user marked unknown words
    unknown_word_events = [e for e in parsed_events if e.get('eventType') == 'MARK_UNKNOWN_WORD']
    
    if unknown_word_events:
        words = [e['payloadJson']['word'] for e in unknown_word_events]
        words_str = ", ".join(words)
        
        logger.debug(f"User marked {len(words)} unknown words")
        
        # Acknowledge and encourage
        state['next_prompt'] = f"""Registrado: {words_str}

Ótimo trabalho identificando vocabulário novo! Continue lendo e marque outras palavras se precisar."""
        
        state['quick_replies'] = ["Continuar", "Ver micro-glossário"]
        
        # Events already parsed by QuickCommandParser in NestJS
        return state
    
    # 2. Check if checkpoint response
    checkpoint_events = [e for e in parsed_events if e.get('eventType') == 'CHECKPOINT_RESPONSE']
    
    if checkpoint_events:
        # User answered a checkpoint
        answer = checkpoint_events[0]['payloadJson'].get('answerText', '')
        
        logger.debug(f"User answered checkpoint: {answer[:50]}...")
        
        # Simple validation (in production, use LLM evaluation)
        if len(answer) > 20:
            state['next_prompt'] = """Boa resposta! Continue com a leitura."""
            state['quick_replies'] = ["Continuar"]
        else:
            state['next_prompt'] = """Tente elaborar mais sua resposta. 
            
O que você entendeu sobre este trecho?"""
            state['quick_replies'] = ["Repensar", "Continuar"]
        
        return state
    
    # 3. If user is just reading (no special events), generate checkpoint
    # Simple heuristic: every ~3-4 interactions
    # In production, this would be based on content structure
    
    if "continuar" in user_text.lower() or "pronto" in user_text.lower():
        logger.debug("Generating checkpoint")
        
        # Generate simple checkpoint question
        level = context['learner']['educationLevel']
        
        if level in ['FUNDAMENTAL_1', 'FUNDAMENTAL_2']:
            question = "O que aconteceu nesta parte do texto?"
        elif level == 'MEDIO':
            question = "Qual é a ideia principal deste trecho?"
        else:
            question = "Como este trecho se relaciona com o objetivo da sua leitura?"
        
        state['next_prompt'] = f"""Checkpoint (responda em 1 linha):

{question}"""
        
        state['quick_replies'] = []
        
        # Record checkpoint generated
        state['events_to_write'] = [{
            "eventType": "CHECKPOINT_GENERATED",
            "payloadJson": {
                "question": question,
                "blockId": "auto"
            }
        }]
        
        return state
    
    # 4. Default: encourage continuation
    state['next_prompt'] = """Continue com a leitura.

Lembre-se de marcar palavras desconhecidas com: /mark unknown: palavra1, palavra2"""
    
    state['quick_replies'] = ["Li mais", "Checkpoint", "Finalizar leitura"]
    
    return state
