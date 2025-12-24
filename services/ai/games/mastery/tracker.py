"""
Mastery Tracking System

Tracks per-word and per-theme mastery scores.
Persists to Redis for long-term retention.
"""
from typing import Dict, List, Optional
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Redis connection (lazy init)
_redis_client = None


def get_redis():
    """Get or create Redis client"""
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            import os
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            _redis_client = redis.from_url(redis_url, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            _redis_client = None
    return _redis_client


class MasteryTracker:
    """
    Tracks mastery scores for words and themes.
    
    Mastery Score: 0-100
    - Based on game performance history
    - Exponential moving average
    - Persists to Redis
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.redis = get_redis()
        
    def update_word_mastery(self, word: str, score: float, max_score: float) -> float:
        """
        Update mastery for a word based on recent performance.
        
        Args:
            word: Target word
            score: Score achieved
            max_score: Maximum possible score
            
        Returns:
            Updated mastery score (0-100)
        """
        # Calculate performance percentage
        performance = (score / max_score) * 100 if max_score > 0 else 0
        
        # Get current mastery
        current_mastery = self.get_word_mastery(word)
        
        # Exponential moving average (α = 0.3)
        # Gives 70% weight to history, 30% to new performance
        new_mastery = current_mastery * 0.7 + performance * 0.3
        
        # Store in Redis
        if self.redis:
            key = f"mastery:user:{self.user_id}:word:{word}"
            try:
                self.redis.set(key, new_mastery)
                self.redis.expire(key, 86400 * 90)  # 90 days TTL
            except Exception as e:
                logger.error(f"Failed to save mastery to Redis: {e}")
        
        return new_mastery
    
    def get_word_mastery(self, word: str) -> float:
        """Get current mastery score for a word (0-100)"""
        if self.redis:
            key = f"mastery:user:{self.user_id}:word:{word}"
            try:
                mastery = self.redis.get(key)
                return float(mastery) if mastery else 50.0  # Default: 50
            except Exception as e:
                logger.error(f"Failed to get mastery from Redis: {e}")
        
        return 50.0  # Default if no Redis
    
    def update_theme_mastery(self, theme: str, words: List[str]) -> float:
        """
        Calculate theme mastery as average of word masteries.
        
        Args:
            theme: Theme identifier (e.g., "Python Basics")
            words: List of words in this theme
            
        Returns:
            Theme mastery score (0-100)
        """
        if not words:
            return 50.0
            
        # Average mastery of all words in theme
        word_masteries = [self.get_word_mastery(w) for w in words]
        theme_mastery = sum(word_masteries) / len(word_masteries)
        
        # Store theme mastery
        if self.redis:
            key = f"mastery:user:{self.user_id}:theme:{theme}"
            try:
                self.redis.set(key, theme_mastery)
                self.redis.expire(key, 86400 * 90)
            except Exception as e:
                logger.error(f"Failed to save theme mastery: {e}")
        
        return theme_mastery
    
    def get_theme_mastery(self, theme: str) -> float:
        """Get current mastery score for a theme"""
        if self.redis:
            key = f"mastery:user:{self.user_id}:theme:{theme}"
            try:
                mastery = self.redis.get(key)
                return float(mastery) if mastery else 50.0
            except Exception as e:
                logger.error(f"Failed to get theme mastery: {e}")
        
        return 50.0
    
    def get_mastery_report(self) -> Dict:
        """Get full mastery report for user"""
        # This would scan Redis for all user's masteries
        # For now, return placeholder
        return {
            'user_id': self.user_id,
            'total_words_tracked': 0,
            'total_themes_tracked': 0,
            'average_mastery': 50.0
        }
