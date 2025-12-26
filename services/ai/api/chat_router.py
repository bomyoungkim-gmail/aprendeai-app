from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional

from educator.service import EducatorService
from educator.schemas import InteractionContext, EducatorResponse

router = APIRouter(prefix="/chat", tags=["chat"])

# Request Model for the endpoint
class ChatRequest(BaseModel):
    user_id: str
    content_id: str
    message: str
    context: Optional[Dict[str, Any]] = {} 

@router.post("/", response_model=EducatorResponse)
async def chat_interaction(request: ChatRequest):
    """
    Process a chat message via the Educator Service.
    """
    service = EducatorService()
    
    # Construct interaction context
    context = InteractionContext(
        user_id=request.user_id,
        content_id=request.content_id,
        interaction_type="chat",
        data={
            "message": request.message,
            **request.context
        }
    )
    
    try:
        response = await service.process_interaction(context)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
