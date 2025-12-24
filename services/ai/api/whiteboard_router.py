from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from whiteboard.manager import whiteboard_manager

router = APIRouter(prefix="/whiteboard", tags=["whiteboard"])

class CreateSessionRequest(BaseModel):
    creator_id: str
    title: Optional[str] = None
    topic: Optional[str] = None

@router.post("/create")
async def create_whiteboard_session(req: CreateSessionRequest):
    """
    Create a new whiteboard session.
    
    Returns session_id that participants can join via WebSocket.
    """
    try:
        session = whiteboard_manager.create_session(
            creator_id=req.creator_id,
            title=req.title,
            topic=req.topic
        )
        
        return {
            "success": True,
            "session_id": session.session_id,
            "metadata": session.metadata,
            "websocket_url": f"/ws/whiteboard/{session.session_id}/{{user_id}}?role={{role}}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get whiteboard session information."""
    session = whiteboard_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "creator_id": session.creator_id,
        "metadata": session.metadata,
        "participant_count": len(session.participants),
        "participants": list(session.participants.keys()),
        "created_at": session.created_at.isoformat()
    }

@router.get("/session/{session_id}/history")
async def get_drawing_history(session_id: str):
    """Get full drawing history for session."""
    session = whiteboard_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "drawing_data": session.drawing_data,
        "action_count": len(session.drawing_data)
    }
