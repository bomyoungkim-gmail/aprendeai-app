"""
Pydantic Models for API Requests/Responses

Mirrors NestJS DTOs for consistency across services.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class PromptMetadata(BaseModel):
    """Metadata for prompt message"""
    uiMode: str = Field(..., description="PRE | DURING | POST | PLAN")
    contentId: str
    assetLayer: str = Field(..., description="L1 | L2 | L3")
    readingIntent: str = Field(..., description="inspectional | analytical | syntopical")
    blockId: Optional[str] = None
    chunkId: Optional[str] = None
    page: Optional[int] = None
    span: Optional[Dict[str, int]] = None


class PromptMessage(BaseModel):
    """
    Prompt message from learner/educator.
    Mirrors: PromptMessageDto from NestJS
    """
    threadId: str = Field(..., description="LangGraph thread ID")
    readingSessionId: str = Field(..., description="Session ID from NestJS")
    actorRole: str = Field(..., description="LEARNER | EDUCATOR")
    text: str = Field(..., max_length=2000, description="User's prompt text")
    clientTs: str = Field(..., description="ISO timestamp from client")
    metadata: PromptMetadata


class HilRequest(BaseModel):
    """Human-in-loop request (if needed)"""
    required: bool
    actorRole: str
    question: str
    options: Optional[List[str]] = None


class TurnRequest(BaseModel):
    """
    Request to process one turn of conversation.
    
    Example:
    {
        "promptMessage": {
            "threadId": "th_123",
            "readingSessionId": "rs_456",
            "actorRole": "LEARNER",
            "text": "/mark unknown: inferir",
            "clientTs": "2024-01-01T10:00:00Z",
            "metadata": {...}
        }
    }
    """
    promptMessage: PromptMessage


class TurnResponse(BaseModel):
    """
    Response from Educator Agent.
    Mirrors: AgentTurnResponseDto from NestJS
    
    Example:
    {
        "threadId": "th_123",
        "readingSessionId": "rs_456",
        "nextPrompt": "Ótimo! Continue lendo...",
        "quickReplies": ["Continuar", "Pular"],
        "eventsToWrite": [...],
        "hilRequest": null
    }
    """
    threadId: str
    readingSessionId: str
    nextPrompt: str = Field(..., description="Agent's next question/instruction")
    quickReplies: List[str] = Field(default_factory=list, description="Quick reply options")
    eventsToWrite: List[Dict[str, Any]] = Field(default_factory=list, description="Events to persist")
    hilRequest: Optional[HilRequest] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    timestamp: str
    llm_available: bool
    nestjs_connected: bool
