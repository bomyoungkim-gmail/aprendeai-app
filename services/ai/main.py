"""
AprendeAI Educator Service - Main Application

Refactored for Phase 2:
- Centralized configuration
- Proper middleware (CORS, logging, error handling)
- No hardcoded routes
- Environment-based settings
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from middleware.hmac_auth import HMACAuthMiddleware
from api import (
    games_router, 
    analytics_router,
    generator_router,
    grading_router,
    recommendation_router,
    classification_router
)
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
import time
from dotenv import load_dotenv

# Load environment variables
# Trigger Reload
load_dotenv()

# Phase 0: Setup correlation-aware logging
from utils.correlation import setup_logging
logger = setup_logging()
logger.setLevel(logging.INFO if os.getenv("ENV") == "production" else logging.DEBUG)
logger = logging.getLogger(__name__)


# ============================================
# Centralized Configuration
# ============================================

class Settings:
    """Application settings from environment"""
    
    # Service
    SERVICE_NAME: str = os.getenv("SERVICE_NAME", "AprendeAI Educator Service")
    VERSION: str = os.getenv("VERSION", "2.0.0")
    ENV: str = os.getenv("ENV", "development")
    PORT: int = int(os.getenv("PORT", "8001"))
    
    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:3001"
    ).split(",")
    
    # Phase 0: Security - HMAC Authentication
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "")
    
    @classmethod
    def validate(cls):
        """Validate critical settings"""
        if not cls.AI_SERVICE_SECRET or len(cls.AI_SERVICE_SECRET) < 32:
            raise ValueError(
                "AI_SERVICE_SECRET must be set and at least 32 characters. "
                "Generate with: openssl rand -hex 32"
            )
    
    # Security
    ALLOWED_HOSTS: list = os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1"
    ).split(",") if os.getenv("ENV") == "production" else ["*"]
    
    # External Services
    NESTJS_API_URL: str = os.getenv("NESTJS_API_URL", "http://localhost:4000")
    
    # LLM
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Feature Flags
    ENABLE_LEGACY_ENDPOINTS: bool = os.getenv("ENABLE_LEGACY_ENDPOINTS", "false").lower() == "true"


settings = Settings()

# Validate settings on startup (Phase 0: Security)
settings.validate()


# ============================================
# Lifespan Events
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"NestJS API: {settings.NESTJS_API_URL}")
    logger.info(f"OpenAI configured: {bool(settings.OPENAI_API_KEY)}")
    logger.info(f"HMAC Auth: ENABLED (Phase 0)")
    
    # Verify critical dependencies
    if not settings.OPENAI_API_KEY:
        logger.warning("⚠️  OPENAI_API_KEY not set - LLM features will fail")
    
    # Phase 1: Setup Redis semantic cache for optimized LLM calls
    try:
        from cache_config import setup_semantic_cache
        cache_enabled = setup_semantic_cache()
        logger.info(f"✅ Semantic cache: {'ENABLED' if cache_enabled else 'DISABLED'}")
    except Exception as e:
        logger.warning(f"⚠️  Semantic cache setup failed: {e}. Continuing without cache.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down gracefully")


# ============================================
# Create Application
# ============================================

app = FastAPI(
    title=settings.SERVICE_NAME,
    description="LangGraph-based Educator Agent for reading sessions",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENV != "production" else None,  # Disable docs in prod
    redoc_url="/redoc" if settings.ENV != "production" else None,
)


# ============================================
# Middleware
# ============================================

# Phase 0: HMAC Authentication Middleware (FIRST - before CORS)
app.add_middleware(
    HMACAuthMiddleware,
    secret=settings.AI_SERVICE_SECRET
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Trusted Host Middleware (production only)
if settings.ENV == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )




# ============================================
# Request Logging Middleware (removed due to syntax error)
# ============================================


# ============================================
# Centralized Configuration
# ============================================

class Settings:
    """Application settings from environment"""
    
    # Service
    SERVICE_NAME: str = os.getenv("SERVICE_NAME", "AprendeAI Educator Service")
    VERSION: str = os.getenv("VERSION", "2.0.0")
    ENV: str = os.getenv("ENV", "development")
    PORT: int = int(os.getenv("PORT", "8001"))
    
    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:3001"
    ).split(",")
    
    # Phase 0: Security - HMAC Authentication
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "")
    
    @classmethod
    def validate(cls):
        """Validate critical settings"""
        if not cls.AI_SERVICE_SECRET or len(cls.AI_SERVICE_SECRET) < 32:
            raise ValueError(
                "AI_SERVICE_SECRET must be set and at least 32 characters. "
                "Generate with: openssl rand -hex 32"
            )
    
    # Security
    ALLOWED_HOSTS: list = os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1"
    ).split(",") if os.getenv("ENV") == "production" else ["*"]
    
    # External Services
    NESTJS_API_URL: str = os.getenv("NESTJS_API_URL", "http://localhost:4000")
    
    # LLM
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Feature Flags
    ENABLE_LEGACY_ENDPOINTS: bool = os.getenv("ENABLE_LEGACY_ENDPOINTS", "false").lower() == "true"


settings = Settings()


# ============================================
# Lifespan Events
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"NestJS API: {settings.NESTJS_API_URL}")
    logger.info(f"OpenAI configured: {bool(settings.OPENAI_API_KEY)}")
    
    # Verify critical dependencies
    if not settings.OPENAI_API_KEY:
        logger.warning("⚠️  OPENAI_API_KEY not set - LLM features will fail")
    
    yield
    
    # Shutdown
    logger.info("Shutting down gracefully")


# ============================================
# Create Application
# ============================================

app = FastAPI(
    title=settings.SERVICE_NAME,
    description="LangGraph-based Educator Agent for reading sessions",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENV != "production" else None,  # Disable docs in prod
    redoc_url="/redoc" if settings.ENV != "production" else None,
)


# ============================================
# Middleware
# ============================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Trusted Host Middleware (production only)
if settings.ENV == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )


# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    request_id = request.headers.get("X-Request-ID", "unknown")
    start_time = time.time()
    
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"completed in {duration:.3f}s with status {response.status_code}"
    )
    
    # Add custom headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration:.3f}s"
    
    return response


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__,
            "path": request.url.path
        }
    )


# ============================================
# Routes
# ============================================

# Main health check (root)
@app.get("/health")
async def root_health():
    """Root health check"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "env": settings.ENV
    }


