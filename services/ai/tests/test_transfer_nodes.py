
import pytest
from unittest.mock import MagicMock, patch
from educator.transfer_state import TransferState
# Import node handles
from educator.nodes.transfer.hugging_node import handle as hugging_handle
from educator.nodes.transfer.morphology_node import handle as morphology_handle
from educator.nodes.transfer.bridging_node import handle as bridging_handle
from educator.nodes.transfer.high_road_node import handle as high_road_handle

@pytest.fixture
def mock_state():
    return {
        "intent": "TEST",
        "userId": "user1",
        "sessionId": "session1",
        "contentId": "content1",
        "transfer_metadata": {
            "concept": "Photosynthesis",
            "domains_json": ["Engineering", "Art"],
            "word": "Unhappiness"
        },
        "user_profile": {
            "schooling_level": "Undergraduate",
            "language_proficiency": "pt"
        }
    }

@pytest.fixture
def mock_llm_chain():
    with patch("educator.nodes.transfer.hugging_node.HUGGING_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.hugging_node.llm_factory") as mock_factory, \
         patch("educator.nodes.transfer.morphology_node.MORPHOLOGY_PROMPT") as mock_morph_prompt, \
         patch("educator.nodes.transfer.morphology_node.llm_factory") as mock_morph_factory, \
         patch("educator.nodes.transfer.bridging_node.BRIDGING_PROMPT") as mock_bridge_prompt, \
         patch("educator.nodes.transfer.bridging_node.llm_factory") as mock_bridge_factory, \
         patch("educator.nodes.transfer.high_road_node.HIGH_ROAD_PROMPT") as mock_hr_prompt, \
         patch("educator.nodes.transfer.high_road_node.llm_factory") as mock_hr_factory:
        
        # Setup common mock behavior
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        
        # Pipe operator mock
        mock_prompt.__or__.return_value = mock_chain
        mock_morph_prompt.__or__.return_value = mock_chain
        mock_bridge_prompt.__or__.return_value = mock_chain
        mock_hr_prompt.__or__.return_value = mock_chain
        
        mock_factory.get_llm.return_value = mock_llm
        mock_morph_factory.get_llm.return_value = mock_llm
        mock_bridge_factory.get_llm.return_value = mock_llm
        mock_hr_factory.get_llm.return_value = mock_llm
        
        yield mock_chain

def test_hugging_node_success(mock_state, mock_llm_chain):
    """Test HuggingNode parses valid JSON output."""
    mock_response = MagicMock()
    mock_response.content = '{"question": "What is the core principle?", "examples": ["Ex 1", "Ex 2"]}'
    mock_llm_chain.invoke.return_value = mock_response

    new_state = hugging_handle(mock_state)

    assert "structured_output" in new_state
    assert new_state["structured_output"]["question"] == "What is the core principle?"
    assert len(new_state["structured_output"]["examples"]) == 2
    assert "Ex 1" in new_state["response_text"]

def test_hugging_node_invalid_json(mock_state, mock_llm_chain):
    """Test HuggingNode handles invalid JSON gracefully."""
    mock_response = MagicMock()
    mock_response.content = 'Not JSON'
    mock_llm_chain.invoke.return_value = mock_response

    new_state = hugging_handle(mock_state)

    assert "structured_output" not in new_state
    assert "Pense: Qual é o princípio geral" in new_state["response_text"]

def test_morphology_node_success(mock_state, mock_llm_chain):
    """Test MorphologyNode parses valid JSON output."""
    mock_response = MagicMock()
    mock_response.content = '{"decomposition": "Un-happy-ness", "applications": ["Undo", "Sadness"]}'
    mock_llm_chain.invoke.return_value = mock_response

    new_state = morphology_handle(mock_state)

    assert new_state["structured_output"]["decomposition"] == "Un-happy-ness"
    assert "Un-happy-ness" in new_state["response_text"]

def test_bridging_node_success(mock_state, mock_llm_chain):
    """Test BridgingNode parses valid JSON output."""
    mock_response = MagicMock()
    mock_response.content = '{"deep_structure": "System Dynamics", "generalization_question": "Where else?"}'
    mock_llm_chain.invoke.return_value = mock_response

    new_state = bridging_handle(mock_state)

    assert new_state["structured_output"]["deep_structure"] == "System Dynamics"
    assert "System Dynamics" in new_state["response_text"]

