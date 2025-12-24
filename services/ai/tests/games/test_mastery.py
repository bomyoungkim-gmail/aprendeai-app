"""
Tests for Mastery Tracking System
"""
import pytest
from games.mastery.tracker import MasteryTracker
from games.mastery.difficulty import DifficultyAdapter
from games.mastery.rewards import RewardsSystem


class TestMasteryTracker:
    
    def test_initial_mastery(self):
        import uuid
        tracker = MasteryTracker(f"test-user-{uuid.uuid4()}")
        mastery = tracker.get_word_mastery("python")
        assert mastery == 50.0  # Default
    
    def test_update_word_mastery(self):
        import uuid
        tracker = MasteryTracker(f"test-user-{uuid.uuid4()}")
        
        # Perfect score
        new_mastery = tracker.update_word_mastery("python", 100, 100)
        assert new_mastery > 50.0  # Should increase
        
        # Poor score
        new_mastery = tracker.update_word_mastery("python", 0, 100)
        assert new_mastery < 50.0  # Should decrease


class TestDifficultyAdapter:
    
    def test_high_accuracy_increases_difficulty(self):
        adapter = DifficultyAdapter("user123")
        
        # Simulate cooldown passing
        adapter._games_since_adjustment = 3
        
        # High accuracy
        new_diff = adapter.should_adjust(accuracy=0.85, current_difficulty=2)
        assert new_diff == 3
    
    def test_low_accuracy_decreases_difficulty(self):
        adapter = DifficultyAdapter("user123")
        adapter._games_since_adjustment = 3
        
        new_diff = adapter.should_adjust(accuracy=0.45, current_difficulty=3)
        assert new_diff == 2
    
    def test_cooldown_prevents_adjustment(self):
        adapter = DifficultyAdapter("user123")
        adapter._games_since_adjustment = 1  # Still in cooldown
        
        new_diff = adapter.should_adjust(accuracy=0.90, current_difficulty=2)
        assert new_diff is None  # No adjustment
    
    def test_recommended_difficulty_from_mastery(self):
        adapter = DifficultyAdapter("user123")
        
        assert adapter.get_recommended_difficulty("TEST", 85) == 5  # Expert
        assert adapter.get_recommended_difficulty("TEST", 65) == 4
        assert adapter.get_recommended_difficulty("TEST", 45) == 3
        assert adapter.get_recommended_difficulty("TEST", 25) == 2
        assert adapter.get_recommended_difficulty("TEST", 10) == 1


class TestRewardsSystem:
    
    def test_calculate_stars(self):
        rewards = RewardsSystem("user123")
        
        assert rewards.calculate_stars(95, 100) == 3  # ⭐⭐⭐
        assert rewards.calculate_stars(75, 100) == 2  # ⭐⭐
        assert rewards.calculate_stars(55, 100) == 1  # ⭐
        assert rewards.calculate_stars(30, 100) == 0  # No stars
    
    def test_streak_tracking(self):
        rewards = RewardsSystem("user123")
        
        # Win streak
        assert rewards.update_streak(True) == 1
        assert rewards.update_streak(True) == 2
        assert rewards.update_streak(True) == 3
        
        # Loss resets
        assert rewards.update_streak(False) == 0
    
    def test_streak_bonus(self):
        rewards = RewardsSystem("user123")
        
        assert rewards.get_streak_bonus(0) == 1.0   # No bonus
        assert rewards.get_streak_bonus(3) == 1.2   # 20%
        assert rewards.get_streak_bonus(5) == 1.5   # 50%
        assert rewards.get_streak_bonus(10) == 2.0  # 100%
    
    def test_difficulty_unlock(self):
        rewards = RewardsSystem("user123")
        
        # Low mastery
        assert rewards.is_difficulty_unlocked(1, 10) == True   # Always
        assert rewards.is_difficulty_unlocked(3, 10) == False  # Locked
        
        # High mastery
        assert rewards.is_difficulty_unlocked(4, 65) == True
        assert rewards.is_difficulty_unlocked(5, 65) == False
        assert rewards.is_difficulty_unlocked(5, 85) == True
