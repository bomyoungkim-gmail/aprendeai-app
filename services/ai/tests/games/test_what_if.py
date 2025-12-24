"""
Tests for WHAT_IF_SCENARIO game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.what_if import WhatIfScenarioGame


class TestWhatIfScenarioGame:
    
    @pytest.fixture
    def game(self):
        return WhatIfScenarioGame()
    
    @pytest.fixture
    def game_with_llm(self):
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock()
        return WhatIfScenarioGame(llm_service=mock_llm)
    
    @pytest.fixture
    def sample_state(self):
        return {
            'concept': 'Gravity',
            'phase': 'POST'
        }
    
    def test_create_round(self, game, sample_state):
        round_data = game.create_round(sample_state, difficulty=1)
        
        assert round_data['game_mode'] == "WHAT_IF_SCENARIO"
        assert 'Gravity' in round_data['prompt']
        assert 'scenario' in round_data['data']
        assert "Gravity" in round_data['data']['scenario']

    @pytest.mark.asyncio
    async def test_evaluate_with_llm(self, game_with_llm, sample_state):
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 90,
            'feedback': 'Great prediction!',
            'plausibility': 'alta',
            'count_consequences': 3
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "Everything would start floating.")
        
        assert result['score'] == 108  # 90 * 1.2
        assert result['correct'] == True
        assert result['breakdown']['plausibility'] == 'alta'

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game, sample_state):
        round_data = game.create_round(sample_state, 1)
        # Ensure round_data has the validation keys needed for heuristic
        if 'key_consequences' not in round_data['data']:
             round_data['data']['key_consequences'] = ['consequence']
             
        result = await game.evaluate_answer(round_data, "This will lead to a major consequence.")
        
        assert 'score' in result
        assert result['breakdown']['method'] == 'heuristic'
