"""
Tests for CLOZE_SPRINT game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.cloze_sprint import CloseSprintGame


class TestCloseSprintGame:
    """Test suite for CLOZE_SPRINT game"""
    
    @pytest.fixture
    def game(self):
        """Create game instance"""
        return CloseSprintGame()
    
    @pytest.fixture
    def game_with_llm(self):
        """Create game instance with mock LLM"""
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock()
        return CloseSprintGame(llm_service=mock_llm)
    
    @pytest.fixture
    def sample_state(self):
        """Sample pedagogical state"""
        return {
            'content_slice': 'Text about AI',
            'phase': 'POST'
        }
    
    def test_game_metadata(self, game):
        """Test game has correct metadata"""
        assert game.GAME_ID == "CLOZE_SPRINT"
        assert game.GAME_NAME == "Sprint de Lacunas"
        assert game.GAME_INTENT == "recall"
        assert game.REQUIRES_CONTENT == True
        assert game.DURATION_MIN == 3
    
    def test_create_round(self, game, sample_state):
        """Test round creation"""
        round_data = game.create_round(sample_state, difficulty=1)
        
        assert round_data['game_mode'] == "CLOZE_SPRINT"
        assert round_data['difficulty'] == 1
        
        # Check data structure matches implementation
        data = round_data['data']
        assert 'sentence' in data
        assert 'blanks' in data
        assert isinstance(data['blanks'], list)
        assert len(data['blanks']) > 0
        
        # Check blank structure
        blank = data['blanks'][0]
        assert 'id' in blank
        assert 'correct' in blank
        
        # Verify prompt format
        assert "Sprint de Lacunas" in round_data['prompt']
        assert "Complete as lacunas" in round_data['prompt']
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_perfect(self, game_with_llm, sample_state):
        """Test LLM evaluation perfect answer"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 100,
            'feedback': 'Perfect!',
            'blank_scores': [100, 100],
            'semantic_match': True
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "fotossíntese, alimento")
        
        assert result['score'] == 120  # 100 * 1.2
        assert result['correct'] == True
        assert result['breakdown']['semantic_match'] == True
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_partial(self, game_with_llm, sample_state):
        """Test LLM evaluation partial answer"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 50,
            'feedback': 'Half correct.',
            'blank_scores': [100, 0],
            'semantic_match': False
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "fotossíntese, WRONG")
        
        assert result['score'] == 60  # 50 * 1.2
        assert result['correct'] == False
    
    @pytest.mark.asyncio
    async def test_evaluate_fallback_match(self, game, sample_state):
        """Test heuristic fallback with exact match"""
        round_data = game.create_round(sample_state, 1)
        
        # Implementation has "fotossíntese" and "alimento" as correct answers in mock
        answer = "A fotossíntese produz alimento"
        
        result = await game.evaluate_answer(round_data, answer)
        
        # Should match both keywords
        assert result['score'] == 120  # (2/2) * 120
        assert result['correct'] == True
        assert result['breakdown']['method'] == 'heuristic'
        assert result['breakdown']['correct_count'] == 2

    @pytest.mark.asyncio
    async def test_evaluate_fallback_alternative(self, game, sample_state):
        """Test heuristic fallback with alternative match"""
        round_data = game.create_round(sample_state, 1)
        
        # "glicose" is an alternative for "alimento"
        answer = "A fotossíntese produz glicose"
        
        result = await game.evaluate_answer(round_data, answer)
        
        # 1 exact (fotossíntese) + 1 alternative (glicose -> 0.8)
        # Score = ((1 + 0.8) / 2) * 120 = 0.9 * 120 = 108
        
        assert result['score'] > 100
        assert result['breakdown']['method'] == 'heuristic'
