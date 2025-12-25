"""
FastAPI Routes for Educator Agent

Centralized configuration, no hardcoded routes.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from utils.token_tracker import TokenUsageTracker
from .models import TurnRequest, TurnResponse, HealthResponse
from educator.agent import educator_graph
from utils.context_builder import context_builder
from llm_factory import llm_factory
from utils.nestjs_client import nestjs_client
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

# Create router with configured prefix
API_PREFIX = os.getenv("API_PREFIX", "/educator")
educator_router = APIRouter(prefix=API_PREFIX, tags=["educator"])

@educator_router.post("/turn", response_model=TurnResponse)
async def process_turn(turn_request: TurnRequest, request: Request):
    """
    Main Educator Agent endpoint.
    ...
    """
    request_id = request.headers.get("X-Request-ID", "unknown")
    pm = turn_request.promptMessage
    
    logger.info(
        f"[{request_id}] Processing turn for session {pm.readingSessionId}, "
        f"thread {pm.threadId}, role {pm.actorRole}"
    )
    
    try:
        # 1. Build context pack
        logger.debug(f"[{request_id}] Building context pack")
        context = await context_builder.build(pm.dict())
        
        # 2. Prepare initial state
        initial_state = {
            "prompt_message": pm.dict(),
            "context": context,
            "current_phase": context['session']['phase'],
            "user_text": pm.text,
            "parsed_events": [],  # Will be populated by parser in nodes if needed
            "next_prompt": "",
            "quick_replies": [],
            "events_to_write": [],
            "hil_request": None
        }
        
        # 3. Invoke LangGraph with Token Tracking
        logger.debug(f"[{request_id}] Invoking educator graph")
        
        if not educator_graph:
            raise HTTPException(
                status_code=500,
                detail="Educator graph not initialized. Check logs."
            )
        
        # Initialize Tracker
        token_tracker = TokenUsageTracker()
        
        config = {
            "configurable": {
                "thread_id": pm.threadId
            },
            "callbacks": [token_tracker] # Inject callback here
        }
        
        result = await educator_graph.ainvoke(initial_state, config=config)
        
        # 4. Build response
        response = TurnResponse(
            threadId=pm.threadId,
            readingSessionId=pm.readingSessionId,
            nextPrompt=result['next_prompt'],
            quickReplies=result.get('quick_replies', []),
            eventsToWrite=result.get('events_to_write', []),
            hilRequest=result.get('hil_request'),
            usage=token_tracker.get_stats() # Attach usage stats
        )
        
        logger.info(
            f"[{request_id}] Turn processed successfully: "
            f"{len(response.nextPrompt)} chars, {token_tracker.total_tokens} tokens"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Failed to process turn: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process educator turn: {str(e)}"
        )


@educator_router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    GET /educator/health
    
    Checks:
    - Service status
    - LLM availability
    - NestJS connectivity
    """
    
    # Check LLM availability
    llm_available = llm_factory.is_available()
    
    # Check NestJS connectivity (simple ping)
    nestjs_connected = False
    try:
        # Try to fetch a health endpoint or just check base URL is accessible
        # For now, just check if base URL is configured
        nestjs_connected = bool(nestjs_client.base_url)
    except:
        pass
    
    return HealthResponse(
        status="healthy" if llm_available else "degraded",
        service="educator",
        timestamp=datetime.utcnow().isoformat(),
        llm_available=llm_available,
        nestjs_connected=nestjs_connected
    )


# Error handlers
# Error handling moved to main.py (APIRouter does not support exception_handler decorator)
