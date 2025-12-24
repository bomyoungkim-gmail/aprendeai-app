from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from srs.scheduler import srs_system

router = APIRouter(prefix="/srs", tags=["spaced-repetition"])

class CreateCardRequest(BaseModel):
    user_id: str
    content: str
    topic: str
    card_id: Optional[str] = None

class ReviewCardRequest(BaseModel):
    user_id: str
    card_id: str
    quality: int  # 0=Again, 1=Hard, 2=Good, 3=Easy
    time_spent_seconds: Optional[int] = None

@router.post("/card/create")
async def create_card(req: CreateCardRequest):
    """
    Create a new SRS card for a concept.
    
    The card will be scheduled for first review immediately.
    """
    try:
        card = srs_system.create_card(
            user_id=req.user_id,
            content=req.content,
            topic=req.topic,
            card_id=req.card_id
        )
        return card.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/card/review")
async def review_card(req: ReviewCardRequest):
    """
    Review a card and update its schedule using SM-2 algorithm.
    
    Quality ratings:
    - 0: Again (didn't remember at all)
    - 1: Hard (remembered with difficulty)
    - 2: Good (remembered correctly)
    - 3: Easy (perfect recall, immediate)
    
    Returns next review date and updated card info.
    """
    try:
        result = srs_system.review_card(
            user_id=req.user_id,
            card_id=req.card_id,
            quality=req.quality,
            time_spent_seconds=req.time_spent_seconds
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/due/{user_id}")
async def get_due_cards(user_id: str, limit: int = 20, topic: Optional[str] = None):
    """
    Get cards due for review today.
    
    Cards are sorted by priority (most overdue first).
    """
    try:
        cards = srs_system.get_due_cards(user_id, limit, topic)
        return {
            "user_id": user_id,
            "due_cards": cards,
            "count": len(cards)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schedule/{user_id}")
async def get_upcoming_schedule(user_id: str, days_ahead: int = 7):
    """
    Get review schedule for next N days.
    
    Returns cards grouped by date.
    """
    try:
        schedule = srs_system.get_upcoming_reviews(user_id, days_ahead)
        
        # Calculate daily counts
        daily_counts = {date: len(cards) for date, cards in schedule.items()}
        
        return {
            "user_id": user_id,
            "days_ahead": days_ahead,
            "schedule": schedule,
            "daily_counts": daily_counts,
            "total_upcoming": sum(daily_counts.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/{user_id}")
async def get_srs_statistics(user_id: str):
    """
    Get comprehensive SRS statistics for user.
    
    Includes:
    - Total cards
    - Due today
    - Mature cards (interval >= 21 days)
    - Retention rate
    - Average ease factor
    """
    try:
        stats = srs_system.get_statistics(user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
