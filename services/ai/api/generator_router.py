from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from content_generator.lesson_generator import lesson_generator

router = APIRouter(prefix="/generate", tags=["content-generation"])

class LessonRequest(BaseModel):
    topic: str
    grade_level: str = "8_EF"
    language: str = "pt-BR"
    lesson_duration: int = 45
    learning_objectives: Optional[List[str]] = None

class UnitPlanRequest(BaseModel):
    unit_title: str
    topics: List[str]
    grade_level: str = "8_EF"
    total_weeks: int = 4

class CurriculumRequest(BaseModel):
    curriculum_text: str
    grade_level: str

@router.post("/lesson")
async def generate_lesson(req: LessonRequest):
    """
    Generate a complete lesson plan from a topic.
    
    Returns structured content including:
    - Introduction,Core Content
    - Practice Exercises
    - Assessment Questions
    - Suggested Games
    """
    try:
        lesson = await lesson_generator.generate_lesson(
            topic=req.topic,
            grade_level=req.grade_level,
            language=req.language,
            lesson_duration=req.lesson_duration,
            learning_objectives=req.learning_objectives
        )
        return lesson
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unit-plan")
async def generate_unit_plan(req: UnitPlanRequest):
    """
    Generate a multi-week unit plan with progressive topics.
    
    Returns weekly breakdown with activities and assessments.
    """
    try:
        unit_plan = await lesson_generator.generate_unit_plan(
            unit_title=req.unit_title,
            topics=req.topics,
            grade_level=req.grade_level,
            total_weeks=req.total_weeks
        )
        return unit_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/from-curriculum")
async def generate_from_curriculum(req: CurriculumRequest):
    """
    Extract lessons from curriculum standards document.
    
    Returns list of lesson outlines aligned with standards.
    """
    try:
        lessons = await lesson_generator.generate_from_curriculum(
            curriculum_text=req.curriculum_text,
            grade_level=req.grade_level
        )
        return {"lessons": lessons, "count": len(lessons)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
