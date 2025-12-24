import os
import pytest
from unittest.mock import patch, MagicMock
from llm_factory import LLMFactory
from langchain_google_genai import ChatGoogleGenerativeAI

@pytest.fixture
def mock_env_google():
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "fake_key_google", "OPENAI_API_KEY": "fake_key_openai"}):
        yield

@pytest.fixture
def mock_env_no_google():
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "", "OPENAI_API_KEY": "fake_key_openai"}):
        yield

def test_google_llm_instantiation(mock_env_google):
    """Test that get_google_llm returns a ChatGoogleGenerativeAI instance"""
    factory = LLMFactory()
    llm = factory.get_google_llm()
    assert isinstance(llm, ChatGoogleGenerativeAI)
    assert llm.model == "gemini-1.5-flash"
    assert llm.google_api_key.get_secret_value() == "fake_key_google"

def test_cheap_llm_preferences_google(mock_env_google):
    """Test that TIER_CHEAP (get_cheap_llm) prefers Google if available"""
    factory = LLMFactory()
    llm = factory.get_cheap_llm()
    # Should get Gemini because it is cheaper/faster and prioritized in code
    assert isinstance(llm, ChatGoogleGenerativeAI)
    assert llm.model == "gemini-1.5-flash"

def test_cheap_llm_fallback_openai(mock_env_no_google):
    """Test that TIER_CHEAP falls back to OpenAI if Google is missing"""
    factory = LLMFactory()
    llm = factory.get_cheap_llm()
    # Should get OpenAI (gpt-4o-mini)
    # Note: We need to import ChatOpenAI to check instance, or check class name
    from langchain_openai import ChatOpenAI
    assert isinstance(llm, ChatOpenAI)
    assert llm.model_name == "gpt-4o-mini"

def test_get_google_llm_missing_key():
    """Test error when GOOGLE_API_KEY is missing"""
    with patch.dict(os.environ, {}, clear=True):
        factory = LLMFactory()
        with pytest.raises(ValueError, match="GOOGLE_API_KEY not set"):
            factory.get_google_llm()
