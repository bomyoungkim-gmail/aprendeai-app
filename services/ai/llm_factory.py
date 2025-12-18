"""
LLM Factory - Multi-provider support with task-specific optimization
Supports OpenAI, Anthropic, and Google Gemini with cost-optimized selection
"""
import os
from typing import Optional, Literal
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

# Provider tiers for cost optimization
TIER_PREMIUM = 'premium'  # GPT-4 ($10/1M tokens)
TIER_BALANCED = 'balanced'  # Claude Sonnet ($3/1M tokens)
TIER_CHEAP = 'cheap'  # Gemini Flash ($0.075/1M tokens)

# Task-to-tier mapping for optimal cost/quality balance
TASK_TIERS = {
    # Critical quality tasks → Premium
    'summarize': TIER_PREMIUM,
    'quiz': TIER_PREMIUM,
    
    # Medium complexity → Balanced
    'cues': TIER_BALANCED,
    'checkpoints': TIER_BALANCED,
    
    # Simple extraction → Cheap
    'extract_words': TIER_CHEAP,
    'glossary': TIER_CHEAP,
}

# Provider configurations
PROVIDER_CONFIGS = {
    TIER_PREMIUM: {
        'provider': 'openai',
        'model': os.getenv('TIER_PREMIUM_MODEL', 'gpt-4-turbo')
    },
    TIER_BALANCED: {
        'provider': 'anthropic',
        'model': os.getenv('TIER_BALANCED_MODEL', 'claude-3-sonnet-20240229')
    },
    TIER_CHEAP: {
        'provider': 'gemini',
        'model': os.getenv('TIER_CHEAP_MODEL', 'gemini-1.5-flash')
    }
}


class LLMFactory:
    """Factory for creating LLM instances with task-specific optimization."""
    
    @staticmethod
    def create_for_task(
        task: str,
        temperature: float = 0,
        **kwargs
    ):
        """
        Create optimal LLM for specific task.
        
        Args:
            task: Task name ('summarize', 'extract_words', etc.)
            temperature: 0-1 (default 0 for deterministic)
            **kwargs: Additional LLM parameters
            
        Returns:
            LangChain LLM instance
        """
        tier = TASK_TIERS.get(task, TIER_BALANCED)
        config = PROVIDER_CONFIGS[tier]
        
        return LLMFactory.create_llm(
            provider=config['provider'],
            model=config['model'],
            temperature=temperature,
            **kwargs
        )
    
    @staticmethod
    def create_llm(
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0,
        **kwargs
    ):
        """
        Create LLM instance for specified provider.
        
        Args:
            provider: 'openai' | 'anthropic' | 'gemini' (default from env)
            model: Model name (default from env)
            temperature: 0-1
            
        Returns:
            LangChain LLM instance
        """
        provider = provider or os.getenv('LLM_PROVIDER', 'openai')
        
        if provider == 'openai':
            return ChatOpenAI(
                model=model or os.getenv('OPENAI_MODEL', 'gpt-4-turbo'),
                temperature=temperature,
                **kwargs
            )
        
        elif provider == 'anthropic':
            return ChatAnthropic(
                model=model or os.getenv('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229'),
                temperature=temperature,
                **kwargs
            )
        
        elif provider == 'gemini':
            return ChatGoogleGenerativeAI(
                model=model or os.getenv('GEMINI_MODEL', 'gemini-1.5-flash'),
                temperature=temperature,
                **kwargs
            )
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    @staticmethod
    def get_task_info(task: str) -> dict:
        """Get provider and cost info for a task."""
        tier = TASK_TIERS.get(task, TIER_BALANCED)
        config = PROVIDER_CONFIGS[tier]
        return {
            'task': task,
            'tier': tier,
            'provider': config['provider'],
            'model': config['model']
        }
