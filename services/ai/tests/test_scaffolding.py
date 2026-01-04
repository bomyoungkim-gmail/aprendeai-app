"""
Unit tests for Scaffolding Node (AGENT SCRIPT C).
"""

import pytest
from educator.nodes.transfer.scaffolding_node import handle as scaffolding_handle, calculate_scaffolding_level


def test_calculate_scaffolding_level_expert():
    """Test that high mastery (>= 0.8) results in Level 0 (Expert)."""
    mastery_state = {"score": 0.9}
    level = calculate_scaffolding_level(mastery_state, {})
    assert level == 0


def test_calculate_scaffolding_level_practitioner():
    """Test that medium-high mastery (0.6-0.8) results in Level 1 (Practitioner/Fading)."""
    mastery_state = {"score": 0.7}
    level = calculate_scaffolding_level(mastery_state, {})
    assert level == 1


def test_calculate_scaffolding_level_apprentice():
    """Test that medium mastery (0.3-0.6) results in Level 2 (Apprentice)."""
    mastery_state = {"score": 0.5}
    level = calculate_scaffolding_level(mastery_state, {})
    assert level == 2


def test_calculate_scaffolding_level_novice():
    """Test that low mastery (< 0.3) results in Level 3 (Novice)."""
    mastery_state = {"score": 0.2}
    level = calculate_scaffolding_level(mastery_state, {})
    assert level == 3


def test_scaffolding_node_enriches_state():
    """Test that scaffolding_node adds level, max_tokens, and style_instructions to state."""
    state = {
        "intent": "HUGGING",
        "user_id": "user1",
        "session_id": "session1",
        "content_id": "content1",
        "user_profile": {
            "mastery_state_json": {"score": 0.7}
        }
    }
    
    new_state = scaffolding_handle(state)
    
    assert "scaffolding_level" in new_state
    assert new_state["scaffolding_level"] == 1  # Practitioner
    assert "max_tokens" in new_state
    assert new_state["max_tokens"] == 120  # L1 = 120
    assert "style_instructions" in new_state
    assert "EXTREMELY CONCISE" in new_state["style_instructions"]


def test_scaffolding_node_default_level():
    """Test that missing mastery data defaults to Level 2 (Apprentice)."""
    state = {
        "intent": "HUGGING",
        "user_id": "user1",
        "session_id": "session1",
        "content_id": "content1",
        "user_profile": {}
    }
    
    new_state = scaffolding_handle(state)
    
    assert new_state["scaffolding_level"] == 2
    assert new_state["max_tokens"] == 250
