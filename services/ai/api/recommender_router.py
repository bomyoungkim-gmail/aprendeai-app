from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from recommender.engine import recommender

router = APIRouter(prefix="/recommend", tags=["recommendations"])

class RecommendationRequest(BaseModel):
    profile: Dict[str, Any]
    history: List[Dict[str, Any]] = []

@router.post("/")
async def get_recommendations_endpoint(req: RecommendationRequest):
    """
    Get personalized study recommendations.
    """
    try:
        results = await recommender.get_recommendations(req.profile, req.history)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
