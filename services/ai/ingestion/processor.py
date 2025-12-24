"""
Content Ingestion Pipeline

Processes uploaded PDFs and YouTube URLs to extract educational content.
Generates summaries, glossaries, and other learning materials automatically.
"""
import logging
import re
from typing import Dict, Any, Optional
from io import BytesIO

logger = logging.getLogger(__name__)

class ContentProcessor:
    """
    Process various content sources into structured educational material.
    """
    
    def __init__(self, llm_factory=None):
        from llm_factory import LLMFactory
        self.llm_factory = llm_factory or LLMFactory()
        self.llm = self.llm_factory.get_smart_llm()
    
    async def process_pdf(self, pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Extract and process PDF content.
        
        Args:
            pdf_bytes: PDF file bytes
            filename: Original filename
            
        Returns:
            Processed content dict
        """
        try:
            # Import here to avoid dependency issues if not installed
            from pypdf import PdfReader
            
            pdf_file = BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)
            
            # Extract text from all pages
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
            
            # Clean text
            text_content = self._clean_text(text_content)
            
            # Generate educational content
            processed = await self._generate_educational_content(text_content, filename)
            
            return {
                "success": True,
                "source_type": "pdf",
                "source_name": filename,
                "raw_text": text_content[:5000],  # First 5000 chars
                "processed_content": processed
            }
            
        except ImportError:
            logger.error("pypdf not installed. Install with: pip install pypdf")
            return {
                "success": False,
                "error": "PDF processing library not available"
            }
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def process_youtube(self, youtube_url: str) -> Dict[str, Any]:
        """
        Extract and process YouTube video transcript.
        
        Args:
            youtube_url: YouTube video URL
            
        Returns:
            Processed content dict
        """
        try:
            # Import here to avoid dependency issues
            from youtube_transcript_api import YouTubeTranscriptApi
            
            # Extract video ID from URL
            video_id = self._extract_youtube_id(youtube_url)
            if not video_id:
                return {
                    "success": False,
                    "error": "Invalid YouTube URL"
                }
            
            # Get transcript
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            
            # Combine transcript segments
            text_content = " ".join([seg['text'] for seg in transcript])
            text_content = self._clean_text(text_content)
            
            # Generate educational content
            processed = await self._generate_educational_content(text_content, f"YouTube: {video_id}")
            
            return {
                "success": True,
                "source_type": "youtube",
                "source_name": youtube_url,
                "video_id": video_id,
                "raw_text": text_content[:5000],
                "processed_content": processed
            }
            
        except ImportError:
            logger.error("youtube-transcript-api not installed. Install with: pip install youtube-transcript-api")
            return {
                "success": False,
                "error": "YouTube transcript library not available"
            }
        except Exception as e:
            logger.error(f"Error processing YouTube: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_youtube_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL."""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
            r'youtube\.com\/embed\/([^&\n?#]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters that might confuse LLM
        text = text.strip()
        return text
    
    async def _generate_educational_content(self, text: str, source_name: str) -> Dict[str, Any]:
        """
        Generate educational materials from raw text using LLM.
        Reuses existing chains logic.
        """
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import JsonOutputParser
        
        # Limit text length for LLM processing
        text_sample = text[:8000]  # ~2000 tokens
        
        prompt = ChatPromptTemplate.from_template(
            """
            Analyze the following educational content and generate structured learning materials.
            
            Content: {content}
            
            Generate:
            1. Title: A clear title for this content
            2. Summary: 2-3 paragraph summary
            3. Key Concepts: List of main ideas/topics
            4. Glossary: Important terms and definitions
            5. Suggested Games: Which game modes would work well (TOOL_WORD_HUNT, ROLEPLAY_DISCOVERY, etc.)
            
            Output strictly in JSON:
            {{
                "title": "...",
                "summary": "...",
                "key_concepts": ["...", "..."],
                "glossary": {{"term": "definition"}},
                "suggested_games": ["GAME_ID1", "GAME_ID2"],
                "difficulty_level": "1-5"
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({"content": text_sample})
            return result
        except Exception as e:
            logger.error(f"Error generating educational content: {e}")
            return {
                "title": source_name,
                "summary": "Error processing content",
                "key_concepts": [],
                "glossary": {},
                "suggested_games": [],
                "difficulty_level": "3"
            }

# Singleton
content_processor = ContentProcessor()
