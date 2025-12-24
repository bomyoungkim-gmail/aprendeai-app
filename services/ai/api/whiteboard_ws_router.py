from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from whiteboard.manager import whiteboard_manager
import logging
import json

router = APIRouter(prefix="/ws", tags=["whiteboard-ws"])

logger = logging.getLogger(__name__)

@router.websocket("/whiteboard/{session_id}/{user_id}")
async def whiteboard_websocket(websocket: WebSocket, session_id: str, user_id: str, role: str = "student"):
    """
    WebSocket endpoint for collaborative whiteboard.
    
    Protocol:
    Client -> Server:
    - {"action": "draw", "data": {...}} - Drawing stroke
    - {"action": "erase", "data": {...}} - Erase
    - {"action": "clear"} - Clear canvas
    - {"action": "text", "data": {...}} - Add text
    - {"action": "shape", "data": {...}} - Add shape
    
    Server -> Client:
    - {"type": "full_sync", "drawing_data": [...]} - Initial state
    - {"type": "draw", "user_id": "...", "data": {...}} - Remote draw action
    - {"type": "participant_joined", "user_id": "..."} - New participant
    - {"type": "participant_left", "user_id": "..."} - Participant left
    """
    await websocket.accept()
    
    try:
        # Join session
        success = whiteboard_manager.join_session(session_id, user_id, websocket, role)
        
        if not success:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Session not found"
            }))
            await websocket.close()
            return
        
        # Send full state sync
        await whiteboard_manager.sync_full_state(user_id, websocket)
        
        # Notify others
        session = whiteboard_manager.get_session(session_id)
        if session:
            await session.broadcast_action({
                "type": "participant_joined",
                "user_id": user_id,
                "role": role
            }, exclude_user=user_id)
        
        # Handle messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action_type = message.get("action")
            
            if action_type in ["draw", "erase", "clear", "text", "shape"]:
                await whiteboard_manager.handle_drawing_action(user_id, message)
            
    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected from whiteboard {session_id}")
    except Exception as e:
        logger.error(f"Error in whiteboard websocket: {e}")
    finally:
        # Notify others of departure
        session = whiteboard_manager.get_session(session_id)
        if session:
            await session.broadcast_action({
                "type": "participant_left",
                "user_id": user_id
            })
        
        whiteboard_manager.leave_session(user_id)
