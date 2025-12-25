"""
Unit Tests for TokenUsageTracker (LangChain Callback)

Tests token accumulation from various LLM providers (OpenAI, Anthropic, Gemini)
"""

import pytest
from unittest.mock import Mock
from langchain_core.outputs import LLMResult, Generation
from utils.token_tracker import TokenUsageTracker


class TestTokenUsageTracker:
    """Test suite for TokenUsageTracker callback handler"""

    def test_tracker_initialization(self):
        """Test that tracker initializes with zero values"""
        tracker = TokenUsageTracker()
        
        assert tracker.total_tokens == 0
        assert tracker.prompt_tokens == 0
        assert tracker.completion_tokens == 0
        assert tracker.successful_requests == 0
        assert tracker.cost_est_usd == 0.0
        assert tracker.details == []

    def test_openai_token_tracking(self):
        """Test token extraction from OpenAI-style response"""
        tracker = TokenUsageTracker()
        
        # Mock OpenAI LLMResult
        llm_result = LLMResult(
            generations=[[Generation(text="Hello world")]],
            llm_output={
                "model_name": "gpt-4",
                "token_usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15
                }
            }
        )
        
        tracker.on_llm_end(llm_result)
        
        assert tracker.prompt_tokens == 10
        assert tracker.completion_tokens == 5
        assert tracker.total_tokens == 15
        assert tracker.successful_requests == 1
        assert len(tracker.details) == 1
        assert tracker.details[0]["model"] == "gpt-4"

    def test_anthropic_token_tracking(self):
        """Test token extraction from Anthropic-style response"""
        tracker = TokenUsageTracker()
        
        # Mock Anthropic LLMResult (uses 'usage' instead of 'token_usage')
        llm_result = LLMResult(
            generations=[[Generation(text="Claude response")]],
            llm_output={
                "model_name": "claude-3-sonnet",
                "usage": {
                    "input_tokens": 20,
                    "output_tokens": 30,
                }
            }
        )
        
        tracker.on_llm_end(llm_result)
        
        assert tracker.prompt_tokens == 20
        assert tracker.completion_tokens == 30
        assert tracker.total_tokens == 50
        assert tracker.successful_requests == 1

    def test_gemini_token_tracking(self):
        """Test token extraction from Gemini-style response (generation_info)"""
        tracker = TokenUsageTracker()
        
        # Mock Gemini LLMResult (usage in generation_info)
        generation = Generation(
            text="Gemini response",
            generation_info={
                "usage_metadata": {
                    "prompt_token_count": 15,
                    "candidates_token_count": 25,
                    "total_token_count": 40
                }
            }
        )
        llm_result = LLMResult(
            generations=[[generation]],
            llm_output={"model_name": "gemini-pro"}
        )
        
        tracker.on_llm_end(llm_result)
        
        assert tracker.prompt_tokens == 15
        assert tracker.completion_tokens == 25
        assert tracker.total_tokens == 40

    def test_multiple_llm_calls_accumulation(self):
        """Test that multiple LLM calls accumulate correctly"""
        tracker = TokenUsageTracker()
        
        # First call
        result1 = LLMResult(
            generations=[[Generation(text="First")]],
            llm_output={
                "model_name": "gpt-4",
                "token_usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
            }
        )
        tracker.on_llm_end(result1)
        
        # Second call
        result2 = LLMResult(
            generations=[[Generation(text="Second")]],
            llm_output={
                "model_name": "gpt-4",
                "token_usage": {"prompt_tokens": 20, "completion_tokens": 10, "total_tokens": 30}
            }
        )
        tracker.on_llm_end(result2)
        
        assert tracker.prompt_tokens == 30
        assert tracker.completion_tokens == 15
        assert tracker.total_tokens == 45
        assert tracker.successful_requests == 2
        assert len(tracker.details) == 2

    def test_missing_usage_metadata(self):
        """Test that tracker handles responses without usage metadata gracefully"""
        tracker = TokenUsageTracker()
        
        # LLMResult without token usage
        llm_result = LLMResult(
            generations=[[Generation(text="No usage")]],
            llm_output={"model_name": "unknown-model"}
        )
        
        tracker.on_llm_end(llm_result)
        
        # Should not crash, but also not count anything
        assert tracker.total_tokens == 0
        assert tracker.successful_requests == 0
        assert len(tracker.details) == 0

    def test_get_stats_structure(self):
        """Test that get_stats returns correctly formatted dictionary"""
        tracker = TokenUsageTracker()
        
        # Add some data
        result = LLMResult(
            generations=[[Generation(text="Test")]],
            llm_output={
                "model_name": "gpt-4",
                "token_usage": {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150}
            }
        )
        tracker.on_llm_end(result)
        
        stats = tracker.get_stats()
        
        assert "prompt_tokens" in stats
        assert "completion_tokens" in stats
        assert "total_tokens" in stats
        assert "requests" in stats
        assert "breakdown" in stats
        
        assert stats["prompt_tokens"] == 100
        assert stats["completion_tokens"] == 50
        assert stats["total_tokens"] == 150
        assert stats["requests"] == 1
        assert isinstance(stats["breakdown"], list)

    def test_zero_token_response(self):
        """Test handling of response with zero tokens"""
        tracker = TokenUsageTracker()
        
        llm_result = LLMResult(
            generations=[[Generation(text="")]],
            llm_output={
                "model_name": "gpt-4",
                "token_usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
        )
        
        tracker.on_llm_end(llm_result)
        
        assert tracker.total_tokens == 0
        assert tracker.successful_requests == 1  # Still counts as a request


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
