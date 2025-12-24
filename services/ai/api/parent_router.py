from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from admin.service import admin_service

router = APIRouter(prefix="/parent", tags=["parent-dashboard"])

# NOTE: In production, add parent-child relationship verification middleware

@router.get("/children/{parent_id}")
async def get_parent_children(parent_id: str):
    """
    Get list of children associated with parent account.
    
    NOTE: Mock implementation - would query family relationships from DB.
    """
    # Mock children data
    return {
        "parent_id": parent_id,
        "children": [
            {
                "user_id": "child_1",
                "name": "Ana Silva",
                "age": 13,
                "grade": "8º Ano",
                "profile_picture": None
            },
            {
                "user_id": "child_2",
                "name": "Pedro Silva",
                "age": 10,
                "grade": "5º Ano",
                "profile_picture": None
            }
        ]
    }

@router.get("/child/{child_id}/progress")
async def get_child_progress(child_id: str, parent_id: Optional[str] = None):
    """
    Get comprehensive progress report for a child.
    
    Parent-friendly format with:
    - Overall engagement metrics
    - Learning achievements
    - Areas of strength and improvement
    - Recent activity timeline
    """
    try:
        # Reuse admin service but format for parents
        detail = admin_service.get_student_detail(child_id)
        
        # Transform to parent-friendly format
        return {
            "child": {
                "user_id": detail["user_id"],
                "name": detail["name"],
                "grade": detail["schooling_level"]
            },
            "summary": {
                "engagement_level": "Alto" if detail["stats"]["time_spent_total_minutes"] > 300 else "Médio",
                "current_streak": detail["stats"]["current_streak"],
                "level": detail["stats"]["level"],
                "total_games": detail["stats"]["games_played"]
            },
            "achievements": {
                "badges": detail["stats"]["badges_earned"],
                "best_streak": detail["stats"]["best_streak"],
                "avg_score": detail["stats"]["avg_score"]
            },
            "learning_insights": {
                "strengths": ["Ciências (88% média)", "História (80% média)"],
                "needs_practice": ["Matemática (75% média)"],
                "recommendations": detail.get("recommendations", [])
            },
            "recent_activity": detail.get("recent_activity", []),
            "time_analytics": {
                "total_minutes": detail["stats"]["time_spent_total_minutes"],
                "avg_per_day": round(detail["stats"]["time_spent_total_minutes"] / 30, 1),
                "trend": "crescente"  # Mock
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/child/{child_id}/weekly-report")
async def get_weekly_report(child_id: str):
    """
    Get weekly summary for parent email/notification.
    
    Concise report highlighting:
    - Total time this week
    - Games completed
    - New badges earned
    - Streak status
    """
    # Mock data
    return {
        "child_id": child_id,
        "week_start": "2024-01-15",
        "week_end": "2024-01-21",
        "highlights": {
            "total_minutes": 120,
            "games_completed": 8,
            "new_badges": 2,
            "maintained_streak": True,
            "current_streak_days": 12
        },
        "top_achievement": "Completou desafio de Roleplay com 95% de acerto!",
        "encouragement": "Ana está no caminho certo! Continue incentivando a prática diária.",
        "parent_tips": [
            "Estabeleça um horário fixo para estudo",
            "Celebre as conquistas de badges juntos"
        ]
    }

@router.get("/child/{child_id}/safety-report")
async def get_safety_report(child_id: str):
    """
    Safety and screen time report for parents.
    
    Includes:
    - Screen time limits compliance
    - Content safety flags (if any)
    - Social interactions overview
    """
    return {
        "child_id": child_id,
        "screen_time": {
            "daily_limit_minutes": 60,
            "avg_daily_usage": 18,
            "within_limit": True
        },
        "content_safety": {
            "all_content_age_appropriate": True,
            "flagged_interactions": 0
        },
        "social_summary": {
            "friends_count": 5,
            "recent_challenges": 3,
            "all_friends_verified": True  # School-only friendships
        },
        "recommendations": [
            "Limite diário sendo respeitado - excelente!",
            "Todas as interações sociais estão seguras."
        ]
    }

@router.post("/child/{child_id}/set-goals")
async def set_learning_goals(child_id: str, daily_minutes: int = 30):
    """
    Set daily learning goals for child (parent action).
    
    Returns confirmation and expected outcomes.
    """
    # Mock implementation
    return {
        "success": True,
        "child_id": child_id,
        "new_goals": {
            "daily_minutes": daily_minutes,
            "weekly_games": daily_minutes // 5  # ~5min per game
        },
        "message": f"Meta de {daily_minutes} minutos/dia definida com sucesso!",
        "expected_outcome": "Com essa meta, seu filho completará aproximadamente 6 jogos por semana."
    }
