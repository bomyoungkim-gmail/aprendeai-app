from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from gamification.engine import gamification_engine

router = APIRouter(prefix="/gamification", tags=["gamification"])

class AwardXPRequest(BaseModel):
    user_id: str
    score: int
    max_score: int = 100

class UserStatsRequest(BaseModel):
    user_id: str

@router.post("/award-xp")
async def award_xp(req: AwardXPRequest):
    """
    Award XP for game completion.
    Returns XP earned and level-up status.
    """
    try:
        result = await gamification_engine.award_xp_for_game(
            req.user_id,
            req.score,
            req.max_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-streak")
async def update_streak(req: UserStatsRequest):
    """
    Update user's daily streak.
    """
    try:
        result = await gamification_engine.update_streak(req.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/badges/check/{user_id}")
async def check_badges(user_id: str):
    """
    Check which badges user is eligible for.
    
    NOTE: This is a mock endpoint. In production, query actual user stats from DB.
    """
    # Mock stats
    user_stats = {
        "total_games_played": 50,
        "current_streak": 3,
        "best_streak": 15,
        "perfect_scores_count": 5,
        "morning_sessions": 2
    }
    
    eligible = gamification_engine.check_badge_eligibility(user_stats)
    return {"eligible_badges": eligible}

@router.get("/level/{user_id}")
async def get_level_info(user_id: str):
    """
    Get user's current level and progress.
    
    NOTE: Mock implementation - returns sample data.
    """
    # Mock: Assume user has 7500 XP
    total_xp = 7500
    level_info = gamification_engine.xp_for_next_level(total_xp)
    return level_info
