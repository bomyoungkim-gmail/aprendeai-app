from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from social.manager import social_manager

router = APIRouter(prefix="/social", tags=["social"])

class FriendRequestModel(BaseModel):
    from_user_id: str
    to_user_id: str

class AcceptRequestModel(BaseModel):
    request_id: str

class ChallengeModel(BaseModel):
    challenger_id: str
    challenged_id: str
    game_mode: str = "DUEL_DEBATE"

class ChallengeResultModel(BaseModel):
    challenge_id: str
    user_id: str
    score: int

@router.post("/friends/request")
async def send_friend_request(req: FriendRequestModel):
    """Send a friend request."""
    result = social_manager.send_friend_request(req.from_user_id, req.to_user_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/friends/accept")
async def accept_friend_request(req: AcceptRequestModel):
    """Accept a friend request."""
    result = social_manager.accept_friend_request(req.request_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/friends/{user_id}")
async def get_friends(user_id: str):
    """Get user's friends list."""
    friends = social_manager.get_friends(user_id)
    return {"user_id": user_id, "friends": friends, "count": len(friends)}

@router.post("/challenges/send")
async def send_challenge(req: ChallengeModel):
    """Send a game challenge to another player."""
    result = social_manager.send_challenge(
        req.challenger_id,
        req.challenged_id,
        req.game_mode
    )
    return result

@router.post("/challenges/accept/{challenge_id}")
async def accept_challenge(challenge_id: str):
    """Accept a challenge."""
    result = social_manager.accept_challenge(challenge_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/challenges/submit-result")
async def submit_challenge_result(req: ChallengeResultModel):
    """Submit score for a challenge."""
    result = social_manager.submit_challenge_result(
        req.challenge_id,
        req.user_id,
        req.score
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/leaderboard")
async def get_leaderboard(
    scope: str = "global",
    user_id: Optional[str] = None,
    limit: int = 10
):
    """
    Get leaderboard - global or friends-only.
    
    Args:
        scope: "global" or "friends"
        user_id: Required if scope is "friends"
        limit: Number of entries to return
    """
    friend_ids = None
    if scope == "friends":
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required for friends scope")
        friend_ids = social_manager.get_friends(user_id)
    
    leaderboard = social_manager.get_leaderboard(scope, friend_ids, limit)
    return {"scope": scope, "entries": leaderboard}

@router.get("/challenges/pending/{user_id}")
async def get_pending_challenges(user_id: str):
    """Get challenges where user is challenged (pending acceptance)."""
    # Filter challenges for this user
    pending = [
        c for c in social_manager.challenges
        if c["challenged_id"] == user_id and c["status"] == "pending"
    ]
    return {"user_id": user_id, "pending_challenges": pending}

@router.get("/challenges/active/{user_id}")
async def get_active_challenges(user_id: str):
    """Get active challenges for user."""
    active = [
        c for c in social_manager.challenges
        if (c["challenger_id"] == user_id or c["challenged_id"] == user_id)
        and c["status"] in ["pending", "accepted"]
    ]
    return {"user_id": user_id, "active_challenges": active}
