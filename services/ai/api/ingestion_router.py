from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from ingestion.processor import content_processor

router = APIRouter(prefix="/ingest", tags=["content-ingestion"])

class YouTubeIngestRequest(BaseModel):
    youtube_url: str
    user_id: Optional[str] = None

@router.post("/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    user_id: Optional[str] = None
):
    """
    Process uploaded PDF and generate educational content.
    
    Returns structured content ready for game generation.
    """
    try:
        # Read file bytes
        pdf_bytes = await file.read()
        
        # Process
        result = await content_processor.process_pdf(pdf_bytes, file.filename)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Processing failed"))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/youtube")
async def ingest_youtube(req: YouTubeIngestRequest):
    """
    Process YouTube video transcript and generate educational content.
    
    Returns structured content ready for game generation.
    """
    try:
        result = await content_processor.process_youtube(req.youtube_url)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Processing failed"))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/text")
async def ingest_raw_text(content: str, title: Optional[str] = "User Content"):
    """
    Process raw text input and generate educational content.
    
    Useful for copy-paste content.
    """
    try:
        from ingestion.processor import ContentProcessor
        processor = ContentProcessor()
        
        # Reuse the educational content generator
        processed = await processor._generate_educational_content(content, title)
        
        return {
            "success": True,
            "source_type": "text",
            "source_name": title,
            "processed_content": processed
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
