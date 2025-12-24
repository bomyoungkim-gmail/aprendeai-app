"""
Tests for CONCEPT_LINKING game with LLM integration (two-stage: rules + LLM)
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.concept_linking import ConceptLinkingGame


@pytest.fixture
def game():
    return ConceptLinkingGame()


@pytest.fixture
def game_with_llm():
    mock_llm = Mock()
    mock_llm.predict_json = AsyncMock()
    return ConceptLinkingGame(llm_service=mock_llm)


@pytest.fixture
def sample_round_data():
    return {
        'game_mode': 'CONCEPT_LINKING',
        'prompt': 'Describe Democracy...',
        'difficulty': 2,
        'data': {
            'target_word': 'Democracy',
            'forbidden_words': ['vote', 'election', 'government', 'people']
        }
    }


class TestConceptLinkingGame:
    
    def test_game_metadata(self, game):
        assert game.GAME_ID == "CONCEPT_LINKING"
        assert game.GAME_NAME == "Taboo de Conceitos"
        assert game.DURATION_MIN == 3
    
    @pytest.mark.asyncio
    async def test_rule_check_violation(self, game_with_llm, sample_round_data):
        """Test rule check catches forbidden word"""
        answer = "It's a system where people vote for leaders."
        result = await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        # Should fail immediately without calling LLM
        assert result['score'] == 0
        assert result['correct'] == False
        assert 'violations' in result['breakdown']
        assert len(result['breakdown']['violations']) > 0
        
        # LLM should NOT have been called
        game_with_llm.llm_service.predict_json.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_passes_rule_check_then_llm(self, game_with_llm, sample_round_data):
        """Test passes rule check, then LLM evaluates quality"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 85,
            'feedback': 'Descrição clara e identificável!',
            'identifiable': True
        }
        
        answer = "A system where citizens choose leaders through fair processes."
        result = await game_with_llm.evaluate_answer(sample_round_data, answer)
        
        # LLM should have been called
        game_with_llm.llm_service.predict_json.assert_called_once()
        
        assert result['score'] == 85
        assert result['correct'] == True
        assert result['breakdown']['llm_score'] == 85
    
    @pytest.mark.asyncio
    async def test_fallback_after_rule_check(self, game, sample_round_data):
        """Test heuristic fallback after passing rule check"""
        answer = "A system where citizens have freedom and rights."
        result = await game.evaluate_answer(sample_round_data, answer)
        
        # No LLM, so uses heuristic after rule check
        assert result['score'] == 100  # Good description
        assert result['correct'] == True
        assert result['breakdown']['method'] == 'heuristic'
    
    @pytest.mark.asyncio
    async def test_case_insensitive_violation(self, game, sample_round_data):
        """Test forbidden words caught case-insensitively"""
        answer = "System where PEOPLE VOTE."  # Uppercase
        result = await game.evaluate_answer(sample_round_data, answer)
        
        assert result['correct'] == False
        assert 'violations' in result['breakdown']
