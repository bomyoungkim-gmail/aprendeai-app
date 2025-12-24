"""
Whiteboard Collaboration Manager

Manages real-time collaborative whiteboards for visual tutoring.
Synchronizes drawing actions across multiple participants via WebSocket.
"""
import logging
from typing import Dict, Any, List, Set, Optional
from datetime import datetime
from collections import defaultdict
import json

logger = logging.getLogger(__name__)

class WhiteboardSession:
    """Represents a collaborative whiteboard session."""
    
    def __init__(self, session_id: str, creator_id: str):
        self.session_id = session_id
        self.creator_id = creator_id
        self.participants: Dict[str, Any] = {}  # {user_id: {"ws": websocket, "role": "tutor|student"}}
        self.drawing_data: List[Dict[str, Any]] = []  # History of drawing actions
        self.created_at = datetime.utcnow()
        self.metadata = {
            "title": "Collaborative Whiteboard",
            "topic": None
        }
    
    async def broadcast_action(self, action: Dict[str, Any], exclude_user: Optional[str] = None):
        """Broadcast drawing action to all participants."""
        for user_id, participant in self.participants.items():
            if exclude_user and user_id == exclude_user:
                continue
            try:
                await participant["ws"].send_text(json.dumps(action))
            except Exception as e:
                logger.error(f"Error broadcasting to {user_id}: {e}")
    
    def add_participant(self, user_id: str, websocket: Any, role: str = "student"):
        """Add participant to session."""
        self.participants[user_id] = {"ws": websocket, "role": role}
    
    def remove_participant(self, user_id: str):
        """Remove participant from session."""
        self.participants.pop(user_id, None)
    
    def record_action(self, action: Dict[str, Any]):
        """Record drawing action in history."""
        action["timestamp"] = datetime.utcnow().isoformat()
        self.drawing_data.append(action)


class WhiteboardManager:
    """Manages all whiteboard sessions."""
    
    def __init__(self):
        self.sessions: Dict[str, WhiteboardSession] = {}
        self.user_sessions: Dict[str, str] = {}  # {user_id: session_id}
    
    def create_session(self, creator_id: str, title: Optional[str] = None, topic: Optional[str] = None) -> WhiteboardSession:
        """Create a new whiteboard session."""
        session_id = f"wb_{len(self.sessions)}_{int(datetime.utcnow().timestamp())}"
        session = WhiteboardSession(session_id, creator_id)
        
        if title:
            session.metadata["title"] = title
        if topic:
            session.metadata["topic"] = topic
        
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[WhiteboardSession]:
        """Get session by ID."""
        return self.sessions.get(session_id)
    
    def join_session(self, session_id: str, user_id: str, websocket: Any, role: str = "student") -> bool:
        """Add user to session."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        session.add_participant(user_id, websocket, role)
        self.user_sessions[user_id] = session_id
        return True
    
    def leave_session(self, user_id: str):
        """Remove user from their session."""
        session_id = self.user_sessions.get(user_id)
        if not session_id:
            return
        
        session = self.get_session(session_id)
        if session:
            session.remove_participant(user_id)
            
            # Clean up empty sessions
            if len(session.participants) == 0:
                self.sessions.pop(session_id, None)
        
        self.user_sessions.pop(user_id, None)
    
    async def handle_drawing_action(self, user_id: str, action: Dict[str, Any]) -> bool:
        """
        Process and broadcast drawing action.
        
        Action types:
        - draw: Drawing stroke
        - erase: Erase stroke
        - clear: Clear canvas
        - text: Add text
        - shape: Add shape (circle, rectangle, arrow)
        """
        session_id = self.user_sessions.get(user_id)
        if not session_id:
            return False
        
        session = self.get_session(session_id)
        if not session:
            return False
        
        # Add user info to action
        action["user_id"] = user_id
        
        # Record in history
        session.record_action(action)
        
        # Broadcast to other participants
        await session.broadcast_action(action, exclude_user=user_id)
        
        return True
    
    async def sync_full_state(self, user_id: str, websocket: Any):
        """Send full drawing state to newly joined user."""
        session_id = self.user_sessions.get(user_id)
        if not session_id:
            return
        
        session = self.get_session(session_id)
        if not session:
            return
        
        # Send full history
        await websocket.send_text(json.dumps({
            "type": "full_sync",
            "session_id": session_id,
            "metadata": session.metadata,
            "drawing_data": session.drawing_data,
            "participants": list(session.participants.keys())
        }))


# Global instance
whiteboard_manager = WhiteboardManager()
