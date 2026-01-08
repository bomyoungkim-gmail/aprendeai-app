"""
POST Phase Handler

Handles post-reading consolidation:
1. Free recall
2. Quiz
3. Vocabulary coach (for blockers)
4. Production task
"""

from ..state import EducatorState
from llm_factory import get_smart_llm  # Use smarter model for POST
from langchain_core.prompts import ChatPromptTemplate
import logging

logger = logging.getLogger(__name__)


def handle(state: EducatorState) -> EducatorState:
    """
    Handle POST phase - consolidation and production.
    
    Sequential flow:
    1. Free Recall → 2. Quiz → 3. Vocab Coach → 4. Production → 5. Complete
    """
    
    context = state['context']
    session = context['session']
    parsed_events = state['parsed_events']
    user_text = state['user_text']
    
    logger.info(f"POST phase handler for session {session['id']}")
    
    # Track what's been completed (would come from session events in production)
    # For Phase 2a, we'll use simple text matching
    
    # 1. Check if free recall done
    if not has_done_activity(parsed_events, 'FREE_RECALL'):
        logger.debug("Requesting free recall")
        
        state['next_prompt'] = """Recall livre (2-3 linhas):

Sem olhar o texto, o que você entendeu/aprendeu?"""
        
        state['quick_replies'] = []
        
        # If user provided recall text, save it
        if user_text and len(user_text) > 30:
            state['events_to_write'] = [{
                "eventType": "PRODUCTION_SUBMIT",
                "payloadJson": {
                    "type": "FREE_RECALL",
                    "text": user_text
                }
            }]
        
        return state
    
    # 2. Check if quiz done
    if not has_done_activity(parsed_events, 'QUIZ_RESPONSE'):
        logger.debug("Generating quiz question")
        
        # Prioritize questions from user's MAIN_IDEA annotations
        session_annotations = context.get('sessionAnnotations', {})
        main_ideas = session_annotations.get('mainIdeas', [])
        doubts = session_annotations.get('doubts', [])
        
        question = None
        
        # Strategy 1: Use MAIN_IDEA annotations (what user marked as important)
        if main_ideas and len(main_ideas) > 0:
            idea = main_ideas[0]  # Take the most recent
            idea_text = idea.get('text', '')[:80]  # Truncate for readability
            question = f'Explique em suas palavras: "{idea_text}..."'
            logger.debug(f"Quiz from MAIN_IDEA annotation")
        
        # Strategy 2: Use DOUBT annotations (what user didn't understand)
        elif doubts and len(doubts) > 0:
            doubt = doubts[0]
            doubt_text = doubt.get('text', '')[:80]
            question = f'Você marcou dúvida em: "{doubt_text}...". O que você entendeu agora?'
            logger.debug(f"Quiz from DOUBT annotation")
        
        # Strategy 3: Fallback to target words (vocabulary)
        elif session.get('targetWords'):
            word = session['targetWords'][0]
            question = f'Qual o significado de "{word}" no contexto do texto?'
            logger.debug(f"Quiz from target words")
        
        # Strategy 4: Generic comprehension
        else:
            question = "Qual foi a principal conclusão do texto?"
            logger.debug(f"Quiz generic")
        
        state['next_prompt'] = f"""Quiz:

{question}"""
        
        state['quick_replies'] = []
        
        # If user answered, save it
        if user_text and len(user_text) > 10:
            state['events_to_write'] = [{
                "eventType": "QUIZ_RESPONSE",
                "payloadJson": {
                    "quizId": "auto",
                    "questionId": "q1",
                    "answerText": user_text
                }
            }]
        
        return state
    
    # 3. Check if vocab coach needed
    vocab_focus = context['vocabFocus']
    
    if vocab_focus.get('hasBlockers') and not has_done_activity(parsed_events, 'VOCAB_COACH'):
        logger.debug("Vocab coach activated for blockers")
        
        due_words = vocab_focus.get('dueWords', [])[:3]
        words_str = ", ".join([w.get('word', '') for w in due_words])
        
        state['next_prompt'] = f"""Vocab Coach:

Você tem {vocab_focus['totalDue']} palavras para revisar.

Top 3: {words_str}

Use essas palavras em 1 frase cada."""
        
        state['quick_replies'] = ["Pular vocab", "Fazer frases"]
        
        if "pular" not in user_text.lower() and len(user_text) > 20:
            state['events_to_write'] = [{
                "eventType": "VOCAB_COACH_COMPLETED",
                "payloadJson": {"text": user_text}
            }]
        
        return state
    
    # 4. Check if production done
    if not has_done_activity(parsed_events, 'PRODUCTION_SENTENCES'):
        logger.debug("Requesting production task")
        
        target_words = session.get('targetWords', [])[:3]
        words_str = ", ".join(target_words) if target_words else "palavras-alvo"
        
        state['next_prompt'] = f"""Produção final:

Use {words_str} em 2 frases sobre o que você aprendeu."""
        
        state['quick_replies'] = []
        
        if user_text and len(user_text) > 30:
            state['events_to_write'] = [{
                "eventType": "PRODUCTION_SUBMIT",
                "payloadJson": {
                    "type": "SENTENCES",
                    "text": user_text,
                    "usedWords": target_words
                }
            }]
        
        return state
    
    # POST phase complete!
    logger.info("POST phase complete, session ready to finish")
    
    state['next_prompt'] = """Parabéns! Você completou todas as etapas.

Sessão pronta para finalizar. 🎉"""
    
    state['quick_replies'] = ["Finalizar", "Revisar algo"]
    
    state['events_to_write'] = [{
        "eventType": "POST_PHASE_COMPLETE",
        "payloadJson": {"completed": True}
    }]
    
    return state


def has_done_activity(parsed_events: list, activity_type: str) -> bool:
    """
    Check if activity has been completed.
    
    Args:
        parsed_events: List of parsed events
        activity_type: Type to check (FREE_RECALL, QUIZ_RESPONSE, etc.)
    
    Returns:
        True if activity found in events
    """
    for event in parsed_events:
        event_type = event.get('eventType', '')
        payload = event.get('payloadJson', {})
        
        # Check direct event type match
        if activity_type in event_type:
            return True
        
        # Check production type
        if event_type == 'PRODUCTION_SUBMIT':
            if payload.get('type') == activity_type:
                return True
    
    return False
