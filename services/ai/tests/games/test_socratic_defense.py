"""
Tests for SOCRATIC_DEFENSE game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.socratic_defense import SocraticDefenseGame


class TestSocraticDefenseGame:
    @pytest.fixture
    def game(self):
        return SocraticDefenseGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({'claim': 'AI is good'}, difficulty=1)
        assert round_data['game_mode'] == "SOCRATIC_DEFENSE"
        # Implementation might put question in prompt string, not as separate key
        assert 'AI is good' in round_data['prompt'] or 'challenge' in round_data['prompt'].lower()
        
    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 88,
            'feedback': 'Profound',
            'depth_level': 'profundo',
            'improvements': []
        }
        
        round_data = game.create_round({'claim': 'Claim'}, 1)
        result = await game.evaluate_answer(round_data, "This is complex because...")
        
        assert result['score'] > 0
        assert result['breakdown']['depth_level'] == 'profundo'

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({'claim': 'Claim'}, 1)
        # Heuristic likely checks length and markers
        result = await game.evaluate_answer(round_data, "However, on the other hand, it depends on context.")
        assert 'score' in result
