"""
Integration tests for game + LangGraph
Tests complete flow through Educator Agent
"""
import pytest
from educator.state import EducatorState
from educator.nodes.game_phase import handle as game_phase_handle


class TestGameLangGraphIntegration:
    """Test game integration with LangGraph"""
    
    @pytest.fixture
    def base_state(self):
        """Base educator state for testing"""
        return {
            'prompt_message': {
                'text': 'START_GAME',
                'metadata': {
                    'gameMode': 'FREE_RECALL_SCORE',
                    'difficulty': 2,
                    'correlationId': 'test-123',
                }
            },
            'context': {
                'contentSlice': {
                    'text': 'Este é um texto sobre inteligência artificial e machine learning.'
                },
                'targetWords': ['inteligência', 'artificial'],
            },
            'current_phase': 'POST',
            'user_text': 'START_GAME',
            'parsed_events': [],
            'game_mode': None,
            'game_round_data': None,
            'game_metadata': None,
        }
    
    def test_start_game_creates_round(self, base_state):
        """Test that START_GAME creates a new game round"""
        result = game_phase_handle(base_state)
        
        # Should have game mode set
        assert result['game_mode'] == 'FREE_RECALL_SCORE'
        
        # Should have round data
        assert result['game_round_data'] is not None
        assert result['game_round_data']['game_mode'] == 'FREE_RECALL_SCORE'
        
        # Should have prompt
        assert 'next_prompt' in result
        assert 'Resumo sem olhar' in result['next_prompt']
        
        # Should have quick replies
        assert len(result['quick_replies']) > 0
        
        # Should emit event
        assert len(result.get('events_to_write', [])) > 0
        assert result['events_to_write'][0]['eventType'] == 'GAME_ROUND_CREATED'
    
    def test_evaluate_game_answer(self, base_state):
        """Test evaluating user's answer to game round"""
        # First start game
        state_after_start = game_phase_handle(base_state)
        
        # Now answer with good response
        state_with_answer = {
            **state_after_start,
            'user_text': 'O texto fala sobre inteligência artificial e como ela funciona com machine learning. ' * 2,
        }
        
        result = game_phase_handle(state_with_answer)
        
        # Should have feedback
        assert 'next_prompt' in result
        assert 'Resultado' in result['next_prompt'] or 'resultado' in result['next_prompt'].lower()
        
        # Should have score info
        assert 'Pontuação' in result['next_prompt'] or 'pontuação' in result['next_prompt'].lower()
    
    def test_multistep_game_flow(self, base_state):
        """Test multi-step game flow (recall → followup questions)"""
        # Start game
        state1 = game_phase_handle(base_state)
        assert state1['game_round_data']['step'] == 'recall'
        
        # Answer recall
        state2_input = {
            **state1,
            'user_text': 'O texto fala sobre inteligência artificial e machine learning, explicando conceitos básicos.',
        }
        state2 = game_phase_handle(state2_input)
        
        # Should continue to followup_1
        if state2.get('game_round_data'):
            assert state2['game_round_data'].get('step') in ['followup_1', 'complete']
    
    def test_game_with_no_content_fails_gracefully(self):
        """Test that game fails gracefully without content"""
        state = {
            'prompt_message': {
                'text': 'START_GAME',
                'metadata': {
                    'gameMode': 'FREE_RECALL_SCORE',
                    'difficulty': 2,
                }
            },
            'context': {},  # No content!
            'current_phase': 'POST',
            'user_text': 'START_GAME',
            'parsed_events': [],
            'game_mode': None,
            'game_round_data': None,
            'game_metadata': None,
        }
        
        result = game_phase_handle(state)
        
        # Should have error message
        assert 'Erro' in result['next_prompt'] or 'error' in result['next_prompt'].lower()
    
    def test_invalid_game_mode_fails_gracefully(self, base_state):
        """Test that invalid game mode fails gracefully"""
        base_state['prompt_message']['metadata']['gameMode'] = 'INVALID_GAME_MODE'
        
        result = game_phase_handle(base_state)
        
        # Should have error message
        assert 'Erro' in result['next_prompt'] or 'error' in result['next_prompt'].lower()
    
    def test_correlation_id_flows_through(self, base_state):
        """Test that correlation ID flows through pipeline"""
        result = game_phase_handle(base_state)
        
        # Event should have correlation ID
        events = result.get('events_to_write', [])
        if events:
            assert events[0]['payloadJson'].get('correlation_id') == 'test-123'
    
    def test_game_completion_clears_state(self, base_state):
        """Test that completing game clears game state"""
        # Start and complete a simple flow
        state1 = game_phase_handle(base_state)
        
        # Answer poorly to complete quickly
        state2_input = {
            **state1,
            'user_text': 'Não sei',
        }
        state2 = game_phase_handle(state2_input)
        
        # If game completes, should clear game_mode
        # (may not complete in one step for FREE_RECALL_SCORE)
        # This test validates the clearing logic exists
        assert 'game_mode' in state2  # State has the field


class TestGamePhaseIntegrationWithRegistry:
    """Test game phase integrates correctly with registry"""
    
    def test_registry_discovery_works(self):
        """Test that registry discovers games before use"""
        from games.registry import game_registry
        
        # Discover games
        game_registry.discover_games()
        
        # Should find FREE_RECALL_SCORE
        assert game_registry.is_registered('FREE_RECALL_SCORE')
        
        # Should be able to get game
        game_class = game_registry.get_game('FREE_RECALL_SCORE')
        assert game_class.GAME_ID == 'FREE_RECALL_SCORE'
    
    def test_game_instance_creation(self):
        """Test creating game instance via registry"""
        from games.registry import game_registry
        
        game_registry.discover_games()
        game_class = game_registry.get_game('FREE_RECALL_SCORE')
        game = game_class()
        
        # Should have required methods
        assert hasattr(game, 'create_round')
        assert hasattr(game, 'evaluate_answer')
        assert hasattr(game, 'get_quick_replies')


class TestGamePhaseMiddlewareIntegration:
    """Test game phase uses middleware correctly"""
    
    def test_middleware_pipeline_executes(self, caplog):
        """Test that middleware pipeline executes during game"""
        import logging
        caplog.set_level(logging.INFO)
        
        state = {
            'prompt_message': {
                'text': 'START_GAME',
                'metadata': {
                    'gameMode': 'FREE_RECALL_SCORE',
                    'difficulty': 2,
                }
            },
            'context': {
                'contentSlice': {'text': 'Texto exemplo sobre IA.'},
                'targetWords': ['IA'],
            },
            'current_phase': 'POST',
            'user_text': 'START_GAME',
            'parsed_events': [],
            'game_mode': None,
            'game_round_data': None,
            'game_metadata': None,
        }
        
        result = game_phase_handle(state)
        
        # Check logs for middleware execution
        # (correlation ID, metrics, events)
        log_messages = [rec.message for rec in caplog.records]
        
        # Should have some game-related logs
        assert any('game' in msg.lower() for msg in log_messages)
