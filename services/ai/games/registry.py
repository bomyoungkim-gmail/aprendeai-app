"""
Game Registry - Auto-discovery of game modules
No hard-coded game lists - modules self-register by implementing GameModule protocol.

Usage:
    from games.registry import game_registry
    
    # Get game by ID
    game_class = game_registry.get_game("BOSS_FIGHT_VOCAB")
    game = game_class()
    
    # List all games
    all_games = game_registry.list_games()
    
    # List with filters
    short_games = game_registry.list_games({'max_duration': 5})
"""
from typing import Dict, Type, Optional, List
import importlib
import inspect
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class GameRegistry:
    """
    Auto-discovers and registers game modules from games/modes/ directory.
    Modules self-register by implementing the GameModule protocol.
    """
    
    def __init__(self):
        self._games: Dict[str, Type] = {}
        self._discovered = False
    
    def discover_games(self):
        """
        Auto-discover game modules from games/modes/ directory.
        Call this explicitly after imports are ready.
        """
        if self._discovered:
            logger.debug("Games already discovered, skipping")
            return
        
        games_dir = Path(__file__).parent / "modes"
        
        if not games_dir.exists():
            logger.warning(f"Games directory not found: {games_dir}")
            return
        
        logger.info(f"Discovering games in: {games_dir}")
        
        for file in games_dir.glob("*.py"):
            if file.name.startswith("_"):
                continue
            
            try:
                module_name = f"games.modes.{file.stem}"
                module = importlib.import_module(module_name)
                
                # Find classes that have GAME_ID attribute
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if hasattr(obj, 'GAME_ID') and hasattr(obj, 'create_round'):
                        game_id = obj.GAME_ID
                        
                        # Skip abstract/template classes where GAME_ID is not set
                        if game_id is NotImplemented:
                            continue
                            
                        self._games[game_id] = obj
                        logger.info(
                            f"Registered game: {game_id}",
                            extra={
                                'game_id': game_id,
                                'game_name': getattr(obj, 'GAME_NAME', 'Unknown'),
                                'module': module_name
                            }
                        )
            except Exception as e:
                logger.error(
                    f"Failed to load game module: {file.name}",
                    extra={'error': str(e)},
                    exc_info=True
                )
        
        self._discovered = True
        logger.info(f"Game discovery complete. Registered {len(self._games)} games")
    
    def get_game(self, game_id: str) -> Type:
        """
        Get game class by ID.
        
        Args:
            game_id: Game mode ID (e.g., "BOSS_FIGHT_VOCAB")
            
        Returns:
            Game class
            
        Raises:
            ValueError: If game_id not found
        """
        if not self._discovered:
            self.discover_games()
        
        if game_id not in self._games:
            available = list(map(str, self._games.keys()))  # Convert to str for safety
            raise ValueError(
                f"Unknown game mode: {game_id}. "
                f"Available games: {', '.join(available)}"
            )
        
        return self._games[game_id]
    
    def list_games(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        List all registered games with optional filters.
        
        Args:
            filters: Optional dict with filter criteria:
                - max_duration: int (max duration in minutes)
                - min_duration: int (min duration in minutes)
                - requires_content: bool
                - game_intent: str ("solo", "group_sync", "group_async")
                - difficulty_min: int (1-5)
                - difficulty_max: int (1-5)
        
        Returns:
            List of game metadata dicts
        """
        if not self._discovered:
            self.discover_games()
        
        games = []
        
        for game_id, game_class in self._games.items():
            metadata = {
                'id': game_id,
                'name': getattr(game_class, 'GAME_NAME', 'Unknown'),
                'duration_min': getattr(game_class, 'DURATION_MIN', 0),
                'requires_content': getattr(game_class, 'REQUIRES_CONTENT', True),
                'game_intent': getattr(game_class, 'GAME_INTENT', 'solo'),
                'difficulty_range': getattr(game_class, 'DIFFICULTY_RANGE', (1, 5)),
            }
            
            # Apply filters
            if filters:
                # Duration filters
                if 'max_duration' in filters:
                    if metadata['duration_min'] > filters['max_duration']:
                        continue
                
                if 'min_duration' in filters:
                    if metadata['duration_min'] < filters['min_duration']:
                        continue
                
                # Content requirement filter
                if 'requires_content' in filters:
                    if metadata['requires_content'] != filters['requires_content']:
                        continue
                
                # Game intent filter
                if 'game_intent' in filters:
                    if metadata['game_intent'] != filters['game_intent']:
                        continue
                
                # Difficulty filters
                if 'difficulty_min' in filters:
                    if metadata['difficulty_range'][1] < filters['difficulty_min']:
                        continue
                
                if 'difficulty_max' in filters:
                    if metadata['difficulty_range'][0] > filters['difficulty_max']:
                        continue
            
            games.append(metadata)
        
        return games
    
    def is_registered(self, game_id: str) -> bool:
        """Check if a game is registered"""
        if not self._discovered:
            self.discover_games()
        return game_id in self._games
    
    def count(self) -> int:
        """Get count of registered games"""
        if not self._discovered:
            self.discover_games()
        return len(self._games)


# Global registry instance
game_registry = GameRegistry()
