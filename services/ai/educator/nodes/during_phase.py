"""
DURING Phase Handler

Handles active reading phase:
1. Responds to marked unknown words
2. Generates checkpoints
3. Provides scaffolding if needed
"""

from ..state import EducatorState

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
    
    # 3. Highlight-Driven Interventions (Gap 8)
    highlights = context.get('content', {}).get('highlights', {})
    flow_state = context.get('flowState', {}) # From NestJS enrichment
    
    # 3a. Prioritize Doubts (if any)
    if highlights.get('doubts'):
        recent_doubt = highlights['doubts'][-1] # Most recent
        # Check if we haven't addressed it yet (simple heuristic or use parsed events history)
        # For now, if user hasn't asked anything specific, offer help on doubt
        
        logger.info(f"Addressing recent doubt: {recent_doubt['text']}")
        
        state['next_prompt'] = f"""Vi que você marcou uma dúvida em: "{recent_doubt['text']}".
        
Quer que eu explique isso melhor ou prefere seguir adiante?"""
        state['quick_replies'] = ["Explicar", "Seguir"]
        return state

    # 3b. Flow State Check (suppress proactive interruptions)
    if flow_state.get('isInFlow') and flow_state.get('confidence', 0) > 0.8:
        logger.info("User in High Flow - suppressing proactive checkpoint")
        # Only respond if user explicitly asked something, otherwise be quiet/supportive
        if not user_text or len(user_text) < 5:
             state['next_prompt'] = None # No-op (or minimal ack)
             # Note: In a chat interface, returning None might mean no message. 
             # Or return a passive "standing by" indicator.
             # For now, let's just let them read unless they explicitly engaged.
             state['next_prompt'] = "..." # Subtle indicator
             return state

    # 3c. Generate Checkpoint from Main Ideas (if adequate content marked)
    if "checkpoint" in user_text.lower() or ("continuar" in user_text.lower() and len(parsed_events) > 3):
        logger.debug("Generating checkpoint from highlights")
        
        main_ideas = highlights.get('mainItems', [])
        question = ""
        
        if main_ideas:
             # Use a main idea to form a question
             target_idea = main_ideas[-1]['text']
             question = f"Sobre '{target_idea[:30]}...', qual é a conclusão principal?"
        else:
             # Fallback to level-based generic
             level = context['learner']['educationLevel']
             if level in ['FUNDAMENTAL_1', 'FUNDAMENTAL_2']:
                question = "O que aconteceu nesta parte do texto?"
             else:
                question = "Qual é a ideia principal deste trecho?"

        state['next_prompt'] = f"""Checkpoint:

{question}"""
        state['quick_replies'] = []
        state['events_to_write'] = [{"eventType": "CHECKPOINT_GENERATED", "payloadJson": {"question": question, "blockId": "auto"}}]
        return state
    
    # 4. Default: encourage continuation
    state['next_prompt'] = """Continue com a leitura.

Lembre-se de marcar palavras desconhecidas com: /mark unknown: palavra1, palavra2"""
    
    state['quick_replies'] = ["Li mais", "Checkpoint", "Finalizar leitura"]
    
    return state
