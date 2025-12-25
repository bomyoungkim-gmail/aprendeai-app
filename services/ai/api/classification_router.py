from fastapi import APIRouter
from pydantic import BaseModel
import os

router = APIRouter(prefix="/classify-content", tags=["classification"])

class ContentInput(BaseModel):
    title: str
    description: str | None = None
    body: str | None = None

@router.post("")
async def classify_content(content: ContentInput):
    # In a real implementation, this would call OpenAI/Anthropic/Gemini
    # For now we simulate a smart classification based on keywords
    
    text = (content.title + " " + (content.description or "")).lower()
    
    age_min = 6
    age_max = 10
    complexity = "BEGINNER"
    
    if "quantum" in text or "physics" in text or "advanced" in text:
        age_min = 14
        age_max = 18
        complexity = "ADVANCED"
    elif "history" in text or "geography" in text:
        age_min = 10
        age_max = 14
        complexity = "INTERMEDIATE"
        
    return {
        "ageMin": age_min,
        "ageMax": age_max,
        "complexity": complexity,
        "topics": ["science", "education"],
        "confidence": 0.85
    }