@app.get("/metrics")
async def get_ai_metrics():
    """
    Get AI optimization metrics for monitoring dashboard
    
    Returns:
        - cache: Cache hit rate and stats
        - tokens: Token reduction metrics
        - memory_jobs: Memory compaction job stats
        - performance: Response time metrics
    """
    from metrics import get_metrics, get_metrics_from_redis
    
    # Get in-memory metrics (current session)
    current_metrics = get_metrics()
    
    # Get persistent metrics from Redis (all-time)
    persistent_metrics = get_metrics_from_redis()
    
    return {
        "current_session": current_metrics,
        "all_time": persistent_metrics,
        "note": "current_session resets on service restart, all_time is Redis-persisted"
    }


# Include Educator Router
from api.routes import educator_router
app.include_router(educator_router)

# Include Games Router
from api.games_router import router as games_router
app.include_router(games_router)

# Include Experiments Router
from api.experiments_router import router as experiments_router
# Include EXPERIMENTS router - make sure to use api prefix to avoid conflicts
from api.experiments_router import router as experiments_router
app.include_router(experiments_router, prefix="/api")


# Global Exception Handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError as 400 Bad Request"""
    logger.warning(f"ValueError: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

# Include Recommender Router
from api.recommender_router import router as recommender_router
app.include_router(recommender_router, prefix="/api")

# Include Classification Router
from api.classification_router import router as classification_router
app.include_router(classification_router, prefix="/api")

# Include Gamification Router
from api.gamification_router import router as gamification_router
app.include_router(gamification_router, prefix="/api")

# Include Ingestion Router
from api.ingestion_router import router as ingestion_router
app.include_router(ingestion_router, prefix="/api")

# Include Adaptive Learning Router
from api.adaptive_router import router as adaptive_router
app.include_router(adaptive_router, prefix="/api")

# Include Social Features Router
from api.social_router import router as social_router
app.include_router(social_router, prefix="/api")

# Include Admin Dashboard Router
from api.admin_router import router as admin_router
app.include_router(admin_router, prefix="/api")

# Include WebSocket Router for Real-Time Games
from api.websocket_router import router as websocket_router
app.include_router(websocket_router)

# Include Content Generator Router
from api.generator_router import router as generator_router
app.include_router(generator_router, prefix="/api")

# Include Parent Dashboard Router
from api.parent_router import router as parent_router
app.include_router(parent_router, prefix="/api")

# Include AI Tutor Router
from api.tutor_router import router as tutor_router
app.include_router(tutor_router, prefix="/api")

# Include Automated Grading Router
from api.grading_router import router as grading_router
app.include_router(grading_router, prefix="/api")

# Include Advanced Analytics Router
from api.analytics_router import router as analytics_router
app.include_router(analytics_router, prefix="/api")

# Include Whiteboard Collaboration Routers
from api.whiteboard_router import router as whiteboard_router
from api.whiteboard_ws_router import router as whiteboard_ws_router
app.include_router(whiteboard_router, prefix="/api")
app.include_router(whiteboard_ws_router)

# Include Spaced Repetition System Router
from api.srs_router import router as srs_router
app.include_router(srs_router, prefix="/api")

# Include Pedagogical Enrichment Router (Cornell)
from api.pedagogical_router import router as pedagogical_router
app.include_router(pedagogical_router, prefix="/api")

# Include Chat Router (Educator)
from api.chat_router import router as chat_router
app.include_router(chat_router, prefix="/api")



# Legacy endpoints (optional)
if settings.ENABLE_LEGACY_ENDPOINTS:
    logger.info("✅ Legacy endpoints enabled")
    
    @app.post("/simplify")
    async def simplify_legacy():
        """Legacy simplify endpoint"""
        return JSONResponse(
            status_code=501,
            content={"detail": "Legacy endpoint - use new Educator service"}
        )
    
    @app.post("/translate")
    async def translate_legacy():
        """Legacy translate endpoint"""
        return JSONResponse(
            status_code=501,
            content={"detail": "Legacy endpoint - use new Educator service"}
        )


# ============================================
# Entry Point
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.PORT,
        log_level="info" if settings.ENV == "production" else "debug",
        access_log=True
    )


