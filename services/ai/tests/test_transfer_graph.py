"""
Test Transfer Graph Nodes
"""
import pytest
from unittest.mock import MagicMock, patch
from educator.nodes.transfer.mission_feedback_node import handle as feedback_handle
from educator.nodes.transfer.analogy_node import handle as analogy_handle
from educator.nodes.transfer.hugging_node import handle as hugging_handle
from educator.transfer_state import TransferState

def test_mission_feedback_node():
    with patch('educator.nodes.transfer.mission_feedback_node.llm_factory') as mock_factory, \
         patch('educator.nodes.transfer.mission_feedback_node.ChatPromptTemplate') as mock_prompt_cls:
        
        # Setup mocks
        mock_llm = MagicMock()
        mock_factory.get_llm.return_value = mock_llm
        
        mock_prompt_instance = MagicMock()
        mock_prompt_cls.from_messages.return_value = mock_prompt_instance
        
        mock_chain = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Mock Feedback Response"
        mock_chain.invoke.return_value = mock_response
        
        # prompt | llm -> chain
        mock_prompt_instance.__or__.return_value = mock_chain
        
        state: TransferState = {
            "intent": "MISSION_FEEDBACK",
            "user_id": "user-1",
            "session_id": "session-1",
            "content_id": "content-1",
            "mission_data": {
                "mission_type": "EXPLANATION",
                "rubric": {"clarity": 10},
                "user_attempt": "Attempt",
                "template": "Template"
            },
            "transfer_metadata": {},
            "user_profile": {},
            "current_node": None,
            "response_text": "",
            "structured_output": None,
            "events_to_write": [],
            "tokens_used": 0,
            "model_used": None
        }
        
        result = feedback_handle(state)
        
        assert result["current_node"] == "mission_feedback"
        assert "Mock Feedback Response" in result["response_text"]
        assert result["structured_output"]["feedback_generated"] is True

def test_analogy_node():
    with patch('educator.nodes.transfer.analogy_node.llm_factory') as mock_factory, \
         patch('educator.nodes.transfer.analogy_node.ChatPromptTemplate') as mock_prompt_cls:
        
        mock_llm = MagicMock()
        mock_factory.get_llm.return_value = mock_llm
        
        mock_prompt_instance = MagicMock()
        mock_prompt_cls.from_messages.return_value = mock_prompt_instance
        
        mock_chain = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Mock Analogy Response"
        mock_chain.invoke.return_value = mock_response
        
        mock_prompt_instance.__or__.return_value = mock_chain
        
        state: TransferState = {
            "intent": "ANALOGY",
            "user_id": "user-1",
            "session_id": "session-1",
            "content_id": "content-1",
            "transfer_metadata": {"concept": "X"},
            "mission_data": {},
            "user_profile": {},
            "current_node": None,
            "response_text": "",
            "structured_output": None,
            "events_to_write": [],
            "tokens_used": 0,
            "model_used": None
        }
        
        result = analogy_handle(state)
        
        assert result["current_node"] == "analogy"
        assert "Mock Analogy Response" in result["response_text"]

def test_hugging_node():
    with patch('educator.nodes.transfer.hugging_node.llm_factory') as mock_factory, \
         patch('educator.nodes.transfer.hugging_node.ChatPromptTemplate') as mock_prompt_cls:
        
        mock_llm = MagicMock()
        mock_factory.get_llm.return_value = mock_llm
        
        mock_prompt_instance = MagicMock()
        mock_prompt_cls.from_messages.return_value = mock_prompt_instance
        
        mock_chain = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Mock Hugging Response"
        mock_chain.invoke.return_value = mock_response
        
        mock_prompt_instance.__or__.return_value = mock_chain
        
        state: TransferState = {
            "intent": "HUGGING",
            "user_id": "user-1",
            "session_id": "session-1",
            "content_id": "content-1",
            "transfer_metadata": {"concept": "X"},
            "mission_data": {},
            "user_profile": {},
            "current_node": None,
            "response_text": "",
            "structured_output": None,
            "events_to_write": [],
            "tokens_used": 0,
            "model_used": None
        }
        
        result = hugging_handle(state)
        
        assert result["current_node"] == "hugging"
        assert "Mock Hugging Response" in result["response_text"]
