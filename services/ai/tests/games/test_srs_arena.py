"""
Tests for SRS_ARENA game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.srs_arena import SrsArenaGame


class TestSrsArenaGame:
    """Test suite for SRS_ARENA game"""
    
    @pytest.fixture
    def game(self):
        """Create game instance"""
        return SrsArenaGame()
    
    @pytest.fixture
    def game_with_llm(self):
        """Create game instance with mock LLM"""
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock()
        return SrsArenaGame(llm_service=mock_llm)
    
    @pytest.fixture
    def sample_state(self):
        """Sample pedagogical state"""
        return {
            'card_index': 0,
            'content_slice': 'Text about biology',
            'phase': 'POST'
        }
    
    def test_game_metadata(self, game):
        """Test game has correct metadata"""
        assert game.GAME_ID == "SRS_ARENA"
        assert game.GAME_NAME == "Arena SRS"
        assert game.GAME_INTENT == "recall"
        assert game.REQUIRES_CONTENT == True
        assert game.DURATION_MIN == 5
    
    def test_create_round(self, game, sample_state):
        """Test round creation"""
        round_data = game.create_round(sample_state, difficulty=1)
        
        assert round_data['game_mode'] == "SRS_ARENA"
        assert round_data['difficulty'] == 1
        
        # Check data structure matches implementation (Single card)
        data = round_data['data']
        assert 'question' in data
        assert 'correct_answer' in data
        assert 'card_index' in data
        
        # Verify prompt format
        assert "Arena SRS" in round_data['prompt']
        assert "Pergunta" in round_data['prompt']
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_correct(self, game_with_llm, sample_state):
        """Test LLM evaluation correct answer"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 100,
            'feedback': 'Correct!',
            'factually_correct': True,
            'completeness': 'completa',
            'confidence': 'alta'
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "Mitocôndria produz energia")
        
        assert result['score'] == 100
        assert result['correct'] == True
        assert result['breakdown']['factually_correct'] == True
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_incorrect(self, game_with_llm, sample_state):
        """Test LLM evaluation incorrect answer"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 20,
            'feedback': 'Wrong.',
            'factually_correct': False,
            'completeness': 'parcial',
            'confidence': 'baixa'
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "DNA armazena lipídios")
        
        assert result['score'] == 20
        assert result['correct'] == False
    
    @pytest.mark.asyncio
    async def test_evaluate_fallback_match(self, game, sample_state):
        """Test heuristic fallback with keyword match"""
        round_data = game.create_round(sample_state, 1)
        # Correct answer in mock is "Organela produtora de energia (ATP)" for card 0
        answer = "É uma organela produtora de energia"
        
        result = await game.evaluate_answer(round_data, answer)
        
        # Should match keywords
        assert result['score'] > 0
        assert result['breakdown']['method'] == 'heuristic'
        assert result['breakdown']['keyword_matches'] > 0
