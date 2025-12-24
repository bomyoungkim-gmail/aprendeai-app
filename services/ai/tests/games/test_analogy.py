"""
Tests for ANALOGY_MAKER game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.analogy_maker import AnalogyMakerGame


class TestAnalogyMakerGame:
    
    @pytest.fixture
    def game(self):
        return AnalogyMakerGame()
    
    @pytest.fixture
    def game_with_llm(self):
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock()
        return AnalogyMakerGame(llm_service=mock_llm)
    
    @pytest.fixture
    def sample_state(self):
        return {
            'concept': 'Mitochondria',
            'phase': 'POST'
        }
    
    def test_create_round(self, game, sample_state):
        round_data = game.create_round(sample_state, difficulty=1)
        
        assert round_data['game_mode'] == "ANALOGY_MAKER"
        assert 'Mitochondria' in round_data['prompt']
        assert 'concept' in round_data['data']
        assert round_data['data']['concept'] == 'Mitochondria'

    @pytest.mark.asyncio
    async def test_evaluate_with_llm(self, game_with_llm, sample_state):
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 85,
            'feedback': 'Creative!',
            'creativity_level': 'alta',
            'improvements': []
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "It is like a power plant for the cell.")
        
        assert result['score'] == 127  # 85 * 1.5
        assert result['correct'] == True
        assert result['breakdown']['creativity'] == 'alta'

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game, sample_state):
        round_data = game.create_round(sample_state, 1)
        # Needs >= 10 words and comparison word (like 'como') to get score
        result = await game.evaluate_answer(round_data, "I think it is just like a battery that stores power.")
        
        # 10 words (check) + "like" (mapped to "como" logic in strict check or just length)
        # Actually implementation checks ["como", "igual", "semelhante", "parecido"]
        # So let's use portuguese for safety or update implementation to include english
        result = await game.evaluate_answer(round_data, "O conceito é como uma bateria que guarda energia para depois.")
        
        assert result['score'] > 0
        assert result['breakdown']['method'] == 'heuristic'
