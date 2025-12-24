"""
Memory Handler - Pedagogical Memory Compaction
Extracts, deduplicates, and stores short memories from session outcomes.

Called when reading session finishes (CO_SESSION_FINISHED / READING_SESSION_FINISHED).
Creates compact memories for retrieval in future sessions.
"""
import json
import hashlib
import time
import logging
from typing import List, Dict, Any, Optional
import redis
from langchain_redis import RedisVectorStore
from langchain_openai.embeddings import OpenAIEmbeddings

logger = logging.getLogger(__name__)

# Redis connection (shared with cache_config)
REDIS_URL = None
_redis_client: Optional[redis.Redis] = None
_embeddings: Optional[OpenAIEmbeddings] = None


def _get_redis() -> redis.Redis:
    """Get or create Redis client (lazy, reusable)"""
    global _redis_client, REDIS_URL
    if _redis_client is None:
        import os
        REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=False)
    return _redis_client


def _get_embeddings() -> OpenAIEmbeddings:
    """Get or create embeddings model (lazy, reusable)"""
    global _embeddings
    if _embeddings is None:
        # Same model as semantic cache for consistency
        _embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return _embeddings


def _get_vector_store(tenant_id: str) -> RedisVectorStore:
    """
    Get vector store for tenant's pedagogical memories.
    Index per tenant for isolation and scalability.
    """
    return RedisVectorStore(
        redis_url=REDIS_URL or "redis://localhost:6379/0",
        index_name=f"mem:index:{tenant_id}",
        embedding=_get_embeddings(),
        # Text field for searchable content
        content_key="text",
        # Metadata for filtering and context
        metadata_schema=[
            {"name": "tenant_id", "type": "tag"},
            {"name": "user_id", "type": "tag"},
            {"name": "content_id", "type": "tag"},
            {"name": "kind", "type": "tag"},  # blocker|intervention|vocab
            {"name": "timestamp", "type": "numeric"},
        ]
    )


def mem_hash(text: str) -> str:
    """
    Generate short hash for deduplication.
    SHA-256 truncated to 16 chars for efficiency.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def extract_pedagogical_memories(
    outcome: Dict[str, Any],
    user_id: str,
    content_id: str
) -> List[Dict[str, Any]]:
    """
    Extract 3-5 short pedagogical memories from session outcome.
    
    Args:
        outcome: SessionOutcome with top_blockers, best_intervention, etc.
        user_id: User identifier
        content_id: Content identifier
    
    Returns:
        List of memory dicts with 'text' and 'meta' keys
    """
    memories = []
    timestamp = int(time.time())
    
    # 1. Top blockers (vocabulary challenges)
    #    Limit to 5 most critical blockers
    for word in (outcome.get("top_blockers") or [])[:5]:
        memories.append({
            "text": f"Blocker: '{word}'. Precisa de definição clara + exemplo de uso.",
            "meta": {
                "user_id": user_id,
                "content_id": content_id,
                "kind": "blocker",
                "word": word,
                "timestamp": timestamp
            }
        })
    
    # 2. Best intervention (successful strategy)
    #    Record what worked for future sessions
    best_intervention = outcome.get("best_intervention")
    if best_intervention:
        memories.append({
            "text": f"Intervenção efetiva: {best_intervention}. Usar em contextos similares.",
            "meta": {
                "user_id": user_id,
                "content_id": content_id,
                "kind": "intervention",
                "strategy": best_intervention,
                "timestamp": timestamp
            }
        })
    
    # 3. Vocabulary delta (words learned)
    #    Track progress for motivation and planning
    vocab_learned = outcome.get("vocab_learned") or []
    if len(vocab_learned) > 0:
        memories.append({
            "text": f"Vocabulário dominado: {', '.join(vocab_learned[:10])}.",
            "meta": {
                "user_id": user_id,
                "content_id": content_id,
                "kind": "vocab_progress",
                "count": len(vocab_learned),
                "timestamp": timestamp
            }
        })
    
    # 4. Struggle points (areas needing focus)
    #    Help educator target future interventions
    struggles = outcome.get("struggle_points") or []
    for struggle in struggles[:3]:  # Top 3 struggles
        memories.append({
            "text": f"Dificuldade: {struggle}. Reforçar em próximas sessões.",
            "meta": {
                "user_id": user_id,
                "content_id": content_id,
                "kind": "struggle",
                "area": struggle,
                "timestamp": timestamp
            }
        })
    
    logger.info(f"Extracted {len(memories)} memories from session outcome")
    return memories


def deduplicate_memories(
    tenant_id: str,
    memories: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Deduplicate memories using Redis SET.
    Prevents storing "blocker: inferir" 500 times.
    
    Uses 1-year TTL on dedup keys (balance between accuracy and cleanup).
    """
    r = _get_redis()
    unique_memories = []
    
    for mem in memories:
        # Hash based on normalized text (lowercase, stripped)
        normalized = mem["text"].lower().strip()
        hash_key = mem_hash(f"{tenant_id}:{normalized}")
        dedup_key = f"mem:dedup:{tenant_id}:{hash_key}"
        
        # Try to set (returns 1 if new, 0 if exists)
        is_new = r.setnx(dedup_key, b"1")
        
        if is_new:
            # Set TTL: 1 year (allows seasonal content to recur)
            r.expire(dedup_key, 365 * 24 * 3600)
            unique_memories.append(mem)
            logger.debug(f"New memory: {mem['text'][:50]}...")
        else:
            logger.debug(f"Duplicate skipped: {mem['text'][:50]}...")
    
    logger.info(
        f"Deduplication: {len(unique_memories)}/{len(memories)} unique "
        f"({len(memories) - len(unique_memories)} duplicates)"
    )
    return unique_memories


