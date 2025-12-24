from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from realtime.room_manager import room_manager
from games.registry import game_registry
import logging
import json

router = APIRouter(prefix="/ws", tags=["websocket"])

logger = logging.getLogger(__name__)

@router.websocket("/game/{game_mode}/{user_id}")
async def websocket_game_endpoint(websocket: WebSocket, game_mode: str, user_id: str):
    """
    WebSocket endpoint for real-time multiplayer games.
    
    Protocol:
    Client -> Server:
    - {"action": "ready"} - Mark player as ready
    - {"action": "submit", "answer": "..."} - Submit answer
    
    Server -> Client:
    - {"type": "matched", "room_id": "..."} - Matched to room
    - {"type": "waiting"} - Waiting for opponent
    - {"type": "game_start", "round_data": {...}} - Game starting
    - {"type": "player_submitted", "user_id": "..."} - Other player submitted
    - {"type": "results", "evaluation": {...}} - Game results
    """
    await websocket.accept()
    
    try:
        # Matchmaking
        room = await room_manager.find_match(user_id, game_mode, websocket)
        
        await websocket.send_text(json.dumps({
            "type": "matched",
            "room_id": room.room_id,
            "players_count": len(room.players),
            "max_players": room.max_players
        }))
        
        # Notify room
        await room.broadcast({
            "type": "player_joined",
            "user_id": user_id,
            "players_count": len(room.players)
        })
        
        # If room is full, prepare game
        if room.is_full():
            # Create game instance
            game_class = game_registry.get_game(game_mode)
            game_instance = game_class()
            
            # Generate round
            round_data = game_instance.create_round(
                {"content_slice": "Sample educational content"},
                difficulty=3
            )
            
            await room_manager.start_game(room.room_id, round_data)
        else:
            await websocket.send_text(json.dumps({
                "type": "waiting",
                "message": "Aguardando oponente..."
            }))
        
        # Handle messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            
            if action == "ready":
                room_manager.set_player_ready(user_id, True)
                await room.broadcast({
                    "type": "player_ready",
                    "user_id": user_id
                })
                
            elif action == "submit":
                answer = message.get("answer", "")
                
                # Check if all submitted
                result = await room_manager.submit_answer(user_id, answer)
                
                if result:
                    # All players submitted - evaluate
                    submissions = result["submissions"]
                    
                    # Combine answers for dual evaluation
                    combined_answer = json.dumps({
                        f"player_{i+1}": submissions[uid]
                        for i, uid in enumerate(submissions.keys())
                    })
                    
                    # Get game and evaluate
                    game_class = game_registry.get_game(game_mode)
                    game_instance = game_class()
                    
                    evaluation = await game_instance.evaluate_answer(
                        room.game_state["round_data"],
                        combined_answer
                    )
                    
                    # Broadcast results
                    await room.broadcast({
                        "type": "results",
                        "evaluation": evaluation,
                        "submissions": submissions
                    })
                    
                    # Mark room as completed
                    room.game_state["status"] = "completed"
            
            elif action == "leave":
                break
                
    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        room_manager.leave_room(user_id)
