from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from grading.auto_grader import auto_grader

router = APIRouter(prefix="/grading", tags=["automated-grading"])

class GradeRequest(BaseModel):
    question: str
    student_answer: str
    expected_answer: Optional[str] = None
    rubric: Optional[Dict[str, Any]] = None
    max_score: int = 100
    grade_level: str = "8_EF"

class EssayGradeRequest(BaseModel):
    prompt: str
    essay: str
    word_count_target: Optional[int] = None
    focus_areas: Optional[List[str]] = None

class QuickCheckRequest(BaseModel):
    question: str
    answer: str
    correct_answer: str

@router.post("/grade")
async def grade_response(req: GradeRequest):
    """
    Grade an open-ended response using AI with pedagogical rubric.
    
    Returns detailed feedback including:
    - Overall score and percentage
    - Breakdown by rubric criteria
    - Strengths and areas for improvement
    - Constructive suggestions
    - Grade letter (A-F)
    
    Custom rubric format:
    {
        "criterion_name": {
            "weight": 0.0-1.0,
            "description": "what to evaluate"
        }
    }
    """
    try:
        grading = await auto_grader.grade_response(
            question=req.question,
            student_answer=req.student_answer,
            expected_answer=req.expected_answer,
            rubric=req.rubric,
            max_score=req.max_score,
            grade_level=req.grade_level
        )
        return grading
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/grade-essay")
async def grade_essay(req: EssayGradeRequest):
    """
    Grade a full essay with writing-specific rubric.
    
    Evaluates:
    - Thesis statement and argument
    - Organization and flow
    - Supporting evidence
    - Language and grammar
    - Conclusion
    """
    try:
        grading = await auto_grader.grade_essay(
            prompt=req.prompt,
            essay=req.essay,
            word_count_target=req.word_count_target,
            focus_areas=req.focus_areas
        )
        return grading
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quick-check")
async def quick_check(req: QuickCheckRequest):
    """
    Quick correctness check for short answers.
    
    Returns:
    - is_correct: boolean
    - similarity_score: 0.0-1.0
    - explanation: brief reasoning
    - student_understanding: complete|partial|incorreto
    """
    try:
        result = await auto_grader.quick_check(
            question=req.question,
            answer=req.answer,
            correct_answer=req.correct_answer
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
