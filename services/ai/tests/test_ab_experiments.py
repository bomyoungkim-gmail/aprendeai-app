
import pytest
from unittest.mock import AsyncMock, MagicMock
from utils.ab_manager import ABTestManager
from games.modes.tool_word_hunt import ToolWordHuntGame

class TestABTestManager:
    def test_deterministic_split(self):
        manager = ABTestManager()
        experiment = "test_experiment"
        manager.experiments[experiment] = 0.5 # 50/50
        
        # User A: "user_123" -> Hash Check
        # User B: "user_456" -> Hash Check
        # We need to find two users that split differently
        
        # Let's bruteforce find one LLM and one Heuristic user for stability
        llm_user = None
        heuristic_user = None
        
        for i in range(100):
            uid = f"user_{i}"
            if manager.should_use_llm(experiment, uid):
                llm_user = uid
            else:
                heuristic_user = uid
            if llm_user and heuristic_user:
                break
                
        assert llm_user is not None
        assert heuristic_user is not None
        
        # Verify consistency
        assert manager.should_use_llm(experiment, llm_user) is True
        assert manager.should_use_llm(experiment, heuristic_user) is False

@pytest.mark.asyncio
class TestToolWordHuntAB:
    async def test_ab_routing(self):
        # Setup
        mock_llm = AsyncMock()
        mock_llm.predict_json.return_value = {
            "score": 90, 
            "feedback": "LLM Feedback",
            "found_quote": True
        }
        
        game = ToolWordHuntGame(llm_service=mock_llm)
        
        # Find users for 50/50 split on "game_eval_tool_word_hunt"
        # We know from prev test we can find them.
        # Let's perform a mini-search again or depend on known values? 
        # Better to search to be robust against hash algo changes.
        
        from utils.ab_manager import ab_manager
        ab_manager.experiments["game_eval_tool_word_hunt"] = 0.5
        
        llm_user = "user_llm_candidate"
        while not ab_manager.should_use_llm("game_eval_tool_word_hunt", llm_user):
            llm_user += "x"
            
        heuristic_user = "user_heuristic_candidate"
        while ab_manager.should_use_llm("game_eval_tool_word_hunt", heuristic_user):
            heuristic_user += "x"
            
        # Test LLM Path
        round_data_llm = {
            'data': {'target_word': 'test', 'text': 'test text'},
            'user_id': llm_user
        }
        result_llm = await game.evaluate_answer(round_data_llm, "test answer")
        
        assert result_llm['experiment_group'] == 'B_VARIANT_LLM'
        assert "LLM Feedback" in result_llm['feedback']
        mock_llm.predict_json.assert_called()
        
        # Test Heuristic Path
        round_data_heuristic = {
            'data': {'target_word': 'test', 'text': 'test text', 'expected_quote': 'test'},
            'user_id': heuristic_user
        }
        result_heuristic = await game.evaluate_answer(round_data_heuristic, "test answer breakdown")
        
        assert result_heuristic['experiment_group'] == 'A_VARIANT_HEURISTIC'
        assert "LLM Feedback" not in result_heuristic['feedback']
