"""
Tests for MISCONCEPTION_HUNT game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.misconception_hunt import MisconceptionHuntGame


class TestMisconceptionHuntGame:
    @pytest.fixture
    def game(self):
        return MisconceptionHuntGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({}, difficulty=1)
        assert round_data['game_mode'] == "MISCONCEPTION_HUNT"
        assert 'statements' in round_data['data']

    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 100,
            'feedback': 'Good job',
            'identified_correctly': True,
            'explanation_quality': 'boa'
        }
        
        round_data = game.create_round({}, 1)
        # Assuming statement 1 is the misconception
        result = await game.evaluate_answer(round_data, "Statement 1 is wrong because...")
        
        assert result['score'] > 0
        assert result['correct'] == True

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({}, 1)
        # Attempt to match key words for fallback
        # In mock implementation, maybe it checks for "statement" or specific logic
        # For now just ensure it doesn't crash
        result = await game.evaluate_answer(round_data, "I think statement 1 is incorrect")
        assert 'score' in result
