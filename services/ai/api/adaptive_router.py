from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from adaptive.engine import adaptive_engine

router = APIRouter(prefix="/adaptive", tags=["adaptive-learning"])

class PerformanceData(BaseModel):
    recent_scores: List[Dict[str, Any]] = []
    topic_performance: Dict[str, List[float]] = {}
    completed_content: List[str] = []
    time_spent_minutes: int = 0

class LearningPathRequest(BaseModel):
    user_id: str
    performance_data: PerformanceData
    learning_goals: Optional[List[str]] = None

class DifficultyRequest(BaseModel):
    user_history: List[Dict[str, Any]]

@router.post("/learning-path")
async def get_learning_path(req: LearningPathRequest):
    """
    Generate personalized learning path based on user performance.
    
    Returns recommended next actions with game modes and difficulty.
    """
    try:
        path = await adaptive_engine.generate_learning_path(
            req.user_id,
            req.performance_data.dict(),
            req.learning_goals
        )
        return path
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend-difficulty")
async def recommend_difficulty(req: DifficultyRequest):
    """
    Recommend optimal difficulty level based on performance history.
    
    Returns difficulty level (1-5) and reasoning.
    """
    try:
        difficulty = adaptive_engine.recommend_difficulty(req.user_history)
        
        # Calculate skill level for context
        skill = adaptive_engine.learner_model.calculate_skill_level(req.user_history)
        improving = adaptive_engine.learner_model.is_improving(req.user_history)
        
        return {
            "recommended_difficulty": difficulty,
            "current_skill_level": skill,
            "trend": "improving" if improving else "plateaued",
            "reasoning": f"Based on skill level {skill}, recommend difficulty {difficulty}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/skill-analysis/{user_id}")
async def analyze_skill(user_id: str):
    """
    Analyze user's skill level and identify struggle areas.
    
    NOTE: Mock implementation - would query actual performance data from DB.
    """
    # Mock performance data
    mock_history = [
        {"score": 75, "max_score": 100, "timestamp": "2024-01-01"},
        {"score": 80, "max_score": 100, "timestamp": "2024-01-02"},
        {"score": 85, "max_score": 100, "timestamp": "2024-01-03"},
    ]
    
    mock_topic_perf = {
        "mathematics": [0.75, 0.80, 0.85],
        "science": [0.60, 0.55, 0.58],  # Struggling
        "history": [0.90, 0.92, 0.95]
    }
    
    skill = adaptive_engine.learner_model.calculate_skill_level(mock_history)
    struggling = adaptive_engine.learner_model.detect_struggle_topics(mock_topic_perf)
    
    return {
        "user_id": user_id,
        "skill_level": skill,
        "struggling_topics": struggling,
        "topic_breakdown": mock_topic_perf
    }
