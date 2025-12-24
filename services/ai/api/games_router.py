"""
Games API Router

Exposes game registry to external clients via REST API.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from games.registry import game_registry

router = APIRouter(prefix="/games", tags=["games"])


@router.get("")
async def list_games() -> Dict[str, Any]:
    """
    Get catalog of all available games.
    
    Returns:
        {
            "games": [
                {
                    "id": "FREE_RECALL_SCORE",
                    "name": "Resumo sem olhar",
                    "difficulty_range": [1, 3],
                    "duration_min": 3,
                    "requires_content": true,
                    "game_intent": "solo"
                },
                ...
            ],
            "total": 15
        }
    """
    # Ensure games are discovered
    game_registry.discover_games()
    
    # Get all games metadata
    games = game_registry.list_games()
    
    return {
        "games": games,
        "total": len(games)
    }


@router.get("/{game_id}")
async def get_game(game_id: str) -> Dict[str, Any]:
    """Get specific game metadata by ID"""
    game_registry.discover_games()
    
    # Get game class
    game_class = game_registry.get_game(game_id)
    
    # Return metadata
    return game_class().get_metadata()
