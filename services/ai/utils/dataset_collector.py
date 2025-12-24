import json
import os
import aiofiles
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class DatasetCollector:
    """
    Collects game interaction data for fine-tuning.
    Stores data in JSONL format, rotated daily.
    """
    
    def __init__(self, storage_dir: str = "data/fine_tuning"):
        self.storage_dir = storage_dir
        self.ensure_storage_dir()
        
    def ensure_storage_dir(self):
        """Ensure storage directory exists"""
        if not os.path.exists(self.storage_dir):
            try:
                os.makedirs(self.storage_dir)
            except Exception as e:
                logger.error(f"Failed to create storage dir {self.storage_dir}: {e}")

    def _get_file_path(self) -> str:
        """Get current day's log file path"""
        today = datetime.utcnow().strftime('%Y-%m-%d')
        return os.path.join(self.storage_dir, f"game_interactions_{today}.jsonl")

    async def log_interaction(
        self,
        game_mode: str,
        user_id: Optional[str],
        prompt_data: Dict[str, Any],
        user_answer: str,
        evaluation_result: Dict[str, Any]
    ):
        """
        Log a single interaction to the dataset.
        
        Args:
            game_mode: The ID of the game played
            user_id: The ID of the user (hashed or raw)
            prompt_data: The prompt or round data presented to user
            user_answer: The user's response
            evaluation_result: The feedback and score from evaluation
        """
        try:
            entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'game_mode': game_mode,
                'user_id': user_id,
                'prompt': prompt_data,
                'completion': user_answer,
                'evaluation': evaluation_result
            }
            
            file_path = self._get_file_path()
            async with aiofiles.open(file_path, mode='a', encoding='utf-8') as f:
                await f.write(json.dumps(entry, ensure_ascii=False) + '\n')
                
        except Exception as e:
            # Do not crash the game if logging fails
            logger.error(f"Failed to log interaction for {game_mode}: {e}")

# Singleton instance
dataset_collector = DatasetCollector()
