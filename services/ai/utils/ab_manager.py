
import logging
import zlib
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class ABTestManager:
    """
    Manages A/B tests with deterministic splitting based on User ID.
    Does not require database features for simple splits.
    """
    
    def __init__(self):
        # Hardcoded experiments for now (Phase 1)
        # Key: Experiment Key
        # Value: % of traffic to Test Group (LLM) vs Control (Heuristic)
        # 1.0 = All Test, 0.0 = All Control
        self.experiments = {
            "game_eval_tool_word_hunt": 0.5, # 50/50 split
        }
        
    def should_use_llm(self, experiment_key: str, user_id: str, default_split: float = 0.5) -> bool:
        """
        Determine if user should use LLM (Test Group) or Heuristic (Control Group).
        Returns True for LLM, False for Heuristic.
        """
        if not user_id:
            return True # Default to best experience if no user
            
        # Get configured split or default
        split_ratio = self.experiments.get(experiment_key, default_split)
        
        # Deterministic hash: 0-99
        # crc32 is fast and deterministic
        user_hash = zlib.crc32(user_id.encode()) % 100
        
        # If user_hash < split * 100, assign to Test Group (LLM)
        # e.g. split 0.5 -> Hash 0-49 -> LLM. Hash 50-99 -> Heuristic.
        result = user_hash < (split_ratio * 100)
        
        logger.debug(f"A/B Check [{experiment_key}]: User {user_id} (Hash {user_hash}) -> {'LLM' if result else 'Heuristic'} (Split {split_ratio})")
        
        return result

    def get_group(self, experiment_key: str, user_id: str) -> str:
        """Get the group name for analytics"""
        return "B_VARIANT_LLM" if self.should_use_llm(experiment_key, user_id) else "A_VARIANT_HEURISTIC"

# Singleton instance
ab_manager = ABTestManager()

# Global instance
ab_test_manager = ab_manager
