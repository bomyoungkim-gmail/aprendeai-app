from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class KeyConcept(BaseModel):
    term: str
    definition: str
    related_concepts: List[str] = []

class ContentPedagogicalData(BaseModel):
    """
    Schema representing the pedagogical enrichment data for a content.
    This includes summaries, key concepts, and generated quiz questions.
    """
    content_id: str
    summary: str
    key_concepts: List[KeyConcept]
    generated_questions: List[Dict[str, Any]] = []
    blooms_taxonomy_level: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InteractionContext(BaseModel):
    user_id: str
    content_id: str
    interaction_type: str  # 'question', 'highlight', 'note', 'chat'
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class EducatorResponse(BaseModel):
    response_type: str # 'text', 'quiz_suggestion', 'confirmation'
    content: str
    payload: Optional[Dict[str, Any]] = None
