"""
Admin Service for School Management

Provides analytics and management tools for teachers and administrators.

NOTE: This service provides mock data. In production, integrate with actual
database queries using Prisma client to access:
- Institution model
- Class model  
- ClassStudent model
- User model with student data
- DailyActivity, Streak, AssessmentAttempt for progress tracking
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AdminService:
    """
    Service for admin/teacher dashboard functionality.
    """
    
    def __init__(self, db_client=None):
        """
        Initialize with optional database client.
        For now uses mock data - replace with actual DB queries.
        """
        self.db = db_client
    
    def get_class_overview(self, class_id: str) -> Dict[str, Any]:
        """
        Get overview of a class including student list and aggregate stats.
        
        Returns:
            Class info with student roster and performance metrics
        """
        # Mock data - would query Class and ClassStudent models
        return {
            "class_id": class_id,
            "class_name": "Turma 8º A - Ciências",
            "grade_level": "8_EF",
            "institution_id": "inst_123",
            "student_count": 25,
            "active_students": 22,
            "avg_daily_minutes": 18,
            "avg_streak": 4.2,
            "top_performers": [
                {"user_id": "student_1", "name": "Ana Silva", "xp": 15000},
                {"user_id": "student_2", "name": "Bruno Costa", "xp": 12500},
            ],
            "struggling_students": [
                {"user_id": "student_24", "name": "Carlos Dias", "avg_score": 45}
            ]
        }
    
    def get_student_detail(self, user_id: str) -> Dict[str, Any]:
        """
        Get detailed progress report for a student.
        
        Returns:
            Comprehensive student analytics
        """
        # Mock data - would aggregate from multiple tables
        return {
            "user_id": user_id,
            "name": "Ana Silva",
            "email": "ana.silva@escola.com",
            "schooling_level": "8_EF",
            "enrollment_date": "2024-01-15",
            "stats": {
                "total_xp": 15000,
                "level": 7,
                "current_streak": 8,
                "best_streak": 15,
                "games_played": 45,
                "avg_score": 82,
                "time_spent_total_minutes": 540,
                "badges_earned": 8
            },
            "recent_activity": [
                {
                    "date": "2024-01-20",
                    "game_mode": "TOOL_WORD_HUNT",
                    "score": 85,
                    "topic": "Fotossíntese"
                },
                {
                    "date": "2024-01-19",
                    "game_mode": "ROLEPLAY_DISCOVERY",
                    "score": 90,
                    "topic": "Revolução Francesa"
                }
            ],
            "topic_breakdown": {
                "mathematics": {"games": 10, "avg_score": 75},
                "science": {"games": 15, "avg_score": 88},
                "history": {"games": 12, "avg_score": 80}
            },
            "recommendations": [
                "Practice more on mathematics (current avg: 75%)",
                "Excellent progress in science - consider advanced content"
            ]
        }
    
    def get_institution_dashboard(self, institution_id: str) -> Dict[str, Any]:
        """
        Get institution-wide analytics.
        
        Returns:
            School-level metrics
        """
        return {
            "institution_id": institution_id,
            "institution_name": "Colégio Exemplo",
            "total_classes": 12,
            "total_students": 320,
            "total_teachers": 18,
            "engagement_metrics": {
                "daily_active_users": 245,
                "avg_session_minutes": 22,
                "completion_rate": 0.78
            },
            "top_classes": [
                {"class_id": "class_1", "name": "8º A", "avg_xp": 12000},
                {"class_id": "class_2", "name": "9º B", "avg_xp": 11500}
            ],
            "recent_milestones": [
                {"student": "Ana Silva", "achievement": "Reached Level 10"},
                {"student": "Bruno Costa", "achievement": "30-day streak"}
            ]
        }
    
    def get_class_students(self, class_id: str) -> List[Dict[str, Any]]:
        """
        Get list of students in a class with basic stats.
        
        Returns:
            List of student summaries
        """
        # Mock data - would join ClassStudent with User and stats
        return [
            {
                "user_id": "student_1",
                "name": "Ana Silva",
                "email": "ana@escola.com",
                "xp": 15000,
                "level": 7,
                "streak": 8,
                "avg_score": 82,
                "last_active": "2024-01-20"
            },
            {
                "user_id": "student_2",
                "name": "Bruno Costa",
                "email": "bruno@escola.com",
                "xp": 12500,
                "level": 6,
                "streak": 5,
                "avg_score": 78,
                "last_active": "2024-01-19"
            },
            # ... more students
        ]
    
    def generate_class_report(
        self,
        class_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive class report for a date range.
        
        Returns:
            Detailed class analytics report
        """
        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow().isoformat()
        if not start_date:
            start = datetime.utcnow() - timedelta(days=30)
            start_date = start.isoformat()
        
        return {
            "class_id": class_id,
            "report_period": {"start": start_date, "end": end_date},
            "summary": {
                "total_sessions": 245,
                "avg_session_duration": 18,
                "completion_rate": 0.82,
                "improvement_trend": "+12%"
            },
            "student_performance": [
                {"name": "Ana Silva", "score_avg": 82, "improvement": "+8%"},
                {"name": "Bruno Costa", "score_avg": 78, "improvement": "+5%"}
            ],
            "popular_games": [
                {"mode": "TOOL_WORD_HUNT", "plays": 120},
                {"mode": "ROLEPLAY_DISCOVERY", "plays": 85}
            ],
            "recommendations": [
                "Consider assigning more DUEL_DEBATE games to increase engagement",
                "3 students need additional Math support"
            ]
        }


# Singleton
admin_service = AdminService()
