"""
Asset Generator - Main pipeline for AI-generated educational content
Orchestrates LangChain chains to generate complete learning assets
"""
import asyncio
import os
from typing import List, Dict, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from chains import (
    summarize_chain,
    extract_words_chain,
    glossary_chain,
    cues_chain,
    checkpoints_chain,
    quiz_chain
)
from schemas.assets import GeneratedAsset, GlossaryEntry, Cue, Checkpoint, QuizQuestion

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL) if DATABASE_URL else None
Session = sessionmaker(bind=engine) if engine else None


async def load_chunks(content_id: str, selected_highlight_ids: Optional[List[str]] = None) -> List[Dict]:
    """
    Load content chunks from database.
    
    Args:
        content_id: UUID of content
        selected_highlight_ids: Optional list of highlight IDs to filter chunks
        
    Returns:
        List of chunk dictionaries with 'text' field
    """
    if not Session:
        raise RuntimeError("Database not configured")
    
    session = Session()
    try:
        # TODO: If selected_highlight_ids provided, filter chunks by highlights
        # For now, load all chunks for the content
        query = text("""
            SELECT chunk_index, text
            FROM content_chunks
            WHERE content_id = :content_id
            ORDER BY chunk_index
            LIMIT 50
        """)
        
        result = session.execute(query, {"content_id": content_id})
        chunks = [{"chunk_index": row[0], "text": row[1]} for row in result]
        
        return chunks
    finally:
        session.close()


async def generate_asset(
    content_id: str,
    layer: str,
    education_level: str,
    modality: str,
    prompt_version: str,
    selected_highlight_ids: Optional[List[str]] = None
) -> GeneratedAsset:
    """
    Generate complete learning asset using AI pipeline.
    
    Args:
        content_id: UUID of source content
        layer: 'L1', 'L2', or 'L3'
        education_level: Target education level
        modality: 'READING', 'LISTENING', or 'WRITING'
        prompt_version: Version string (e.g., 'v1.0')
        selected_highlight_ids: Optional highlight IDs to focus on
        
    Returns:
        Validated GeneratedAsset instance
    """
    print(f"[ASSET GENERATOR] Starting generation for content {content_id}, layer {layer}")
    
    # ========================================================================
    # STEP 1: Load chunks
    # ========================================================================
    print("[1/7] Loading chunks...")
    chunks = await load_chunks(content_id, selected_highlight_ids)
    
    if not chunks:
        raise ValueError(f"No chunks found for content {content_id}")
    
    # Combine chunks into single text
    text = "\n\n".join([chunk['text'] for chunk in chunks])
    print(f"[1/7] Loaded {len(chunks)} chunks, {len(text)} characters")
    
    # ========================================================================
    # STEP 2: Summarize for layer
    # ========================================================================
    print(f"[2/7] Summarizing for layer {layer}...")
    summary = await summarize_chain.ainvoke({
        "layer": layer,
        "education_level": education_level,
        "text": text[:10000]  # Limit context to avoid token limits
    })
    print(f"[2/7] Generated summary: {len(summary)} characters")
    
    # ========================================================================
    # STEP 3: Extract target words
    # ========================================================================
    print("[3/7] Extracting target words...")
    words_result = await extract_words_chain.ainvoke({
        "education_level": education_level,
        "text": summary
    })
    target_words = words_result.get('words', [])
    print(f"[3/7] Extracted {len(target_words)} target words: {target_words}")
    
    # ========================================================================
    # STEP 4: Build glossary
    # ========================================================================
    print("[4/7] Building glossary...")
    glossary_result = await glossary_chain.ainvoke({
        "words": ", ".join(target_words),
        "text": summary,
        "education_level": education_level
    })
    glossary = [GlossaryEntry(**entry) for entry in glossary_result.get('glossary', [])]
    print(f"[4/7] Created glossary with {len(glossary)} entries")
    
    # ========================================================================
    # STEP 5: Generate cues
    # ========================================================================
    print("[5/7] Generating Cornell cues...")
    cues_result = await cues_chain.ainvoke({
        "text": summary,
        "target_words": ", ".join(target_words),
        "education_level": education_level
    })
    cues = [Cue(**cue) for cue in cues_result.get('cues', [])]
    print(f"[5/7] Generated {len(cues)} cues")
    
    # ========================================================================
    # STEP 6: Generate checkpoints
    # ========================================================================
    print("[6/7] Generating checkpoints...")
    checkpoints_result = await checkpoints_chain.ainvoke({
        "text": summary,
        "education_level": education_level
    })
    checkpoints = [Checkpoint(**cp) for cp in checkpoints_result.get('checkpoints', [])]
    print(f"[6/7] Generated {len(checkpoints)} checkpoints")
    
    # ========================================================================
    # STEP 7: Generate post quiz
    # ========================================================================
    print("[7/7] Generating post quiz...")
    quiz_result = await quiz_chain.ainvoke({
        "text": summary,
        "target_words": ", ".join(target_words),
        "education_level": education_level
    })
    quiz_post = [QuizQuestion(**q) for q in quiz_result.get('quiz_post', [])]
    print(f"[7/7] Generated {len(quiz_post)} quiz questions")
    
    # ========================================================================
    # VALIDATE & CONSTRUCT ASSET
    # ========================================================================
    print("[VALIDATION] Constructing and validating asset...")
    asset = GeneratedAsset(
        layer=layer,
        title=f"{layer} - {education_level}",
        body_markdown=summary,
        target_words=target_words,
        glossary=glossary,
        cues=cues,
        checkpoints=checkpoints,
        quiz_post=quiz_post,
        difficulty_estimate=estimate_difficulty(summary, layer),
        length_estimate=len(summary),
        prompt_version=prompt_version
    )
    
    print(f"[VALIDATION] Asset validated successfully!")
    return asset


