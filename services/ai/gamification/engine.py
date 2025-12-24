"""
Gamification Engine

Manages XP, Levels, Streaks, and Badge Awards.
Integrates with existing Prisma models (Streak, Badge, UserBadge, DailyActivity).

XP System:
- XP is computed from game scores and activities
- For persistent storage, consider adding 'xp' and 'level' fields to User model
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, date

logger = logging.getLogger(__name__)

class GamificationEngine:
    """
    Gamification logic for AprendeAI.
    """
    
    # XP Constants
    XP_PER_GAME_POINT = 10  # 100 points = 1000 XP
    XP_FOR_DAILY_GOAL = 500
    XP_FOR_STREAK_MILESTONE = 1000  # Bonus every 7 days
    
    # Level thresholds (XP required for each level)
    LEVEL_THRESHOLDS = [
        0,      # Level 1
        1000,   # Level 2
        2500,   # Level 3
        5000,   # Level 4
        10000,  # Level 5
        20000,  # Level 6
        35000,  # Level 7
        55000,  # Level 8
        80000,  # Level 9
        120000, # Level 10
    ]
    
    def __init__(self, db_client=None):
        """
        Initialize with optional database client.
        For this implementation, we'll make it stateless and return computed stats.
        """
        self.db = db_client
        
    def calculate_xp_from_score(self, score: int, max_score: int = 100) -> int:
        """Calculate XP earned from a game score."""
        normalized_score = min(100, (score / max_score) * 100) if max_score > 0 else 0
        return int(normalized_score * self.XP_PER_GAME_POINT)
    
    def calculate_level(self, total_xp: int) -> int:
        """Determine level based on total XP."""
        for level, threshold in enumerate(self.LEVEL_THRESHOLDS, start=1):
            if total_xp < threshold:
                return level - 1
        return len(self.LEVEL_THRESHOLDS)  # Max level
    
    def xp_for_next_level(self, current_xp: int) -> Dict[str, int]:
        """Get XP progress to next level."""
        current_level = self.calculate_level(current_xp)
        
        if current_level >= len(self.LEVEL_THRESHOLDS):
            return {
                "current_level": current_level,
                "current_xp": current_xp,
                "next_level_xp": current_xp,  # Max level reached
                "xp_needed": 0,
                "progress_percent": 100
            }
        
        current_threshold = self.LEVEL_THRESHOLDS[current_level - 1] if current_level > 1 else 0
        next_threshold = self.LEVEL_THRESHOLDS[current_level]
        
        xp_in_level = current_xp - current_threshold
        xp_needed_for_level = next_threshold - current_threshold
        progress = (xp_in_level / xp_needed_for_level * 100) if xp_needed_for_level > 0 else 100
        
        return {
            "current_level": current_level,
            "current_xp": current_xp,
            "next_level_xp": next_threshold,
            "xp_needed": next_threshold - current_xp,
            "progress_percent": round(progress, 1)
        }
    
    def check_badge_eligibility(self, user_stats: Dict[str, Any]) -> list:
        """
        Check which badges a user should receive based on their stats.
        
        user_stats should contain:
        - total_games_played
        - current_streak
        - best_streak
        - perfect_scores_count
        etc.
        """
        eligible_badges = []
        
        # Define badge rules
        badge_rules = {
            "FIRST_GAME": lambda s: s.get("total_games_played", 0) >= 1,
            "GAME_MASTER": lambda s: s.get("total_games_played", 0) >= 100,
            "STREAK_WARRIOR": lambda s: s.get("current_streak", 0) >= 7,
            "STREAK_LEGEND": lambda s: s.get("best_streak", 0) >= 30,
            "PERFECTIONIST": lambda s: s.get("perfect_scores_count", 0) >= 10,
            "EARLY_BIRD": lambda s: s.get("morning_sessions", 0) >= 5,
        }
        
        for badge_code, condition in badge_rules.items():
            if condition(user_stats):
                eligible_badges.append(badge_code)
        
        return eligible_badges
    
    async def award_xp_for_game(self, user_id: str, score: int, max_score: int) -> Dict[str, Any]:
        """
        Award XP for completing a game.
        Returns XP awarded and if level-up occurred.
        
        NOTE: This is a mock implementation. In production:
        1. Query current user XP from database
        2. Add new XP
        3. Check for level-up
        4. Update database
        5. Return results
        """
        xp_earned = self.calculate_xp_from_score(score, max_score)
        
        # Mock: Assume user has 5000 XP currently
        # In real implementation: current_xp = await self.db.user.find_unique(...)
        current_xp = 5000  # MOCK
        new_xp = current_xp + xp_earned
        
        old_level = self.calculate_level(current_xp)
        new_level = self.calculate_level(new_xp)
        leveled_up = new_level > old_level
        
        return {
            "xp_earned": xp_earned,
            "total_xp": new_xp,
            "old_level": old_level,
            "new_level": new_level,
            "leveled_up": leveled_up,
            "level_progress": self.xp_for_next_level(new_xp)
        }
    
    async def update_streak(self, user_id: str) -> Dict[str, Any]:
        """
        Update user's streak based on today's activity.
        
        NOTE: Mock implementation. In production:
        1. Query Streak table
        2. Check if last_goal_met_date is yesterday
        3. If yes: increment, if no: reset to 1
        4. Update best_streak if needed
        5. Award streak milestone badges
        """
        # MOCK
        return {
            "current_streak": 3,
            "best_streak": 15,
            "freeze_tokens": 1,
            "streak_bonus_xp": 0  # Award bonus every 7 days
        }

# Singleton
gamification_engine = GamificationEngine()