def test_high_road_node_success(mock_state, mock_llm_chain):
    """Test HighRoadNode parses valid JSON output."""
    json_response = """
    {
        "mission_markdown": "## Mission\\nDo this.",
        "rubric_json": {
            "criteria": [{"name": "Creativity", "points": 10, "description": "Be creative"}]
        }
    }
    """
    mock_response = MagicMock()
    mock_response.content = json_response
    mock_llm_chain.invoke.return_value = mock_response

    new_state = high_road_handle(mock_state)

    assert "mission_markdown" in new_state["structured_output"]
    assert "rubric_json" in new_state["structured_output"]
    assert "# Missão de Transferência" in new_state["response_text"]


# ========== SENTENCE_ANALYSIS Tests ==========

from educator.nodes.transfer.sentence_node import handle as sentence_handle

@pytest.fixture
def sentence_mock_state():
    """State for sentence analysis tests."""
    return {
        "intent": "SENTENCE_ANALYSIS",
        "user_id": "user1",
        "session_id": "session1",
        "content_id": "content1",
        "transfer_metadata": {
            "selected_text": "Embora estivesse chovendo, saí porque precisava.",
            "language_code": "pt-BR"
        },
        "scaffolding_level": 2,
        "max_tokens": 500,
        "style_instructions": "Be clear and concise.",
        "events_to_write": []
    }