def estimate_difficulty(text: str, layer: str) -> int:
    """
    Estimate difficulty on 1-10 scale.
    
    Args:
        text: The summarized text
        layer: L1, L2, or L3
        
    Returns:
        Difficulty score 1-10
    """
    # Simple heuristic based on layer and text complexity
    base_difficulty = {'L1': 3, 'L2': 6, 'L3': 8}
    
    # Adjust based on text length and sentence complexity
    avg_sentence_length = len(text.split()) / max(text.count('.'), 1)
    
    difficulty = base_difficulty.get(layer, 5)
    
    if avg_sentence_length > 20:
        difficulty += 1
    if avg_sentence_length > 30:
        difficulty += 1
        
    return min(max(difficulty, 1), 10)


async def persist_asset(
    content_id: str,
    modality: str,
    asset: GeneratedAsset
) -> str:
    """
    Persist asset to database.
    
    Args:
        content_id: UUID of source content
        modality: READING/LISTENING/WRITING
        asset: Validated GeneratedAsset
        
    Returns:
        UUID of created asset
    """
    if not Session:
        raise RuntimeError("Database not configured")
    
    session = Session()
    try:
        # Insert asset
        query = text("""
            INSERT INTO learning_assets (
                content_id, layer, modality,
                body_ref, glossary_json, cues_json, checkpoints_json, quiz_post_json,
                difficulty_estimate, length_estimate, prompt_version,
                created_at, updated_at
            ) VALUES (
                :content_id, :layer, :modality,
                :body_ref, :glossary_json, :cues_json, :checkpoints_json, :quiz_post_json,
                :difficulty_estimate, :length_estimate, :prompt_version,
                :created_at, :updated_at
            )
            RETURNING id
        """)
        
        # Convert Pydantic models to JSON
        result = session.execute(query, {
            "content_id": content_id,
            "layer": asset.layer,
            "modality": modality,
            "body_ref": None,  # TODO: Upload to S3 if needed
            "glossary_json": [g.model_dump() for g in asset.glossary],
            "cues_json": [c.model_dump() for c in asset.cues],
            "checkpoints_json": [cp.model_dump() for cp in asset.checkpoints],
            "quiz_post_json": [q.model_dump() for q in asset.quiz_post],
            "difficulty_estimate": asset.difficulty_estimate,
            "length_estimate": asset.length_estimate,
            "prompt_version": asset.prompt_version,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
        
        asset_id = result.scalar()
        session.commit()
        
        print(f"[PERSIST] Asset saved with ID: {asset_id}")
        return asset_id
        
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


# Test function
if __name__ == "__main__":
    async def test():
        # Mock test
        print("Testing asset generator...")
        print("Would need valid content_id from database")
        
    asyncio.run(test())
