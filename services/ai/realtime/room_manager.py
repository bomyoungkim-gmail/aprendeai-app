"""
Real-Time Game Room Manager

Manages WebSocket connections for synchronous multiplayer games.
Handles room creation, player matching, and game state synchronization.
"""
import logging
import json
from typing import Dict, Set, Optional, Any
from datetime import datetime
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)

class GameRoom:
    """Represents a single game room."""
    
    def __init__(self, room_id: str, game_mode: str, max_players: int = 2):
        self.room_id = room_id
        self.game_mode = game_mode
        self.max_players = max_players
        self.players: Dict[str, Any] = {}  # {user_id: {"ws": websocket, "ready": bool}}
        self.game_state = {
            "status": "waiting",  # waiting, active, completed
            "round_data": None,
            "submissions": {},
            "created_at": datetime.utcnow().isoformat()
        }
    
    def is_full(self) -> bool:
        return len(self.players) >= self.max_players
    
    def all_ready(self) -> bool:
        return len(self.players) == self.max_players and all(
            p.get("ready", False) for p in self.players.values()
        )
    
    async def broadcast(self, message: Dict[str, Any], exclude_user: Optional[str] = None):
        """Broadcast message to all players in room."""
        for user_id, player_data in self.players.items():
            if exclude_user and user_id == exclude_user:
                continue
            try:
                await player_data["ws"].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {user_id}: {e}")


class RoomManager:
    """Manages all active game rooms."""
    
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}
        self.user_to_room: Dict[str, str] = {}  # {user_id: room_id}
        self.matchmaking_queue: Dict[str, list] = defaultdict(list)  # {game_mode: [user_ids]}
    
    def create_room(self, game_mode: str = "DUEL_DEBATE", max_players: int = 2) -> GameRoom:
        """Create a new game room."""
        room_id = f"room_{len(self.rooms)}_{datetime.utcnow().timestamp()}"
        room = GameRoom(room_id, game_mode, max_players)
        self.rooms[room_id] = room
        return room
    
    def get_room(self, room_id: str) -> Optional[GameRoom]:
        """Get room by ID."""
        return self.rooms.get(room_id)
    
    def join_room(self, room_id: str, user_id: str, websocket: Any) -> bool:
        """Add player to room."""
        room = self.get_room(room_id)
        if not room or room.is_full():
            return False
        
        room.players[user_id] = {"ws": websocket, "ready": False}
        self.user_to_room[user_id] = room_id
        return True
    
    def leave_room(self, user_id: str):
        """Remove player from their room."""
        room_id = self.user_to_room.get(user_id)
        if not room_id:
            return
        
        room = self.get_room(room_id)
        if room:
            room.players.pop(user_id, None)
            
            # Clean up empty rooms
            if len(room.players) == 0:
                self.rooms.pop(room_id, None)
        
        self.user_to_room.pop(user_id, None)
    
    def set_player_ready(self, user_id: str, ready: bool = True):
        """Mark player as ready."""
        room_id = self.user_to_room.get(user_id)
        if not room_id:
            return
        
        room = self.get_room(room_id)
        if room and user_id in room.players:
            room.players[user_id]["ready"] = ready
    
    async def find_match(self, user_id: str, game_mode: str, websocket: Any) -> Optional[GameRoom]:
        """
        Matchmaking: find or create a room for the user.
        
        Returns:
            GameRoom if matched, None if queued
        """
        # Check for available rooms
        for room in self.rooms.values():
            if room.game_mode == game_mode and not room.is_full():
                self.join_room(room.room_id, user_id, websocket)
                return room
        
        # No available room, create new one
        room = self.create_room(game_mode)
        self.join_room(room.room_id, user_id, websocket)
        return room
    
    async def start_game(self, room_id: str, round_data: Dict[str, Any]):
        """Start the game in a room."""
        room = self.get_room(room_id)
        if not room:
            return
        
        room.game_state["status"] = "active"
        room.game_state["round_data"] = round_data
        
        await room.broadcast({
            "type": "game_start",
            "round_data": round_data,
            "players": list(room.players.keys())
        })
    
    async def submit_answer(self, user_id: str, answer: str) -> Optional[Dict[str, Any]]:
        """
        Submit answer from a player.
        
        Returns:
            Results if all players submitted, None otherwise
        """
        room_id = self.user_to_room.get(user_id)
        if not room_id:
            return None
        
        room = self.get_room(room_id)
        if not room:
            return None
        
        room.game_state["submissions"][user_id] = answer
        
        # Notify other players
        await room.broadcast({
            "type": "player_submitted",
            "user_id": user_id
        }, exclude_user=user_id)
        
        # Check if all submitted
        if len(room.game_state["submissions"]) == len(room.players):
            return {
                "room_id": room_id,
                "submissions": room.game_state["submissions"]
            }
        
        return None


# Global instance
room_manager = RoomManager()
