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
    """
    Context for a user interaction with the Educator agent.
    
    Expected fields in 'data' dict:
    - decision_policy (dict): DecisionPolicyV1 policy object
    - message (str): User's message text
    - text (str): Alternative field for user text
    - selection (str): User-selected text from document
    - has_image (bool): Whether interaction includes an image
    - full_text (str): Full document text (if allowTextExtraction=True)
    - document_text (str): Alternative field for full text
    - annotations (list): List of MAIN_IDEA/DOUBT annotations from backend
    """
    user_id: str
    content_id: str
    interaction_type: str  # 'question', 'highlight', 'note', 'chat'
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class EducatorResponse(BaseModel):
    response_type: str # 'text', 'quiz_suggestion', 'confirmation'
    content: str
    payload: Optional[Dict[str, Any]] = None
