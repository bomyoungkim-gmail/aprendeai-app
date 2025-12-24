"""
Tests for RECOMMENDATION_ENGINE game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.recommendation import RecommendationGame


class TestRecommendationGame:
    @pytest.fixture
    def game(self):
        return RecommendationGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({}, difficulty=1)
        assert round_data['game_mode'] == "RECOMMENDATION_ENGINE"
        assert 'profile' in round_data['data']

    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 90,
            'feedback': 'Good rec',
            'relevance': 'alta',
            'well_justified': True
        }
        
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "I recommend this tool because...")
        
        assert result['score'] == 90
        assert result['breakdown']['relevance'] == 'alta'

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "I recommend tool X")
        assert 'score' in result
