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
    
    def get_default_llm(self, temperature: Optional[float] = None):
        """Get default LLM based on availability"""
        # Try providers in order
        if self.openai_key:
            return self.get_openai_llm(temperature=temperature)
        elif self.azure_endpoint and self.azure_key:
            return self.get_azure_llm(temperature=temperature)
        elif self.anthropic_key:
            return self.get_anthropic_llm(temperature=temperature)
        else:
            raise ValueError("No LLM provider credentials found. Set OPENAI_API_KEY, Azure credentials, or ANTHROPIC_API_KEY")
    
    # ============================================
    # NEW: Phase 2 Enhancements
    # ============================================
    
    def get_cheap_llm(self, temperature: Optional[float] = None):
        """
        Get cost-effective LLM for simple tasks.
        Use for: quick responses, checkpoints, simple prompts
        """
        if self.openai_key:
            return ChatOpenAI(
                model="gpt-4o-mini",  # Cheap and fast
                temperature=temperature if temperature is not None else self.default_temperature,
                api_key=self.openai_key
            )
        else:
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
            return ChatAnthropic(
        }