def test_sentence_node_valid_json(sentence_mock_state):
    """Test SentenceNode parses valid JSON output."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm  # Updated to use get_cheap_llm
        
        json_response = """
        {
            "main_clause": "saí",
            "main_idea": "Eu saí de casa",
            "subordinate_clauses": [
                {"text": "estivesse chovendo", "function": "CONTRAST", "connector": "embora"},
                {"text": "precisava", "function": "CAUSE", "connector": "porque"}
            ],
            "connectors": ["embora", "porque"],
            "simplification": "Estava chovendo, mas eu saí porque precisava.",
            "rewrite_layered": {"L1": "", "L2": "", "L3": ""},
            "confidence": 0.85
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Verify structured output
        assert "structured_output" in new_state
        assert new_state["structured_output"]["main_clause"] == "saí"
        assert len(new_state["structured_output"]["subordinate_clauses"]) == 2
        assert new_state["structured_output"]["confidence"] == 0.85
        
        # Verify response text
        assert "🧩 **Análise de sentença**" in new_state["response_text"]
        assert "saí" in new_state["response_text"]
        
        # Verify events
        events = new_state["events_to_write"]
        assert len(events) == 3  # REQUESTED, TOOL_USED, COMPLETED
        assert events[0]["payloadJson"]["kind"] == "SENTENCE_ANALYSIS_REQUESTED"
        assert events[1]["payloadJson"]["kind"] == "TRANSFER_TOOL_USED"
        assert events[2]["payloadJson"]["kind"] == "SENTENCE_ANALYSIS_COMPLETED"


def test_sentence_node_missing_text(sentence_mock_state):
    """Test SentenceNode handles missing text gracefully."""
    sentence_mock_state["transfer_metadata"] = {}  # No text
    
    new_state = sentence_handle(sentence_mock_state)
    
    # Should return instruction
    assert "selecione uma frase" in new_state["response_text"].lower()
    assert new_state["structured_output"] is None
    
    # Should emit NEEDS_TEXT event
    events = new_state["events_to_write"]
    assert len(events) == 1
    assert events[0]["payloadJson"]["kind"] == "SENTENCE_ANALYSIS_NEEDS_TEXT"


def test_sentence_node_repair_fallback(sentence_mock_state):
    """Test SentenceNode uses repair and heuristic fallback."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.SENTENCE_REPAIR_PROMPT") as mock_repair, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_repair_chain = MagicMock()
        
        mock_prompt.__or__.return_value = mock_chain
        mock_repair.__or__.return_value = mock_repair_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # First call returns invalid JSON
        mock_invalid = MagicMock()
        mock_invalid.content = "Not valid JSON at all"
        mock_chain.invoke.return_value = mock_invalid
        
        # Repair also fails
        mock_repair_invalid = MagicMock()
        mock_repair_invalid.content = "Still not JSON"
        mock_repair_chain.invoke.return_value = mock_repair_invalid
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2  # Fallback confidence
        assert "embora" in new_state["structured_output"]["connectors"]
        assert "porque" in new_state["structured_output"]["connectors"]


def test_sentence_node_text_priority(sentence_mock_state):
    """Test SentenceNode prioritizes selected_text over typed_text."""
    sentence_mock_state["transfer_metadata"]["typed_text"] = "Typed text"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "simplification": "test",
            "confidence": 0.5
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Verify it used selected_text (check event)
        events = new_state["events_to_write"]
        requested_event = next(e for e in events if e["payloadJson"]["kind"] == "SENTENCE_ANALYSIS_REQUESTED")
        assert requested_event["payloadJson"]["source"] == "CHAT_SELECTION"


def test_sentence_node_scaffolding_adaptation(sentence_mock_state):
    """Test SentenceNode adapts response to scaffolding level."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "simplification": "test",
            "confidence": 0.5
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        # Test L2+ scaffolding
        sentence_mock_state["scaffolding_level"] = 2
        new_state = sentence_handle(sentence_mock_state)
        assert "Checagem rápida" in new_state["response_text"]
        
        # Test L1 scaffolding
        sentence_mock_state["scaffolding_level"] = 1
        new_state = sentence_handle(sentence_mock_state)
        assert "quebro em 2 frases" in new_state["response_text"]


# ========== Exception Edge Cases ==========

def test_sentence_node_llm_connection_failure(sentence_mock_state):
    """Test SentenceNode handles LLM connection failure gracefully."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # Simulate connection failure
        mock_chain.invoke.side_effect = ConnectionError("Failed to connect to LLM")
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2
        # Should still detect connectors from the input text
        assert "embora" in new_state["structured_output"]["connectors"]


def test_sentence_node_llm_timeout(sentence_mock_state):
    """Test SentenceNode handles LLM timeout gracefully."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # Simulate timeout
        mock_chain.invoke.side_effect = TimeoutError("LLM request timed out")
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2


def test_sentence_node_unexpected_exception(sentence_mock_state):
    """Test SentenceNode handles unexpected exceptions gracefully."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # Simulate unexpected exception
        mock_chain.invoke.side_effect = RuntimeError("Unexpected error")
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2


def test_sentence_node_malformed_response_object(sentence_mock_state):
    """Test SentenceNode handles malformed response object."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # Return object without 'content' attribute
        mock_response = MagicMock()
        del mock_response.content  # Remove content attribute
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2


def test_sentence_node_pydantic_validation_error(sentence_mock_state):
    """Test SentenceNode handles Pydantic validation errors."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.SENTENCE_REPAIR_PROMPT") as mock_repair, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_repair_chain = MagicMock()
        
        mock_prompt.__or__.return_value = mock_chain
        mock_repair.__or__.return_value = mock_repair_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # Return JSON with wrong types (confidence as string instead of float)
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "simplification": "test",
            "confidence": "not a number"
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        # Repair also returns invalid data
        mock_repair_response = MagicMock()
        mock_repair_response.content = json_response
        mock_repair_chain.invoke.return_value = mock_repair_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2


def test_sentence_node_empty_response(sentence_mock_state):
    """Test SentenceNode handles empty LLM response."""
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # Return empty response
        mock_response = MagicMock()
        mock_response.content = ""
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use heuristic fallback
        assert "structured_output" in new_state
        assert new_state["structured_output"]["confidence"] == 0.2


# ========== SCRIPT 05: Mode-Specific Quick Replies Integration Tests ==========

def test_sentence_node_didactic_mode_quick_replies(sentence_mock_state):
    """Test SentenceNode generates DIDACTIC quick replies."""
    sentence_mock_state["transfer_metadata"]["mode"] = "DIDACTIC"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # LLM returns valid JSON without quick_replies (to test fallback)
        json_response = """
        {
            "main_clause": "saí",
            "main_idea": "Eu saí",
            "subordinate_clauses": [],
            "connectors": ["embora", "porque"],
            "simplification": "Estava chovendo, mas saí porque precisava.",
            "rewrite_layered": {"L1": "test", "L2": "test", "L3": "test"},
            "quick_replies": [],
            "confidence": 0.8
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Verify quick_replies are generated for DIDACTIC mode
        assert "quick_replies" in new_state
        assert len(new_state["quick_replies"]) == 2
        assert "Faça 2 exercícios" in new_state["quick_replies"]
        assert "Reescreva com outro conectivo" in new_state["quick_replies"]


def test_sentence_node_technical_mode_quick_replies(sentence_mock_state):
    """Test SentenceNode generates TECHNICAL quick replies."""
    sentence_mock_state["transfer_metadata"]["mode"] = "TECHNICAL"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "subordinate_clauses": [],
            "connectors": [],
            "simplification": "test",
            "rewrite_layered": {"L1": "test", "L2": "test", "L3": "test"},
            "quick_replies": [],
            "confidence": 0.8
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        assert "quick_replies" in new_state
        assert "Defina termos-chave" in new_state["quick_replies"]
        assert "Explique relação entre cláusulas" in new_state["quick_replies"]


def test_sentence_node_narrative_mode_quick_replies(sentence_mock_state):
    """Test SentenceNode generates NARRATIVE quick replies."""
    sentence_mock_state["transfer_metadata"]["mode"] = "NARRATIVE"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "subordinate_clauses": [],
            "connectors": [],
            "simplification": "test",
            "rewrite_layered": {"L1": "test", "L2": "test", "L3": "test"},
            "confidence": 0.8
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        assert "quick_replies" in new_state
        assert "Qual a intenção do autor?" in new_state["quick_replies"]
        assert "Explique contexto (sem spoilers)" in new_state["quick_replies"]


def test_sentence_node_news_mode_quick_replies(sentence_mock_state):
    """Test SentenceNode generates NEWS quick replies."""
    sentence_mock_state["transfer_metadata"]["mode"] = "NEWS"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "subordinate_clauses": [],
            "connectors": [],
            "simplification": "test",
            "rewrite_layered": {"L1": "test", "L2": "test", "L3": "test"},
            "confidence": 0.8
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        assert "quick_replies" in new_state
        assert "Identifique causa/efeito" in new_state["quick_replies"]
        assert "Quais os números chave?" in new_state["quick_replies"]


def test_sentence_node_mode_in_event_payload(sentence_mock_state):
    """Test SentenceNode includes mode in SENTENCE_ANALYSIS_COMPLETED event."""
    sentence_mock_state["transfer_metadata"]["mode"] = "DIDACTIC"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "subordinate_clauses": [],
            "connectors": [],
            "simplification": "test",
            "rewrite_layered": {"L1": "test", "L2": "test", "L3": "test"},
            "confidence": 0.8
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Find SENTENCE_ANALYSIS_COMPLETED event
        completion_event = None
        for event in new_state["events_to_write"]:
            if event["payloadJson"].get("kind") == "SENTENCE_ANALYSIS_COMPLETED":
                completion_event = event
                break
        
        assert completion_event is not None
        assert completion_event["payloadJson"]["mode"] == "DIDACTIC"
        assert completion_event["payloadJson"]["scaffolding_level"] == 2


def test_sentence_node_llm_provided_quick_replies(sentence_mock_state):
    """Test SentenceNode uses LLM-provided quick replies when available."""
    sentence_mock_state["transfer_metadata"]["mode"] = "DIDACTIC"
    
    with patch("educator.nodes.transfer.sentence_node.SENTENCE_PROMPT") as mock_prompt, \
         patch("educator.nodes.transfer.sentence_node.llm_factory") as mock_factory:
        
        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_prompt.__or__.return_value = mock_chain
        mock_factory.get_cheap_llm.return_value = mock_llm
        
        # LLM provides custom quick_replies
        json_response = """
        {
            "main_clause": "test",
            "main_idea": "test",
            "subordinate_clauses": [],
            "connectors": [],
            "simplification": "test",
            "rewrite_layered": {"L1": "test", "L2": "test", "L3": "test"},
            "quick_replies": ["Custom reply 1", "Custom reply 2"],
            "confidence": 0.8
        }
        """
        mock_response = MagicMock()
        mock_response.content = json_response
        mock_chain.invoke.return_value = mock_response
        
        new_state = sentence_handle(sentence_mock_state)
        
        # Should use LLM-provided quick replies, not fallback
        assert "quick_replies" in new_state
        assert "Custom reply 1" in new_state["quick_replies"]
        assert "Custom reply 2" in new_state["quick_replies"]
        assert "Faça 2 exercícios" not in new_state["quick_replies"]  # Not fallback
