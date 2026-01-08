"""
PRE Phase Handler

Handles pre-reading phase:
1. Goal setting
2. Prediction
3. Target words selection
"""

from ..state import EducatorState
from llm_factory import llm_factory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import logging

logger = logging.getLogger(__name__)


def handle(state: EducatorState) -> EducatorState:
    """
    Handle PRE phase of reading session.
    
    Flow:
    1. Check if goal set → Request goal
    2. Check if prediction set → Request prediction
    3. Check if target words set → Propose words
    4. Otherwise → Advance to DURING
    """
    
    context = state['context']
    session = context['session']
    user_text = state['user_text']
    
    logger.info(f"PRE phase handler for session {session['id']}")
    
    # NEW: Context Resurrection - Greet returning users
    resurrection = context.get('resurrection')
    if resurrection and not session.get('goalStatement'):
        # First interaction in this session - show resurrection context
        greeting_parts = []
        
        if resurrection.get('last_session_summary'):
            greeting_parts.append(f"📚 Bem-vindo de volta! {resurrection['last_session_summary']}")
        
        if resurrection.get('last_global_activity'):
            greeting_parts.append(f"🌍 {resurrection['last_global_activity']}")
        
        if greeting_parts:
            greeting = "\n\n".join(greeting_parts)
            state['next_prompt'] = f"""{greeting}

Meta do dia: em 1 linha, o que você quer entender neste texto?"""
            state['quick_replies'] = [
                "Continuar de onde parei",
                "Novo objetivo",
                "Revisar conceitos"
            ]
            
            # Telemetry: Track resurrection context usage
            state['events_to_write'] = [{
                "eventType": "CONTEXT_RESURRECTION_DISPLAYED",
                "payloadJson": {
                    "has_last_session": bool(resurrection.get('last_session_summary')),
                    "has_global_activity": bool(resurrection.get('last_global_activity'))
                }
            }]
            
            # If user just provided goal, append it
            if user_text and len(user_text) > 10:
                state['events_to_write'].append({
                    "eventType": "GOAL_SET",
                    "payloadJson": {"goalStatement": user_text}
                })
            
            return state
    
    # 1. Check if goal needed
    if not session.get('goalStatement'):
        logger.debug("Requesting goal statement")
        state['next_prompt'] = "Meta do dia: em 1 linha, o que você quer entender neste texto?"
        state['quick_replies'] = [
            "Conceitos principais",
            "Aplicações práticas",
            "Relação com outros temas"
        ]
        
        # If user just provided goal, save it as event
        if user_text and len(user_text) > 10:
            state['events_to_write'] = [{
                "eventType": "GOAL_SET",
                "payloadJson": {"goalStatement": user_text}
            }]
        
        return state
    
    # 2. Check if prediction needed
    if not session.get('predictionText'):
        logger.debug("Requesting prediction")
        state['next_prompt'] = f"""Previsão: olhando o título "{context['content']['title']}", 
do que você acha que o texto trata?"""
        state['quick_replies'] = []
        
        # If user just provided prediction, save it
        if user_text and len(user_text) > 10:
            state['events_to_write'] = [{
                "eventType": "PREDICTION_MADE",
                "payloadJson": {"predictionText": user_text}
            }]
        
        return state
    
    # 3. Check if target words needed
    if not session.get('targetWords') or len(session.get('targetWords', [])) == 0:
        logger.debug("Proposing target words")
        
        # Simple heuristic: suggest common academic words
        # In production, this would use the content text
        level = context['learner']['educationLevel']
        
        if level in ['FUNDAMENTAL_1', 'FUNDAMENTAL_2']:
            suggested_words = ["ideia", "exemplo", "causa", "efeito"]
        elif level == 'MEDIO':
            suggested_words = ["análise", "contexto", "inferir", "evidência"]
        else:
            suggested_words = ["paradigma", "hipótese", "síntese", "premissa"]
        
        words_str = ", ".join(suggested_words)
        
        state['next_prompt'] = f"""Palavras-alvo sugeridas: {words_str}

Você pode:
1. Confirmar estas palavras
2. Sugerir outras (digite as palavras separadas por vírgula)"""
        
        state['quick_replies'] = ["Confirmar", "Outras palavras"]
        
        # If user confirmed or provided words, save them
        if user_text:
            if "confirmar" in user_text.lower():
                words_to_save = suggested_words
            elif "," in user_text:
                words_to_save = [w.strip() for w in user_text.split(',')]
            else:
                words_to_save = suggested_words
            
            state['events_to_write'] = [{
                "eventType": "TARGET_WORDS_SET",
                "payloadJson": {"targetWords": words_to_save}
            }]
        
        return state
    
    # PRE phase complete!
    logger.info("PRE phase complete, suggesting transition to DURING")
    state['next_prompt'] = """Perfeito! Você está pronto para começar a leitura.

Use /mark unknown: palavra1, palavra2 se encontrar palavras difíceis.

Pronto para começar?"""
    state['quick_replies'] = ["Começar leitura", "Revisar meta"]
    
    # Suggest phase transition (NestJS will handle)
    state['events_to_write'] = [{
        "eventType": "PHASE_READY",
        "payloadJson": {"fromPhase": "PRE", "toPhase": "DURING"}
    }]
    
    return state
