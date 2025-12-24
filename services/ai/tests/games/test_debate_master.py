"""
Tests for DEBATE_MASTER game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.debate_master import DebateMasterGame


class TestDebateMasterGame:
    @pytest.fixture
    def game(self):
        return DebateMasterGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({'topic': 'AI is dangerous'}, difficulty=1)
        assert round_data['game_mode'] == "DEBATE_MASTER"
        # Check for key prompt elements from implementation
        assert 'Mestre do Debate' in round_data['prompt']
        assert 'Sua Posição' in round_data['prompt']

    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 92,
            'feedback': 'Strong argument',
            'argument_strength': 'forte',
            'has_evidence': True
        }
        
        round_data = game.create_round({'topic': 'Topic'}, 1)
        result = await game.evaluate_answer(round_data, "I argue that...")
        
        assert result['score'] > 0
        assert result['correct'] == True

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({'topic': 'Topic'}, 1)
        # Heuristic likely checks for word count and connectors
        result = await game.evaluate_answer(round_data, "Therefore we can conclude that this is true because of evidence.")
        assert 'score' in result
