"""
Tests for FREE_RECALL game with LLM integration
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.free_recall import FreeRecallGame


@pytest.fixture
def game():
    return FreeRecallGame()


@pytest.fixture
def game_with_llm():
    mock_llm = Mock()
    mock_llm.predict_json = AsyncMock()
    return FreeRecallGame(llm_service=mock_llm)


@pytest.fixture
def sample_round_data():
    return {
        'game_mode': 'FREE_RECALL_SCORE',
        'prompt': 'Summarize what you remember...',
        'difficulty': 2,
        'data': {
            'topic': 'Fotossíntese',
            'reference_content': 'A fotossíntese é o processo pelo qual plantas convertem luz solar, água e CO2 em glicose e oxigênio.',
            'key_points': ['luz', 'CO2', 'glicose', 'oxigênio']
        }
    }


class TestFreeRecallGame:
    
    def test_game_metadata(self, game):
        assert game.GAME_ID == "FREE_RECALL_SCORE"
        assert game.GAME_NAME == "Resumo Livre"
        assert game.GAME_INTENT == "recall"
        assert game.REQUIRES_CONTENT == True
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_accuracy(self, game_with_llm, sample_round_data):
        """Test LLM evaluates factual accuracy"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 85,
            'feedback': 'Resumo preciso e completo!',
            'accuracy': 'alta',
            'main_points_covered': 4,
            'factual_errors': []
        }
        
        answer = "Plantas usam luz solar e CO2 para fazer glicose e liberar oxigênio."
        result = await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        assert result['score'] == 170  # 85 * 2
        assert result['correct'] == True
        assert result['breakdown']['accuracy'] == 'alta'
        assert result['breakdown']['points_covered'] == 4
        assert len(result['breakdown']['errors']) == 0
    
    @pytest.mark.asyncio
    async def test_llm_detects_factual_errors(self, game_with_llm, sample_round_data):
        """Test LLM detects factual errors"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 40,
            'feedback': 'Contém erros factuais.',
            'accuracy': 'baixa',
            'main_points_covered': 2,
            'factual_errors': ['Produz nitrogênio (not oxygen)']
        }
        
        answer = "Plantas fazem fotossíntese e produzem nitrogênio."
        result = await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        assert result['score'] == 80  # 40 * 2
        assert result['correct'] == False
        assert len(result['breakdown']['errors']) > 0
    
    @pytest.mark.asyncio
    async def test_fallback_coverage_good(self, game, sample_round_data):
        """Test heuristic with good key point coverage"""
        answer = "Fotossíntese usa luz solar e CO2 para produzir glicose e liberar oxigênio."
        result = await game.evaluate_answer(sample_round_data, answer)
        
        # All 4 key points covered
        assert len(result['breakdown']['points_found']) == 4
        assert result['correct'] == True
    
    @pytest.mark.asyncio
    async def test_temperature_low_for_factual(self, game_with_llm, sample_round_data):
        """Test uses lower temperature for factual evaluation"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 75, 'feedback': 'OK', 'accuracy': 'média'
        }
        
        await game_with_llm.evaluate_answer(sample_round_data, "Test")
        
        call_args = game_with_llm.llm_service.predict_json.call_args
        temp = call_args.kwargs['temperature']
        
        assert temp == 0.6  # Lower for factual tasks
