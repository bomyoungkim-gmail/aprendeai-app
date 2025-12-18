from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# LangChain Imports
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser

load_dotenv()

app = FastAPI(title="AprendeAI NLP Service")

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

