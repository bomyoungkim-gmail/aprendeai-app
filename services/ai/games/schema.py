"""
Game Pydantic Schemas

Data transfer objects for game system.
Ensures validation between Registry, Middleware, and Client.
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from .constants import GameMode, GameDifficulty


class GameMetadata(BaseModel):
    """Metadata for game initialization"""
    game_mode: GameMode = Field(..., alias="gameMode")
    difficulty: GameDifficulty = Field(default=GameDifficulty.MEDIUM)
    correlation_id: Optional[str] = Field(None, alias="correlationId")
    session_id: Optional[str] = Field(None, alias="sessionId")
    user_id: Optional[str] = Field(None, alias="userId")
    
    class Config:
        populate_by_name = True


class GameRound(BaseModel):
    """Structure of a game round sent to client"""
    game_mode: GameMode
    prompt: str
    step: str = "initial"
    difficulty: GameDifficulty
    options: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    # For multi-step games
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class GameResult(BaseModel):
    """Result of a game round evaluation"""
    score: float = Field(..., ge=0)
    max_score: float = Field(..., gt=0)
    feedback: str
    correct: bool
    
    # Detailed breakdown for analytics
    breakdown: Optional[Dict[str, Any]] = None
    
    # For adaptive difficulty
    suggested_difficulty_adjustment: int = 0  # -1, 0, 1


class GameEventPayload(BaseModel):
    """Standardized payload for game events"""
    game_mode: GameMode
    correlation_id: str
    timestamp: Optional[str] = None
    
    # Event specific data
    round_data: Optional[Dict[str, Any]] = None
    result_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
