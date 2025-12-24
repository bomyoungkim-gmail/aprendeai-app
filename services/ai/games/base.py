"""
Base classes and protocols for game modules.

All game modules must implement the GameModule protocol to be
auto-discovered by the game registry.
"""
from typing import Dict, Any, List, Protocol, Tuple
from abc import ABC, abstractmethod


class GameModule(Protocol):
    """
    Protocol that all game modules must implement.
    Used for auto-discovery by the registry.
    """
    
    # Game metadata (class attributes)
    GAME_ID: str                    # Unique ID, e.g., "BOSS_FIGHT_VOCAB"
    GAME_NAME: str                  # Display name
    DIFFICULTY_RANGE: Tuple[int, int]  # Min/max difficulty (1-5)
    DURATION_MIN: int               # Typical duration in minutes
    REQUIRES_CONTENT: bool          # Needs active reading content?
    GAME_INTENT: str                # "solo" | "group_sync" | "group_async"
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        """
        Create a new game round.
        
        Args:
            state: Current pedagogical state (target_words, phase, etc)
            difficulty: Difficulty level (1-5)
            
        Returns:
            Round specification dict with:
                - game_mode: str
                - prompt: str (question/task for user)
                - metadata: dict (any game-specific data)
                - expected_format: str (how user should respond)
        """
        ...
    
    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """
        Evaluate user's answer to a round.
        
        Args:
            round_data: Round spec from create_round()
            answer: User's text response
            
        Returns:
            Evaluation dict with:
                - score: int (points earned)
                - max_score: int (maximum possible)
                - feedback: str (explanation for user)
                - correct: bool (whether answer was correct)
                - breakdown: dict (detailed scoring)
        """
        ...
    
    def get_quick_replies(self, round_data: Dict[str, Any]) -> List[str]:
        """
        Get context-specific quick reply options.
        
        Args:
            round_data: Current round spec
            
        Returns:
            List of quick reply strings
        """
        ...


class BaseGame(ABC):
    """
    Abstract base class for game modules.
    Provides common utilities and enforces interface.
    """
    
    # Subclasses must define these
    GAME_ID: str = NotImplemented
    GAME_NAME: str = NotImplemented
    DIFFICULTY_RANGE: Tuple[int, int] = (1, 5)
    DURATION_MIN: int = 5
    REQUIRES_CONTENT: bool = True
    GAME_INTENT: str = "solo"
    
    def __init__(self, llm_service=None):
        """Initialize game instance with optional LLM service"""
        if self.GAME_ID is NotImplemented:
            raise NotImplementedError(
                f"{self.__class__.__name__} must define GAME_ID"
            )
        if self.GAME_NAME is NotImplemented:
            raise NotImplementedError(
                f"{self.__class__.__name__} must define GAME_NAME"
            )
        self.llm_service = llm_service
    
    @abstractmethod
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        """Create a new game round - must be implemented by subclass"""
        pass
    
    @abstractmethod
    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate user's answer - must be implemented by subclass"""
        pass
    
    def get_quick_replies(self, round_data: Dict[str, Any]) -> List[str]:
        """
        Get quick replies for this round.
        Default implementation, can be overridden.
        """
        return [
            "Não sei",
            "Pular",
            "Preciso de ajuda",
        ]
    
    def validate_difficulty(self, difficulty: int) -> int:
        """Clamp difficulty to valid range"""
        min_diff, max_diff = self.DIFFICULTY_RANGE
        return max(min_diff, min(max_diff, difficulty))
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get game metadata for catalog/registry"""
        return {
            'id': self.GAME_ID,
            'name': self.GAME_NAME,
            'difficulty_range': self.DIFFICULTY_RANGE,
            'duration_min': self.DURATION_MIN,
            'requires_content': self.REQUIRES_CONTENT,
            'game_intent': self.GAME_INTENT,
        }
