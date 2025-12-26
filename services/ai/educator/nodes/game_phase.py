"""
Game Phase Node - Handles game rounds

Integrated into Educator Agent LangGraph.
Triggered when user_text = "START_GAME" or when in active game.
"""
from typing import Dict, Any
import logging
from ..state import EducatorState
from games.registry import game_registry
from games.middleware import GamePipeline, CorrelationIdMiddleware, MetricsMiddleware, EventEmitterMiddleware

logger = logging.getLogger(__name__)
from utils.dataset_collector import dataset_collector


# Create default game pipeline
game_pipeline = GamePipeline([
    CorrelationIdMiddleware(),
    MetricsMiddleware(),
    EventEmitterMiddleware(),
])


async def handle(state: EducatorState) -> EducatorState:
    """
    Handle game phase - create round or evaluate answer.
    
    Flow:
    1. Check if starting new game (START_GAME) or continuing
    2. If new: create round using game registry
    3. If continuing: evaluate answer
    4. Return updated state with prompt and quick replies
    """
    logger.info("Game phase handler called")
    
    user_text = state.get('user_text', '').strip()
    game_mode = state.get('game_mode')
    game_round_data = state.get('game_round_data')
    
    # Check if starting new game
    if user_text.upper() == 'START_GAME' or game_mode is None:
        return _start_new_game(state)
    
    # Continuing existing game - evaluate answer
    elif game_round_data:
        return await _evaluate_game_answer(state)
    
    else:
        # No active game - should not happen
        logger.warning("Game phase called but no active game")
        return {
            **state,
            'next_prompt': "❌ Nenhum jogo ativo. Use START_GAME para iniciar um jogo.",
            'quick_replies': [],
        }


def _start_new_game(state: EducatorState) -> EducatorState:
    """Start a new game round"""
    
    # Get game mode from metadata
    metadata = state.get('prompt_message', {}).get('metadata', {})
    game_mode = metadata.get('gameMode', 'FREE_RECALL_SCORE')  # Default for testing
    difficulty = metadata.get('difficulty', 2)
    
    logger.info(f"Starting new game: {game_mode}")
    
    try:
        # Get game class from registry
        game_registry.discover_games()  # Ensure games are discovered
        game_class = game_registry.get_game(game_mode)
        game = game_class()
        
        # Build pedagogical state from context
        context = state.get('context', {})
        ped_state = {
            'content_slice': context.get('contentSlice', {}).get('text', ''),
            'target_words': context.get('targetWords', []),
            'phase': state.get('current_phase', 'POST'),
            'learner_profile': context.get('learner', {}), # Pass user preferences
        }
        
        # Create round using pipeline
        round_context = {
            'metadata': metadata,
            'correlation_id': metadata.get('correlationId'),
        }
        
        def create_round_handler(ctx):
            return game.create_round(ped_state, difficulty)
        
        round_data = game_pipeline.execute(round_context, create_round_handler)
        
        # Get quick replies
        quick_replies = game.get_quick_replies(round_data)
        
        # Build events
        events = [
            {
                'domain': 'GAME',
                'eventType': 'GAME_ROUND_CREATED',
                'payloadJson': {
                    'game_mode': game_mode,
                    'difficulty': difficulty,
                    'correlation_id': metadata.get('correlationId'),
                }
            }
        ]
        
        # Update state - preserve all existing fields and add game fields
        updated_state = {
            **state,  # Preserve all existing state
            'game_mode': game_mode,
            'game_round_data': round_data,
            'game_metadata': metadata,
            'next_prompt': round_data['prompt'],
            'quick_replies': quick_replies,
            'events_to_write': events,
        }
        
        return updated_state
        
    except Exception as e:
        logger.error(f"Failed to start game: {e}", exc_info=True)
        return {
            **state,
            'next_prompt': f"❌ Erro ao iniciar jogo: {str(e)}",
            'quick_replies': [],
        }


async def _evaluate_game_answer(state: EducatorState) -> EducatorState:
    """Evaluate user's answer to game round"""
    
    game_mode = state['game_mode']
    game_round_data = state['game_round_data']
    user_text = state['user_text']
    
    logger.info(f"Evaluating answer for game: {game_mode}")
    
    try:
        # Get game instance
        game_class = game_registry.get_game(game_mode)
        game = game_class()
        
        # Evaluate using pipeline
        eval_context = {
            'game_mode': game_mode,
            'metadata': state.get('game_metadata', {}),
            'correlation_id': state.get('game_metadata', {}).get('correlationId'),
        }
        
        async def evaluate_handler(ctx):
            return await game.evaluate_answer(game_round_data, user_text)
        
        result = await game_pipeline.execute_async(eval_context, evaluate_handler)
        
        # Build feedback prompt
        feedback = result['feedback']
        score = result['score']
        max_score = result['max_score']
        
        prompt = (
            f"📊 **Resultado:**\n\n"
            f"{feedback}\n\n"
            f"Pontuação: {score}/{max_score}\n\n"
            f"Pontuação: {score}/{max_score}\n\n"
        )
        
        # [NEW] Log dataset for fine-tuning
        try:
            # Extract user_id from metadata or context if available
            # state.get('context', {}).get('learner', {}).get('id')
            user_id = state.get('context', {}).get('learner', {}).get('id', 'unknown')
            
            # Fire and forget logging
            await dataset_collector.log_interaction(
                game_mode=game_mode,
                user_id=user_id,
                prompt_data=game_round_data,
                user_answer=user_text,
                evaluation_result=result
            )
        except Exception as log_error:
            logger.warning(f"Failed to log interaction: {log_error}")
        
        # Check if game continues (multi-step games)
        if hasattr(game, 'get_next_step'):
            current_step = game_round_data.get('step', 'complete')
            next_step = game.get_next_step(current_step)
            
            if next_step != 'complete' and hasattr(game, 'get_followup_prompt'):
                # Continue to next step
                followup_prompt = game.get_followup_prompt(next_step)
                game_round_data['step'] = next_step
                
                prompt += followup_prompt
                quick_replies = game.get_quick_replies(game_round_data)
                
                return {
                    **state,
                    'game_round_data': game_round_data,
                    'next_prompt': prompt,
                    'quick_replies': quick_replies,
                }
        
        # Game complete
        prompt += "🎮 Jogo concluído! Use START_GAME para jogar novamente."
        
        return {
            **state,
            'game_mode': None,  # Clear game
            'game_round_data': None,
            'next_prompt': prompt,
            'quick_replies': ['Novo jogo', 'Voltar ao texto'],
            'events_to_write': [
                {
                    'domain': 'GAME',
                    'eventType': 'GAME_ROUND_EVALUATED',
                    'payloadJson': {
                        'game_mode': game_mode,
                        'score': score,
                        'max_score': max_score,
                        **result.get('breakdown', {}),
                    }
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to evaluate answer: {e}", exc_info=True)
        return {
            **state,
            'next_prompt': f"❌ Erro ao avaliar resposta: {str(e)}",
            'quick_replies': [],
        }
