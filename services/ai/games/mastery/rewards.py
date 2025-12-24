"""
Rewards System

Awards stars, tracks streaks, and manages difficulty unlocks.
"""
from typing import Dict, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RewardsSystem:
    """
    Manages game rewards and progression.
    
    Features:
    - Stars (0-3) based on score
    - Streak tracking
    - Difficulty unlock logic
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self._current_streak = 0
        self._last_game_date = None
        
    def calculate_stars(self, score: float, max_score: float) -> int:
        """
        Calculate stars earned (0-3).
        
        Args:
            score: Score achieved
            max_score: Maximum possible score
            
        Returns:
            Stars earned (0-3)
        """
        if max_score == 0:
            return 0
            
        percentage = (score / max_score) * 100
        
        if percentage >= 90:
            return 3  # ⭐⭐⭐
        elif percentage >= 70:
            return 2  # ⭐⭐
        elif percentage >= 50:
            return 1  # ⭐
        else:
            return 0  # No stars
    
    def update_streak(self, won: bool) -> int:
        """
        Update win streak.
        
        Args:
            won: Whether user won the game
            
        Returns:
            Current streak count
        """
        today = datetime.now().date()
        
        # Check if streak continues
        if self._last_game_date:
            days_diff = (today - self._last_game_date).days
            
            # Streak broken if > 1 day gap or loss
            if days_diff > 1 or not won:
                self._current_streak = 0
        
        # Increment streak if won
        if won:
            self._current_streak += 1
        else:
            self._current_streak = 0
            
        self._last_game_date = today
        return self._current_streak
    
    def get_streak_bonus(self, streak: int) -> float:
        """
        Calculate bonus multiplier from streak.
        
        Args:
            streak: Current win streak
            
        Returns:
            Score multiplier (1.0 - 2.0)
        """
        if streak >= 10:
            return 2.0  # 100% bonus
        elif streak >= 5:
            return 1.5  # 50% bonus
        elif streak >= 3:
            return 1.2  # 20% bonus
        else:
            return 1.0  # No bonus
    
    def is_difficulty_unlocked(
        self, 
        difficulty: int, 
        mastery_score: float
    ) -> bool:
        """
        Check if difficulty level is unlocked.
        
        Args:
            difficulty: Difficulty level (1-5)
            mastery_score: User's mastery score (0-100)
            
        Returns:
            Whether difficulty is unlocked
        """
        # Unlock thresholds
        thresholds = {
            1: 0,   # Always unlocked
            2: 20,  # Novice
            3: 40,  # Intermediate
            4: 60,  # Advanced
            5: 80,  # Expert
        }
        
        required = thresholds.get(difficulty, 0)
        return mastery_score >= required
    
    def get_reward_summary(
        self, 
        score: float, 
        max_score: float, 
        streak: int
    ) -> Dict:
        """
        Get full reward summary for a game.
        
        Returns:
            Dictionary with stars, streak, bonuses
        """
        stars = self.calculate_stars(score, max_score)
        streak_bonus = self.get_streak_bonus(streak)
        total_score = score * streak_bonus
        
        return {
            'stars': stars,
            'streak': streak,
            'streak_bonus': streak_bonus,
            'base_score': score,
            'total_score': total_score,
            'max_score': max_score,
        }
