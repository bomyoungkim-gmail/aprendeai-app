"""
Tests for FEYNMAN_TEACHER game with LLM integration
"""
import sys
import pytest
from unittest.mock import Mock, AsyncMock
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from games.modes.feynman_teacher import FeynmanTeacherGame


@pytest.fixture
def game():
    """Create game instance"""
    return FeynmanTeacherGame()


@pytest.fixture
def game_with_llm():
    """Create game instance with mock LLM"""
    mock_llm = Mock()
    mock_llm.predict_json = AsyncMock()
    return FeynmanTeacherGame(llm_service=mock_llm)


@pytest.fixture
def sample_round_data():
    """Sample round data"""
    return {
        'game_mode': 'FEYNMAN_TEACHER',
        'prompt': 'Explain photosynthesis...',
        'difficulty': 2,
        'data': {
            'concept': 'Photosynthesis',
            'key_facts': ['Sunlight', 'Carbon Dioxide', 'Sugar']
        }
    }


class TestFeynmanTeacherGame:
    """Test suite for FeynmanTeacherGame"""
    
    def test_game_metadata(self, game):
        """Test game has correct metadata"""
        assert game.GAME_ID == "FEYNMAN_TEACHER"
        assert game.GAME_NAME == "Professor Feynman"
        assert game.GAME_INTENT == "creation"
        assert game.REQUIRES_CONTENT == True
        assert game.DURATION_MIN == 5
    
    def test_create_round(self, game):
        """Test round creation"""
        state = {'concept': 'Gravity'}
        round_data = game.create_round(state, difficulty=2)
        
        assert round_data['game_mode'] == 'FEYNMAN_TEACHER'
        assert 'Gravity' in round_data['prompt']
        assert round_data['difficulty'] == 2
        assert 'concept' in round_data['data']
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_success(self, game_with_llm, sample_round_data):
        """Test LLM evaluation succeeds"""
        # Mock LLM response
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 85,
            'feedback': 'Excelente explicação!',
            'strengths': ['Clara', 'Simples'],
            'improvements': []
        }
        
        answer = "Fotossíntese é quando plantas usam luz solar para fazer comida."
        result = await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        # Should use LLM
        game_with_llm.llm_service.predict_json.assert_called_once()
        
        # Check result
        assert result['score'] == 170  # 85 * 2
        assert result['max_score'] == 200
        assert result['correct'] == True
        assert 'llm_score' in result['breakdown']
        assert result['breakdown']['llm_score'] == 85
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_failure_uses_fallback(self, game_with_llm, sample_round_data):
        """Test falls back to heuristic when LLM fails"""
        # Mock LLM to raise exception
        game_with_llm.llm_service.predict_json.side_effect = Exception("LLM error")
        
        answer = "Fotossíntese usa Sunlight, Carbon Dioxide e faz Sugar"
        result = await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        # Should fallback to heuristic
        assert result['score'] == 200  # Heuristic score
        assert result['correct'] == True
        assert 'method' in result['breakdown']
        assert result['breakdown']['method'] == 'heuristic'
    
    @pytest.mark.asyncio
    async def test_evaluate_heuristic_good_coverage(self, game, sample_round_data):
        """Test heuristic with good fact coverage"""
        # Game without LLM
        answer = "Plants use Sunlight and Carbon Dioxide to make Sugar for energy."
        result = await game.evaluate_answer(sample_round_data, answer)
        
        # All 3 facts covered
        assert result['correct'] == True
        assert result['score'] == 200
        assert len(result['breakdown']['facts_covered']) == 3
    
    @pytest.mark.asyncio
    async def test_evaluate_heuristic_partial_coverage(self, game, sample_round_data):
        """Test heuristic with partial coverage"""
        answer = "Plants use Sunlight to make food."
        result = await game.evaluate_answer(sample_round_data, answer)
        
        # Only 1/3 facts = 33% < 60% threshold
        assert result['correct'] == False
        assert result['score'] == 50
        assert len(result['breakdown']['missing']) > 0
    
    @pytest.mark.asyncio
    async def test_llm_prompt_format(self, game_with_llm, sample_round_data):
        """Test LLM receives correctly formatted prompt"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 75,
            'feedback': 'Bom!',
            'strengths': [],
            'improvements': []
        }
        
        answer = "Test explanation"
        await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        call_args = game_with_llm.llm_service.predict_json.call_args
        prompt = call_args.kwargs['prompt']
        
        # Check prompt contains key elements
        assert 'Photosynthesis' in prompt
        assert 'Test explanation' in prompt
        assert 'Simplicidade' in prompt
        assert 'Clareza' in prompt
    
    @pytest.mark.asyncio
    async def test_llm_schema_validation(self, game_with_llm, sample_round_data):
        """Test LLM called with correct schema"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 80,
            'feedback': 'OK'
        }
        
        await game_with_llm.evaluate_answer(sample_round_data, "Test")
        
        call_args = game_with_llm.llm_service.predict_json.call_args
        schema = call_args.kwargs['schema']
        
        # Verify schema structure
        assert schema['type'] == 'object'
        assert 'score' in schema['properties']
        assert 'feedback' in schema['properties']
        assert schema['properties']['score']['minimum'] == 0
        assert schema['properties']['score']['maximum'] == 100
    
    @pytest.mark.asyncio
    async def test_temperature_setting(self, game_with_llm, sample_round_data):
        """Test LLM called with correct temperature"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 70,
            'feedback': 'Test'
        }
        
        await game_with_llm.evaluate_answer(sample_round_data, "Answer")
        
        call_args = game_with_llm.llm_service.predict_json.call_args
        temp = call_args.kwargs['temperature']
        
        assert temp == 0.7  # Expected temperature
