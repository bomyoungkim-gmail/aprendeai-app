"""
Difficulty Adaptation System

Automatically adjusts game difficulty based on user performance.
"""
from typing import Dict, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class DifficultyAdapter:
    """
    Adapts difficulty based on accuracy.
    
    Rules:
    - Accuracy > 80%: Increase difficulty (max 5)
    - Accuracy < 50%: Decrease difficulty (min 1)
    - Cooldown: 3 games between adjustments
    """
    
    SCALE_MIN = 1
    SCALE_MAX = 5
    COOLDOWN_GAMES = 3
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self._last_adjustment = None
        self._games_since_adjustment = 0
        
    def should_adjust(self, accuracy: float, current_difficulty: int) -> Optional[int]:
        """
        Determine if difficulty should be adjusted.
        
        Args:
            accuracy: Performance accuracy (0-1)
            current_difficulty: Current difficulty level (1-5)
            
        Returns:
            New difficulty level, or None if no change
        """
        # Check cooldown
        if self._games_since_adjustment < self.COOLDOWN_GAMES:
            self._games_since_adjustment += 1
            return None
        
        new_difficulty = current_difficulty
        
        # High accuracy → increase difficulty
        if accuracy > 0.80 and current_difficulty < self.SCALE_MAX:
            new_difficulty = min(current_difficulty + 1, self.SCALE_MAX)
            logger.info(f"Increasing difficulty: {current_difficulty} → {new_difficulty}")
            
        # Low accuracy → decrease difficulty
        elif accuracy < 0.50 and current_difficulty > self.SCALE_MIN:
            new_difficulty = max(current_difficulty - 1, self.SCALE_MIN)
            logger.info(f"Decreasing difficulty: {current_difficulty} → {new_difficulty}")
        
        # If changed, reset cooldown
        if new_difficulty != current_difficulty:
            self._games_since_adjustment = 0
            self._last_adjustment = datetime.now()
            return new_difficulty
        else:
            self._games_since_adjustment += 1
            return None
    
    def get_recommended_difficulty(
        self, 
        game_mode: str, 
        mastery_score: float
    ) -> int:
        """
        Get recommended starting difficulty based on mastery.
        
        Args:
            game_mode: Game mode ID
            mastery_score: User's mastery score (0-100)
            
        Returns:
            Recommended difficulty (1-5)
        """
        # Map mastery to difficulty
        if mastery_score >= 80:
            return 5  # Expert
        elif mastery_score >= 60:
            return 4  # Advanced
        elif mastery_score >= 40:
            return 3  # Intermediate
        elif mastery_score >= 20:
            return 2  # Beginner
        else:
            return 1  # Novice
