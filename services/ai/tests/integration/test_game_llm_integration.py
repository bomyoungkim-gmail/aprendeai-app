"""
Integration tests for LLM-integrated games
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from games.registry import game_registry
from games.middleware.pipeline import GamePipeline

# Import correct game names
from games.modes.feynman_teacher import FeynmanTeacherGame
from games.modes.debate_master import DebateMasterGame
from games.modes.socratic_defense import SocraticDefenseGame
from games.modes.what_if import WhatIfScenarioGame
from games.modes.analogy_maker import AnalogyMakerGame

class TestGameLLMIntegration:
    """Integration tests for games with LLM"""
    
    @pytest.mark.asyncio
    async def test_all_games_support_async_evaluation(self):
        """Test all 15 games have async evaluate_answer"""
        # Manually register known games if discovery fails in test env
        games_to_check = [
            'FEYNMAN_TEACHER', 'DEBATE_MASTER', 'SOCRATIC_DEFENSE',
            'ANALOGY_MAKER', 'CONCEPT_LINKING', 'WHAT_IF_SCENARIO',
            'FREE_RECALL', 'SITUATION_SIM', 'PROBLEM_SOLVER',
            'MISCONCEPTION_HUNT', 'RECOMMENDATION_ENGINE', 'TOOL_WORD_HUNT',
            'BOSS_FIGHT_VOCAB', 'SRS_ARENA', 'CLOZE_SPRINT'
        ]
        
        # We can construct them directly to avoid registry dependency issues in pure unit/int tests
        # or assume registry works. Let's rely on manual check for safety.
        from games.modes.free_recall import FreeRecallGame
        from games.modes.cloze_sprint import CloseSprintGame
        from games.modes.srs_arena import SrsArenaGame
        from games.modes.concept_linking import ConceptLinkingGame
        from games.modes.boss_fight import BossFightGame
        from games.modes.tool_word_hunt import ToolWordHuntGame
        from games.modes.misconception_hunt import MisconceptionHuntGame
        from games.modes.recommendation import RecommendationGame
        from games.modes.situation_sim import SituationSimGame
        from games.modes.problem_solver import ProblemSolverGame
        
        classes = [
            FeynmanTeacherGame, DebateMasterGame, SocraticDefenseGame,
            AnalogyMakerGame, ConceptLinkingGame, WhatIfScenarioGame,
            FreeRecallGame, SituationSimGame, ProblemSolverGame,
            MisconceptionHuntGame, RecommendationGame, ToolWordHuntGame,
            BossFightGame, SrsArenaGame, CloseSprintGame
        ]

        for game_class in classes:
            game = game_class()
            assert hasattr(game, 'evaluate_answer')
            assert asyncio.iscoroutinefunction(game.evaluate_answer)
    
    @pytest.mark.asyncio
    async def test_llm_service_injection(self):
        """Test games accept LLM service via constructor"""
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock()
        
        game = FeynmanTeacherGame(llm_service=mock_llm)
        assert game.llm_service == mock_llm
    
    @pytest.mark.asyncio
    async def test_fallback_when_no_llm(self):
        """Test games fallback to heuristic when no LLM"""
        game = FeynmanTeacherGame()  # No LLM service
        
        round_data = game.create_round({'concept': 'Test'}, 2)
        result = await game.evaluate_answer(round_data, "Test answer with facts and logic.")
        
        # Should use heuristic
        assert 'method' in result['breakdown']
        assert result['breakdown']['method'] == 'heuristic'
    
    @pytest.mark.asyncio
    async def test_llm_failure_graceful_fallback(self):
        """Test graceful fallback when LLM fails"""
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock(side_effect=Exception("LLM error"))
        
        game = DebateMasterGame(llm_service=mock_llm)
        round_data = game.create_round({'topic': 'Test'}, 2)
        
        # Should not raise exception
        result = await game.evaluate_answer(round_data, "Test argument with evidence")
        
        # Should fallback
        assert result is not None
        assert 'score' in result
        assert result['breakdown']['method'] == 'heuristic'


class TestGameAsyncFlows:
    """Test async execution patterns"""
    
    @pytest.mark.asyncio
    async def test_pipeline_execute_async(self):
        """Test pipeline supports async handlers"""
        pipeline = GamePipeline([])
        
        async def async_handler(ctx):
            return {'result': 'success', **ctx}
        
        result = await pipeline.execute_async({'test': True}, async_handler)
        
        assert result['result'] == 'success'
        assert result['test'] == True
    
    @pytest.mark.asyncio
    async def test_concurrent_game_evaluations(self):
        """Test multiple games can be evaluated concurrently"""
        game1 = FeynmanTeacherGame()
        game2 = AnalogyMakerGame()
        
        round1 = game1.create_round({'concept': 'Test1'}, 1)
        round2 = game2.create_round({'concept': 'Test2'}, 1)
        
        # Run concurrently
        results = await asyncio.gather(
            game1.evaluate_answer(round1, "Answer 1 is detailed"),
            game2.evaluate_answer(round2, "Answer 2 also detailed")
        )
        
        assert len(results) == 2
        assert all('score' in r for r in results)


class TestGameFallbackChain:
    """Test fallback chain behavior"""
    
    @pytest.mark.asyncio
    async def test_llm_success_path(self):
        """Test successful LLM evaluation path"""
        mock_llm = Mock()
        mock_llm.predict_json = AsyncMock(return_value={
            'score': 85,
            'feedback': 'Great!',
            'depth_level': 'profundo',
            'improvements': []
        })
        
        game = SocraticDefenseGame(llm_service=mock_llm)
        round_data = game.create_round({'claim': 'Test'}, 2)
        result = await game.evaluate_answer(round_data, "Deep answer")
        
        # Used LLM
        if 'breakdown' in result:
             # Check if method is NOT heuristic, or if llm_score is present
             assert 'method' not in result['breakdown'] or result['breakdown']['method'] != 'heuristic'
