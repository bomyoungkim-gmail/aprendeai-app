
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

# Route Configuration (Local to this router)
ROUTE_PREFIX = "/pedagogical"  # Note: /api is added in main.py
ENRICH_ENDPOINT = "/enrich"

router = APIRouter(prefix=ROUTE_PREFIX, tags=["pedagogical"])
logger = logging.getLogger(__name__)

class EnrichmentRequest(BaseModel):
    text: str
    contentId: Optional[str] = None
    level: Optional[str] = "5_EF"

class EnrichmentResponse(BaseModel):
    vocabularyTriage: Dict[str, Any]
    socraticQuestions: List[Dict[str, Any]]
    quizQuestions: List[Dict[str, Any]]
    gameConfigs: Dict[str, Any]
    processingVersion: str = "v1.0"

@router.post(ENRICH_ENDPOINT, response_model=EnrichmentResponse)
async def generate_enrichment(req: EnrichmentRequest):
    logger.info(f"Generating pedagogical enrichment for content {req.contentId}")
    
    # TODO: Implement LangChain Logic here.
    # For Sprint 1 Foundation, returning structured mock data to validate pipeline.
    
    mock_vocab = {
        "words": [
            {"word": "Exemplo", "definition": "Mock definition", "example": "Mock example"}
        ]
    }
    
    mock_questions = [
        {"sectionId": "intro", "questions": [{"question": "What is X?", "type": "OPEN"}]}
    ]
    
    mock_quiz = [
        {"sectionId": "intro", "questions": [{"question": "Is X Y?", "options": ["Yes", "No"], "correct": 0}]}
    ]
    
    mock_games = {
        "taboo": [{"target": "Word", "forbidden": ["A", "B"]}],
        "bossFight": {"vocab": ["Word"], "hp": 100}
    }

    return EnrichmentResponse(
        vocabularyTriage=mock_vocab,
        socraticQuestions=mock_questions,
        quizQuestions=mock_quiz,
        gameConfigs=mock_games
    )
