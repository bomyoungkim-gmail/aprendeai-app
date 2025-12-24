from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from tutor.study_buddy import study_buddy

router = APIRouter(prefix="/tutor", tags=["ai-tutor"])

class ChatRequest(BaseModel):
    user_id: str
    message: str
    student_context: Optional[Dict[str, Any]] = None
    reset_history: bool = False

class PracticeRequest(BaseModel):
    user_id: str
    topic: str
    difficulty: int = 3

@router.post("/chat")
async def chat_with_tutor(req: ChatRequest):
    """
    Chat with AI study buddy.
    
    The tutor maintains conversation history and provides personalized assistance.
    Uses Socratic method to guide learning rather than giving direct answers.
    
    Student context can include:
    - grade_level: "8_EF", etc
    - strengths: ["science", "history"]
    - struggles: ["mathematics"]
    """
    try:
        response = await study_buddy.chat(
            user_id=req.user_id,
            message=req.message,
            student_context=req.student_context,
            reset_history=req.reset_history
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice")
async def generate_practice(req: PracticeRequest):
    """
    Generate practice problems for a topic.
    
    Returns 3 problems with hints and solutions.
    """
    try:
        problems = await study_buddy.suggest_practice(
            user_id=req.user_id,
            topic=req.topic,
            difficulty=req.difficulty
        )
        return problems
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{user_id}")
async def get_conversation_summary(user_id: str):
    """
    Get summary of student's tutor interactions.
    """
    try:
        summary = study_buddy.get_conversation_summary(user_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{user_id}")
async def clear_conversation(user_id: str):
    """
    Clear conversation history (start fresh).
    """
    try:
        study_buddy.clear_history(user_id)
        return {"success": True, "message": "Histórico limpo com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
