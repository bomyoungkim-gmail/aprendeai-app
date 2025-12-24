"""
Configuration Loader for Games

Loads declarative configuration from YAML files.
Includes:
- Game Triggers
- Scoring Rules
- Balancing Policy
"""
import yaml
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import os

logger = logging.getLogger(__name__)


class GameConfigLoader:
    """Singleton loader for game configurations"""
    
    _instance = None
    _config_cache: Dict[str, Any] = {}
    
    CONFIG_DIR = Path(__file__).parent
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GameConfigLoader, cls).__new__(cls)
        return cls._instance

    def load_triggers(self) -> Dict[str, Any]:
        """Load game_triggers.yaml"""
        return self._load_yaml("triggers.yaml")
        
    def load_scoring(self) -> Dict[str, Any]:
        """Load scoring_rules.yaml"""
        return self._load_yaml("scoring_rules.yaml")
    
    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        """Generic YAML loader with caching"""
        if filename in self._config_cache:
            return self._config_cache[filename]
        
        file_path = self.CONFIG_DIR / filename
        
        try:
            if not file_path.exists():
                logger.warning(f"Config file not found: {file_path}")
                return {}
                
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                
            self._config_cache[filename] = data
            logger.info(f"Loaded config: {filename}")
            return data
            
        except Exception as e:
            logger.error(f"Failed to load config {filename}: {e}")
            return {}

# Global instance
config_loader = GameConfigLoader()
