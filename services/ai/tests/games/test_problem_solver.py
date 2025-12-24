"""
Tests for PROBLEM_SOLVER game
"""
import pytest
from unittest.mock import Mock, AsyncMock
from games.modes.problem_solver import ProblemSolverGame


class TestProblemSolverGame:
    @pytest.fixture
    def game(self):
        return ProblemSolverGame()
    
    @pytest.fixture
    def mock_llm(self):
        mock = Mock()
        mock.predict_json = AsyncMock()
        return mock

    def test_create_round(self, game):
        round_data = game.create_round({}, difficulty=1)
        assert round_data['game_mode'] == "PROBLEM_SOLVER"
        assert 'question' in round_data['data']

    @pytest.mark.asyncio
    async def test_evaluate_llm(self, game, mock_llm):
        game.llm_service = mock_llm
        mock_llm.predict_json.return_value = {
            'score': 100,
            'feedback': 'Correct!',
            'reasoning_quality': 'excelente'
        }
        
        round_data = game.create_round({}, 1)
        # Must start with B to match mock correct answer in create_round
        result = await game.evaluate_answer(round_data, "B) Because plants produce oxygen")
        
        assert result['score'] == 100
        assert result['correct'] == True

    @pytest.mark.asyncio
    async def test_evaluate_fallback(self, game):
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "B")
        assert 'score' in result
