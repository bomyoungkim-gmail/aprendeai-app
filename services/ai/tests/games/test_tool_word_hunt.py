"""
Tests for TOOL_WORD_HUNT game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.tool_word_hunt import ToolWordHuntGame


class TestToolWordHuntGame:
    @pytest.fixture
    def game(self):
        return ToolWordHuntGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({}, difficulty=1)
        assert round_data['game_mode'] == "TOOL_WORD_HUNT"
        assert 'text' in round_data['data']

    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 85,
            'feedback': 'Good analysis',
            'found_quote': True,
            'meaning_clear': True,
            'analyzed_purpose': True
        }
        
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "The quote is 'xyz' and it means...")
        
        assert result['score'] > 0
        assert result['breakdown']['found_quote'] == True

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "quote: test | analysis: test")
        assert 'score' in result