def build_compact_state(outcome: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build compact pedagogical state (~1KB JSON).
    Stores only essential info for next session initialization.
    
    Args:
        outcome: SessionOutcome with aggregated metrics
    
    Returns:
        Compact state dict (JSON-serializable)
    """
    return {
        "reading_intent": outcome.get("intent", "analytical"),
        "vocab_mastered_count": len(outcome.get("vocab_learned") or []),
        "last_blockers": (outcome.get("top_blockers") or [])[:5],
        "best_intervention": outcome.get("best_intervention"),
        "phase_completed": outcome.get("phase", "POST"),
        "last_updated": int(time.time()),
        # Lightweight metrics
        "metrics": {
            "total_prompts": outcome.get("total_prompts", 0),
            "checkpoints_passed": outcome.get("checkpoints_passed", 0),
            "struggles_count": len(outcome.get("struggle_points") or [])
        }
    }


def write_compact_state(
    tenant_id: str,
    content_id: str,
    ped_state: Dict[str, Any],
    ttl_sec: int = 180 * 24 * 3600  # 180 days default
) -> None:
    """
    Write compact pedagogical state to Redis.
    Enables fast initialization of next session on same content.
    
    TTL: 180 days (balance between multi-session continuity and stale data)
    """
    r = _get_redis()
    key = f"edu:state:{tenant_id}:{content_id}"
    
    # Serialize to JSON (compact)
    value = json.dumps(ped_state, ensure_ascii=False, separators=(',', ':'))
    
    r.set(key, value.encode("utf-8"), ex=ttl_sec)
    logger.info(f"Compact state saved: {key} ({len(value)} bytes, TTL={ttl_sec}s)")


def handle_session_finished(job: Dict[str, Any]) -> None:
    """
    Main handler for session finished events.
    Called by RabbitMQ consumer when session completes.
    
    Expected job structure:
    {
        "tenantId": "t1",
        "userId": "u1",
        "contentId": "ct_1",
        "sessionOutcome": {
            "top_blockers": ["word1", "word2"],
            "best_intervention": "visual_exemplo",
            "vocab_learned": ["word3", "word4"],
            ...
        }
    }
    """
    tenant_id = job.get("tenantId")
    user_id = job.get("userId")
    content_id = job.get("contentId")
    outcome = job.get("sessionOutcome") or {}
    
    if not all([tenant_id, user_id, content_id]):
        logger.error(f"Invalid job: missing required fields. Job: {job}")
        return
    
    logger.info(f"Processing session finished: tenant={tenant_id}, user={user_id}, content={content_id}")
    
    try:
        # 1. Extract pedagogical memories
        memories = extract_pedagogical_memories(outcome, user_id, content_id)
        
        # 2. Deduplicate
        unique_memories = deduplicate_memories(tenant_id, memories)
        
        # 3. Store in vector DB (if any unique memories)
        if unique_memories:
            vs = _get_vector_store(tenant_id)
            texts = [m["text"] for m in unique_memories]
            metas = []
            for m in unique_memories:
                # Flatten metadata and add tenant_id
                meta = {"tenant_id": tenant_id, **m["meta"]}
                metas.append(meta)
            
            # Batch insert for efficiency
            vs.add_texts(texts=texts, metadatas=metas)
            logger.info(f"Stored {len(unique_memories)} memories in vector store")
        else:
            logger.info("No unique memories to store (all were duplicates)")
        
        # 4. Update compact state for next session
        ped_state = build_compact_state(outcome)
        write_compact_state(tenant_id, content_id, ped_state)
        
        logger.info(f"✅ Memory compaction complete for {tenant_id}/{content_id}")
        
    except Exception as e:
        logger.error(f"❌ Memory compaction failed: {e}", exc_info=True)
        # Don't raise - we don't want to block the queue on memory errors
