from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from analytics.service import advanced_analytics

router = APIRouter(prefix="/analytics", tags=["advanced-analytics"])

@router.get("/learning-curve/{user_id}")
async def get_learning_curve(user_id: str, topic: str, days: int = 30):
    """
    Get learning curve showing performance progression over time.
    
    Returns time-series data suitable for line chart visualization.
    """
    try:
        curve = advanced_analytics.generate_learning_curve(user_id, topic, days)
        return curve
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/skill-heatmap/{user_id}")
async def get_skill_heatmap(user_id: str):
    """
    Get skill proficiency heatmap across topics.
    
    Returns matrix data for heatmap visualization.
    """
    try:
        heatmap = advanced_analytics.generate_skill_heatmap(user_id)
        return heatmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/engagement-funnel")
async def get_engagement_funnel(cohort: str = "all"):
    """
    Get engagement funnel showing user drop-off at each stage.
    
    Returns funnel data for visualization.
    """
    try:
        funnel = advanced_analytics.generate_engagement_funnel(cohort)
        return funnel
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/time-distribution/{user_id}")
async def get_time_distribution(user_id: str, period_days: int = 7):
    """
    Get time-of-day usage patterns.
    
    Returns hourly x daily heatmap data.
    """
    try:
        distribution = advanced_analytics.generate_time_distribution(user_id, period_days)
        return distribution
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/comparative/{user_id}")
async def get_comparative_analytics(user_id: str, comparison_group: str = "class"):
    """
    Compare user performance against peers.
    
    Returns percentile rankings and comparative metrics.
    """
    try:
        comparison = advanced_analytics.generate_comparative_analytics(user_id, comparison_group)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictive/{user_id}")
async def get_predictive_insights(user_id: str):
    """
    Get AI-powered predictive insights.
    
    Returns predictions, risk factors, and opportunities.
    """
    try:
        insights = advanced_analytics.generate_predictive_insights(user_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