# -- Models --

class SimplifyRequest(BaseModel):
    text: str
    source_lang: str = "PT_BR"
    target_lang: str = "PT_BR"
    schooling_level: str = "5_EF" # 5º Year Elementary

class TranslateRequest(BaseModel):
    text: str
    from_lang: str
    to_lang: str
    schooling_level: str = "ADULT"

class AssessmentRequest(BaseModel):
    text: str
    schooling_level: str = "1_EM" # 1st Year High School
    num_questions: int = 5

class AssessmentQuestion(BaseModel):
    question_text: str
    question_type: str = "MULTIPLE_CHOICE"
    options: List[str]
    correct_answer_index: int

class AssessmentOutput(BaseModel):
    questions: List[AssessmentQuestion]

# -- LLM Setup --

# Default to gpt-3.5-turbo for cost/speed, can be env var
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# If no key is present, we might want to fail or mock. 
# For this skeleton, we will check at runtime.

def get_llm():
    if not OPENAI_API_KEY:
        # Fallback for testing without keys: return a Mock or error
        # For now, let's raise HTTP exception if called
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")
    return ChatOpenAI(model=LLM_MODEL, temperature=0)

# -- Routes --

@app.get("/health")
def health_check():
    return {"status": "ok", "llm_available": bool(OPENAI_API_KEY)}

