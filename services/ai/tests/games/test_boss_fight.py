"""
Tests for BOSS_FIGHT_VOCAB game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.boss_fight import BossFightGame


class TestBossFightGame:
    """Test suite for BOSS_FIGHT_VOCAB game"""
    
    @pytest.fixture
    def game(self):
        """Create game instance"""
        return BossFightGame()
    
    @pytest.fixture
    def game_with_llm(self):
        """Create game instance with mock LLM"""
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock()
        return BossFightGame(llm_service=mock_llm)
    
    @pytest.fixture
    def sample_state(self):
        """Sample pedagogical state"""
        return {
            'boss_hp': 100,
            'lives': 3,
            'round': 1
        }
    
    def test_game_metadata(self, game):
        """Test game has correct metadata"""
        assert game.GAME_ID == "BOSS_FIGHT_VOCAB"
        assert game.GAME_NAME == "Boss Fight de Vocabulário"
        assert game.GAME_INTENT == "recall"
        assert game.REQUIRES_CONTENT == False
        assert game.DURATION_MIN == 8
    
    def test_create_round(self, game, sample_state):
        """Test round creation"""
        # Min difficulty is 2
        round_data = game.create_round(sample_state, difficulty=2)
        
        assert round_data['game_mode'] == "BOSS_FIGHT_VOCAB"
        assert round_data['difficulty'] == 2
        
        # Check data structure matches implementation
        data = round_data['data']
        assert 'word' in data
        assert 'definition' in data
        assert data['boss_hp'] == 100
        assert data['player_lives'] == 3
        assert data['total_rounds'] == 3
        
        # Verify prompt contains key info
        assert "Boss HP: 100/100" in round_data['prompt']
        assert "Suas Vidas: 3/3" in round_data['prompt']
    
    @pytest.mark.asyncio
    async def test_evaluate_with_llm_hit(self, game_with_llm, sample_state):
        """Test LLM evaluation causing damage"""
        # Mock LLM response for a good hit
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 80,
            'feedback': 'Good hit!',
            'correct_usage': True,
            'demonstrates_meaning': True,
            'damage_to_boss': 30
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        answer = "The politician was very eloquent during his speech."
        
        result = await game_with_llm.evaluate_answer(round_data, answer)
        
        assert result['score'] == 120  # 80 * 1.5
        assert result['correct'] == True
        assert result['breakdown']['damage'] == 30
    
    @pytest.mark.asyncio
    async def test_evaluate_fallback_hit(self, game, sample_state):
        """Test heuristic fallback causing damage"""
        round_data = game.create_round(sample_state, 1)
        # Word is "Eloquent"
        answer = "He was eloquent in his speech."
        
        result = await game.evaluate_answer(round_data, answer)
        
        # Heuristic: contains word (+75) + is sentence (+75)
        # Damage: 25 + 25 = 50
        assert result['score'] == 150
        assert result['correct'] == True
        assert result['breakdown']['damage'] == 50
        assert result['breakdown']['method'] == 'heuristic'
    
    @pytest.mark.asyncio
    async def test_evaluate_miss(self, game_with_llm, sample_state):
        """Test LLM evaluation miss (no damage)"""
        game_with_llm.llm_service.predict_json.return_value = {
            'score': 20,
            'feedback': 'Wrong word.',
            'correct_usage': False,
            'damage_to_boss': 0
        }
        
        round_data = game_with_llm.create_round(sample_state, 1)
        result = await game_with_llm.evaluate_answer(round_data, "bad answer")
        
        assert result['breakdown']['damage'] == 0
