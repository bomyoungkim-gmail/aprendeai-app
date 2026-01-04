
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
