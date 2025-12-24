"""
Tests for SITUATION_SIM game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.situation_sim import SituationSimGame


class TestSituationSimGame:
    @pytest.fixture
    def game(self):
        return SituationSimGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({}, difficulty=1)
        assert round_data['game_mode'] == "SITUATION_SIM"
        assert 'situation' in round_data['data']

    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 90,
            'feedback': 'Good decision',
            'decision_quality': 'excelente',
            'risks_considered': True
        }
        
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "I would verify logs first...")
        
        assert result['score'] > 0
        assert result['correct'] == True

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({}, 1)
        # Needs to contain "investigate" (correct_pattern) and be >= 15 words
        answer = "I will investigate the issue by checking database logs and server performance metrics immediately."
        
        result = await game.evaluate_answer(round_data, answer)
        
        assert 'score' in result
        assert result['breakdown']['method'] == 'heuristic'
