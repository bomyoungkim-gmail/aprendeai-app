from typing import Any, Dict, List, Optional
from uuid import UUID
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult

class TokenUsageTracker(BaseCallbackHandler):
    """
    LangChain Callback Handler to track token usage across multiple LLM calls.
    Aggregates usage by model and operation.
    """
    def __init__(self):
        self.total_tokens = 0
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.successful_requests = 0
        self.cost_est_usd = 0.0
        self.details: List[Dict[str, Any]] = []

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Run when LLM ends running."""
        # Standardized extracted usage
        if response.llm_output and "token_usage" in response.llm_output:
             # Logic for OpenAI/Anthropic/Gemini standardized output if available
             # But usually LangChain puts it in 'token_usage' or response.generations[0].generation_info
             pass
        
        # Iterate through generations to find usage info
        # Note: LangChain structure varies by provider.
        # OpenAI: response.llm_output['token_usage']
        # Anthropic: response.llm_output['usage']
        # Gemini: response.generations[0][0].generation_info['usage_metadata']
        
        usage = None
        model_name = response.llm_output.get("model_name", "unknown") if response.llm_output else "unknown"

        if response.llm_output:
            if "token_usage" in response.llm_output: # OpenAI style
                usage = response.llm_output["token_usage"]
            elif "usage" in response.llm_output: # Anthropic style (sometimes)
                usage = response.llm_output["usage"]

        # Fallback: Check generation info if llm_output didn't have it
        if not usage and response.generations:
            # Check first generation
            gen = response.generations[0][0]
            if gen.generation_info:
                if "usage_metadata" in gen.generation_info: # Common LangChain standard
                    usage = gen.generation_info["usage_metadata"]
                elif "token_usage" in gen.generation_info:
                    usage = gen.generation_info["token_usage"]

        if usage:
            # Normalize keys
            p_tokens = usage.get("prompt_tokens") or usage.get("input_tokens") or usage.get("prompt_token_count") or 0
            c_tokens = usage.get("completion_tokens") or usage.get("output_tokens") or usage.get("candidates_token_count") or 0
            t_tokens = usage.get("total_tokens") or usage.get("total_token_count") or (p_tokens + c_tokens)

            self.prompt_tokens += p_tokens
            self.completion_tokens += c_tokens
            self.total_tokens += t_tokens
            self.successful_requests += 1
            
            self.details.append({
                "model": model_name,
                "prompt": p_tokens,
                "completion": c_tokens,
                "total": t_tokens
            })

    def get_stats(self) -> Dict[str, Any]:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "requests": self.successful_requests,
            "breakdown": self.details
        }
