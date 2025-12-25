"""
LLM Factory - Multi-provider support with task-specific optimization
Supports OpenAI, Anthropic, and Google Gemini with cost-optimized selection
"""
import os
from typing import Optional, Literal
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, AzureChatOpenAI
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
load_dotenv()

class LLMFactory:
    """
    Enhanced factory for LLM instances and embeddings.
    Supports: OpenAI, Azure OpenAI, Anthropic
    
    New in Phase 2:
    - Embeddings support
    - Tiered LLMs (cheap/smart)
    - Better error handling
    """
    
    def __init__(self):
        # OpenAI
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # Updated default
        
        # Azure OpenAI
        self.azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.azure_key = os.getenv("AZURE_OPENAI_KEY")
        self.azure_deployment = os.getenv("AZURE_DEPLOYMENT_NAME")
        self.azure_api_version = os.getenv("AZURE_API_VERSION", "2023-05-15")
        
        # Anthropic
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Google Gemini
        self.google_key = os.getenv("GOOGLE_API_KEY")
        
        self.default_temperature = float(os.getenv("LLM_TEMPERATURE", "0.0"))
    
    def get_openai_llm(
        self, 
        model: Optional[str] = None, 
        temperature: Optional[float] = None
    ) -> ChatOpenAI:
        """Get OpenAI LLM"""
        if not self.openai_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        
        return ChatOpenAI(
            model=model or self.openai_model,
            temperature=temperature if temperature is not None else self.default_temperature,
            api_key=self.openai_key
        )
    
    def get_azure_llm(
        self,
        deployment: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AzureChatOpenAI:
        """Get Azure OpenAI LLM"""
        if not self.azure_endpoint or not self.azure_key:
            raise ValueError("Azure OpenAI credentials not set")
        
        return AzureChatOpenAI(
            azure_endpoint=self.azure_endpoint,
            openai_api_key=self.azure_key,
            deployment_name=deployment or self.azure_deployment,
            api_version=self.azure_api_version,
            temperature=temperature if temperature is not None else self.default_temperature
        )
    
    def get_anthropic_llm(
        self,
        model: str = "claude-3-5-sonnet-20241022",
        temperature: Optional[float] = None
    ) -> ChatAnthropic:
        """Get Anthropic LLM"""
        if not self.anthropic_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        
        return ChatAnthropic(
            model=model,
            temperature=temperature if temperature is not None else self.default_temperature,
            api_key=self.anthropic_key
        )

    def get_google_llm(
        self,
        model: str = "gemini-1.5-flash",
        temperature: Optional[float] = None,
        timeout: Optional[float] = None,
        max_retries: int = 2,
    ) -> ChatGoogleGenerativeAI:
        """Get Google Gemini LLM"""
        if not self.google_key:
            raise ValueError("GOOGLE_API_KEY not set")
            
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature if temperature is not None else self.default_temperature,
            google_api_key=self.google_key,
            timeout=timeout,
            max_retries=max_retries,
        )
    
    def get_fake_llm(self, temperature: Optional[float] = None):
        """Get Fake LLM for testing"""
        from langchain_core.language_models import FakeListChatModel
        
        # Responses to cycle through
        responses = [
            "This is a mocked response from the AI service.",
            "I understand the concept related to this.",
            "Here is a question to check your understanding.",
            "Great job explaining that!"
        ]
        
        return FakeListChatModel(responses=responses)

    def get_default_llm(self, temperature: Optional[float] = None):
        """Get default LLM based on availability"""
        # Try providers in order
        if self.openai_key:
            return self.get_openai_llm(temperature=temperature)
        elif self.azure_endpoint and self.azure_key:
            return self.get_azure_llm(temperature=temperature)
        elif self.anthropic_key:
            return self.get_anthropic_llm(temperature=temperature)
        
        # Fallback to Fake LLM only if explicitly allowed (e.g. in tests)
        # NEVER use mock in dev/prod automatically just because keys are missing
        allow_mock = os.getenv("ALLOW_MOCK_LLM", "false").lower() == "true"
        is_test_env = os.getenv("ENV", "development").lower() == "test"
        
        if allow_mock or (is_test_env and not self.openai_key):
            print("WARNING: Using Fake LLM (Test Mode/Explicit Allow).")
            return self.get_fake_llm(temperature=temperature)
            
        else:
            raise ValueError("No LLM provider credentials found and Mock LLM is not allowed in this environment. Set OPENAI_API_KEY, Azure credentials, or ANTHROPIC_API_KEY.")
    
    # ============================================
    # NEW: Phase 2 Enhancements
    # ============================================
    
    def get_cheap_llm(self, temperature: Optional[float] = None):
        """
        Get cost-effective LLM for simple tasks.
        Use for: quick responses, checkpoints, simple prompts
        """
        # Google Gemini Flash is currently the most cost-effective and fast
        if self.google_key:
            return self.get_google_llm(model="gemini-1.5-flash", temperature=temperature)
        elif self.openai_key:
            return ChatOpenAI(
                model="gpt-4o-mini",  # Cheap and fast
                temperature=temperature if temperature is not None else self.default_temperature,
                api_key=self.openai_key
            )
        
        # Fallback logic - Strict check
        allow_mock = os.getenv("ALLOW_MOCK_LLM", "false").lower() == "true"
        is_test_env = os.getenv("ENV", "development").lower() == "test"

        if allow_mock or (is_test_env and not self.openai_key):
             return self.get_fake_llm(temperature=temperature)
             
        # Fallback to default (which will raise if no keys)
        return self.get_default_llm(temperature=temperature)
    
    def get_smart_llm(self, temperature: Optional[float] = None):
        """
        Get high-intelligence LLM for complex reasoning.
        Use for: evaluation, analysis, difficult tasks
        """
        if self.openai_key:
            return ChatOpenAI(
                model="gpt-4o",  # Smarter but more expensive
                temperature=temperature if temperature is not None else self.default_temperature,
                api_key=self.openai_key
            )
        elif self.anthropic_key:
            return self.get_anthropic_llm(model="claude-3-5-sonnet-20241022", temperature=temperature)
        
        # Fallback logic - Strict check
        allow_mock = os.getenv("ALLOW_MOCK_LLM", "false").lower() == "true"
        is_test_env = os.getenv("ENV", "development").lower() == "test"
        
        if allow_mock or (is_test_env and not self.openai_key):
             return self.get_fake_llm(temperature=temperature)

        # Fallback to default
        return self.get_default_llm(temperature=temperature)

# Global instance
llm_factory = LLMFactory()
