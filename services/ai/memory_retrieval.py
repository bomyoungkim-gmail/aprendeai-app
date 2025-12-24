"""
Memory Retrieval - Fetch pedagogical memories for agent context
Used by educator phase handlers to get relevant past insights.
"""
import logging
from typing import List, Dict, Any, Optional
from langchain_redis import RedisVectorStore
from langchain_openai.embeddings import OpenAIEmbeddings
import os

logger = logging.getLogger(__name__)

# Lazy globals (initialized on first use)
_embeddings: Optional[OpenAIEmbeddings] = None
_vector_stores: Dict[str, RedisVectorStore] = {}  # Cache per tenant


def _get_embeddings() -> OpenAIEmbeddings:
    """Get or create embeddings model (lazy, singleton)"""
    global _embeddings
    if _embeddings is None:
        # Same as cache_config and memory_handler for consistency
        _embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return _embeddings


def _get_vector_store(tenant_id: str) -> RedisVectorStore:
    """Get or create vector store for tenant (lazy, cached)"""
    global _vector_stores
    
    if tenant_id not in _vector_stores:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _vector_stores[tenant_id] = RedisVectorStore(
            redis_url=redis_url,
            index_name=f"mem:index:{tenant_id}",
            embedding=_get_embeddings(),
        )
    
    return _vector_stores[tenant_id]


def retrieve_memories(
    tenant_id: str,
    query: str,
    top_k: int = 6,
    filter_kind: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve top-k pedagogical memories relevant to query.
    
    Args:
        tenant_id: Tenant identifier for namespacing
        query: Search query (semantic search)
        top_k: Number of memories to retrieve (default: 6)
        filter_kind: Optional filter by memory kind (blocker|intervention|vocab_progress)
    
    Returns:
        List of memory dicts with:
            - text: memory content
            - meta: metadata (user_id, content_id, kind, timestamp)
            - score: similarity score (0-1, higher is better)
    
    Example:
        memories = retrieve_memories(
            "user123",
            query="blocker: inferir",
            top_k=6,
            filter_kind="blocker"
        )
    """
    try:
        vs = _get_vector_store(tenant_id)
        
        # Perform semantic search
        # Note: filter_kind requires metadata filtering - may need custom implementation
        docs = vs.similarity_search_with_score(query=query, k=top_k)
        
        # Format results
        memories = []
        for doc, score in docs:
            # Filter by kind if specified (client-side for now)
            if filter_kind and doc.metadata.get('kind') != filter_kind:
                continue
            
            memories.append({
                "text": doc.page_content,
                "meta": doc.metadata,
                "score": float(score)
            })
        
        logger.debug(f"Retrieved {len(memories)} memories for query: {query[:50]}...")
        return memories
    
    except Exception as e:
        logger.warning(f"Memory retrieval failed: {e}. Returning empty list.")
        return []


def retrieve_blockers(
    tenant_id: str,
    context: str,
    top_k: int = 5
) -> List[str]:
    """
    Retrieve blocker words relevant to context.
    Convenience wrapper for blocker-specific retrieval.
    
    Args:
        tenant_id: Tenant identifier  
        context: Context to search (e.g., current reading text snippet)
        top_k: Number of blockers to retrieve
    
    Returns:
        List of blocker words
    """
    memories = retrieve_memories(
        tenant_id,
        query=f"blocker {context[:100]}",
        top_k=top_k,
        filter_kind="blocker"
    )
    
    # Extract words from memory text
    blockers = []
    for mem in memories:
        # Parse "Blocker: 'word'. ..." format
        if "Blocker:" in mem["text"]:
            word = mem["text"].split("'")[1] if "'" in mem["text"] else ""
            if word:
                blockers.append(word)
    
    return blockers


def retrieve_interventions(
    tenant_id: str,
    situation: str,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Retrieve successful interventions for similar situations.
    
    Args:
        tenant_id: Tenant identifier
        situation: Description of current situation
        top_k: Number of interventions to retrieve
    
    Returns:
        List of intervention dicts with strategy and metadata
    """
    memories = retrieve_memories(
        tenant_id,
        query=f"intervention {situation}",
        top_k=top_k,
        filter_kind="intervention"
    )
    
    interventions = []
    for mem in memories:
        interventions.append({
            "strategy": mem["meta"].get("strategy", ""),
            "text": mem["text"],
            "score": mem["score"]
        })
    
    return interventions


def build_memory_context(
    tenant_id: str,
    phase: str,
    user_text: str,
    top_k: int = 6
) -> str:
    """
    Build compact memory context string for LLM prompt.
    
    Args:
        tenant_id: Tenant identifier
        phase: Current phase (PRE|DURING|POST)
        user_text: User's current input
        top_k: Number of memories to include
    
    Returns:
        Formatted string for LLM context
    """
    # Build phase-specific query
    query = f"{phase} phase: {user_text[:100]}"
    
    memories = retrieve_memories(tenant_id, query, top_k)
    
    if not memories:
        return ""
    
    # Format as compact list
    lines = ["=== Relevant Past Insights ==="]
    for i, mem in enumerate(memories, 1):
        kind = mem["meta"].get("kind", "memory")
        lines.append(f"{i}. [{kind}] {mem['text']}")
    
    return "\n".join(lines)


# Utility: Clear all memories for tenant (careful!)
def clear_tenant_memories(tenant_id: str) -> int:
    """
    Clear all memories for tenant (ADMIN ONLY).
    Use for testing or GDPR compliance.
    
    Returns:
        Number of keys deleted
    """
    import redis
    r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    
    # Scan and delete all mem:index:{tenant_id}:* keys
    cursor = 0
    deleted = 0
    pattern = f"mem:index:{tenant_id}:*"
    
    while True:
        cursor, keys = r.scan(cursor, match=pattern, count=100)
        if keys:
            deleted += r.delete(*keys)
        if cursor == 0:
            break
    
    logger.warning(f"Cleared {deleted} memory keys for tenant {tenant_id}")
    return deleted