@app.post("/simplify")
async def simplify_text(req: SimplifyRequest):
    llm = get_llm()
    
    # Prompt
    system_template = """You are an expert teacher adapting texts for students.
    Task: Simplify the following text for a student at level: {schooling_level}.
    Original Language: {source_lang}. Target Language: {target_lang}.
    
    Output Format (JSON):
    {{
        "simplified_text": "The adapted text...",
        "summary": "A brief summary...",
        "glossary": {{ "difficult_term": "definition" }}
    }}
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("user", "{text}")
    ])
    
    chain = prompt | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({
            "schooling_level": req.schooling_level,
            "source_lang": req.source_lang,
            "target_lang": req.target_lang,
            "text": req.text
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate_text(req: TranslateRequest):
    llm = get_llm()
    
    system_template = """You are a professional translator and teacher.
    Task: Translate the text from {from_lang} to {to_lang}, adapting it for a student at level {schooling_level}.
    Target the translation to be educational and clear.
    
    Output Format (JSON):
    {{
        "translated_text": "...",
        "glossary": {{ "original_term": "translated_term" }}
    }}
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("user", "{text}")
    ])
    
    chain = prompt | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({
            "from_lang": req.from_lang,
            "to_lang": req.to_lang,
            "schooling_level": req.schooling_level,
            "text": req.text
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-assessment")
async def generate_assessment(req: AssessmentRequest):
    llm = get_llm()
    
    model = AssessmentOutput # Pydantic model for parser
    parser = JsonOutputParser(pydantic_object=model)
    
    system_template = """You are an exam creator.
    Task: Create {num_questions} multiple choice questions based on the provided text.
    Target Audience Level: {schooling_level}.
    
    Format instructions:
    {format_instructions}
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("user", "{text}")
    ])
    
    chain = prompt | llm | parser
    
    try:
        result = chain.invoke({
            "num_questions": req.num_questions,
            "schooling_level": req.schooling_level,
            "format_instructions": parser.get_format_instructions(),
            "text": req.text
        })
        # result is already a dict matching AssessmentOutput
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Academic Papers Endpoints (OpenAlex + KCI) --

@app.get("/api/papers/search")
async def search_papers(
    q: str, 
    page: int = 1, 
    per_page: int = 25,
    filter: Optional[str] = None
):
    """
    Search academic papers via OpenAlex API.
    
    Args:
        q: Search query
        page: Page number (1-indexed)
        per_page: Results per page (max 200)
        filter: Optional filter (e.g., "publication_year:2024")
    """
    from clients.openalex_client import search_works
    from schemas.papers import PaperSearchResponse, PaperResult
    
    try:
        data = await search_works(q, page, per_page, filter)
        
        # Convert to response model
        results = [PaperResult(**paper) for paper in data["results"]]
        
        response = PaperSearchResponse(
            source="openalex",
            page=page,
            per_page=per_page,
            total_results=data["meta"].get("count"),
            results=results
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/papers/{arti_id}/references")
async def get_paper_references(
    arti_id: str,
    page: int = 1,
    record_cnt: int = 50
):
    """
    Get bibliography/references for a KCI paper by ARTIID.
    
    Args:
        arti_id: KCI Article ID
        page: Page number (1-indexed)
        record_cnt: Records per page
    """
    from clients.kci_client import get_references
    from schemas.papers import KCIReferencesResponse, KCIReference
    
    try:
        data = await get_references(arti_id, page, record_cnt)
        
        # Convert to response model
        references = [KCIReference(**ref) for ref in data["references"]]
        
        response = KCIReferencesResponse(
            arti_id=arti_id,
            page=page,
            per_page=record_cnt,
            total_count=data["total_count"],
            references=references
        )
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/papers/{arti_id}/metadata")
async def get_paper_metadata(arti_id: str):
    """
    Get detailed metadata for a KCI paper by ARTIID.
    
    Args:
        arti_id: KCI Article ID
    """
    from clients.kci_client import get_thesis_info
    from schemas.papers import KCIThesisInfo
    
    try:
        data = await get_thesis_info(arti_id)
        
        if not data:
            raise HTTPException(status_code=404, detail=f"Paper not found: {arti_id}")
        
        return KCIThesisInfo(**data)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Script 5/5: Asset generation worker
if __name__ == "__main__":
    import threading
    import sys
    
    # Check if consumer should run
    run_consumer = '--consumer' in sys.argv or os.getenv('RUN_CONSUMER', 'false').lower() == 'true'
    
    if run_consumer:
        from consumers.rabbitmq import start_consumer
        
        # Start RabbitMQ consumer in background thread
        consumer_thread = threading.Thread(target=start_consumer, daemon=True)
        consumer_thread.start()
        print("[MAIN] RabbitMQ consumer started in background")
    
    # Start FastAPI
    import uvicorn
    port = int(os.getenv('PORT', '8001'))
    uvicorn.run(app, host="0.0.0.0", port=port)

