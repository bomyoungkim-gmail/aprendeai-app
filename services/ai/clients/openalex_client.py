"""
OpenAlex API Client
Provides functions to search academic papers via OpenAlex API (free, no auth required)
Documentation: https://docs.openalex.org/
"""
import httpx
import os
from typing import Optional, List, Dict, Any

BASE_URL = "https://api.openalex.org"
MAILTO = os.getenv("OPENALEX_MAILTO", "contact@aprendeai.com")


def reconstruct_abstract(inverted_index: Dict[str, List[int]]) -> str:
    """
    Reconstruct abstract text from OpenAlex inverted index format.
    
    Args:
        inverted_index: Dict mapping words to their positions
        
    Returns:
        Reconstructed abstract text
    """
    if not inverted_index:
        return ""
    
    # Create list of (position, word) tuples
    word_positions = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    
    # Sort by position and join
    word_positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in word_positions)


async def search_works(
    query: str,
    page: int = 1,
    per_page: int = 25,
    filter_params: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search academic papers via OpenAlex API.
    
    Args:
        query: Search query string
        page: Page number (1-indexed)
        per_page: Results per page (max 200)
        filter_params: Additional filter parameters (e.g., "publication_year:2024")
        
    Returns:
        Dict with 'meta' (pagination) and 'results' (list of papers)
    """
    params = {
        "search": query,
        "page": page,
        "per-page": min(per_page, 200),
        "mailto": MAILTO,
    }
    
    if filter_params:
        params["filter"] = filter_params
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{BASE_URL}/works", params=params)
        response.raise_for_status()
        data = response.json()
    
    # Normalize results
    normalized_results = []
    for work in data.get("results", []):
        # Get abstract
        abstract = ""
        if work.get("abstract_inverted_index"):
            abstract = reconstruct_abstract(work["abstract_inverted_index"])
        
        # Get authors
        authors = []
        for authorship in work.get("authorships", []):
            author = authorship.get("author", {})
            if author.get("display_name"):
                authors.append(author["display_name"])
        
        # Get publication venue
        host_venue = work.get("primary_location", {}).get("source", {})
        venue_name = host_venue.get("display_name", "")
        
        normalized_results.append({
            "source_id": work.get("id"),
            "title": work.get("title"),
            "doi": work.get("doi"),
            "publication_year": work.get("publication_year"),
            "publication_date": work.get("publication_date"),
            "authors": authors,
            "abstract": abstract,
            "venue": venue_name,
            "cited_by_count": work.get("cited_by_count", 0),
            "url": work.get("id"),  # OpenAlex URL
            "pdf_url": work.get("open_access", {}).get("oa_url"),
            "kci_arti_id": None,  # To be enriched if available
        })
    
    return {
        "meta": data.get("meta", {}),
        "results": normalized_results,
    }


async def get_work_by_id(work_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information about a specific work by OpenAlex ID.
    
    Args:
        work_id: OpenAlex work ID (e.g., "W2741809807" or full URL)
        
    Returns:
        Normalized work data or None if not found
    """
    # Handle both short IDs and full URLs
    if not work_id.startswith("http"):
        work_id = f"{BASE_URL}/works/{work_id}"
    
    params = {"mailto": MAILTO}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(work_id, params=params)
            response.raise_for_status()
            work = response.json()
            
            # Use same normalization as search_works
            abstract = ""
            if work.get("abstract_inverted_index"):
                abstract = reconstruct_abstract(work["abstract_inverted_index"])
            
            authors = []
            for authorship in work.get("authorships", []):
                author = authorship.get("author", {})
                if author.get("display_name"):
                    authors.append(author["display_name"])
            
            host_venue = work.get("primary_location", {}).get("source", {})
            venue_name = host_venue.get("display_name", "")
            
            return {
                "source_id": work.get("id"),
                "title": work.get("title"),
                "doi": work.get("doi"),
                "publication_year": work.get("publication_year"),
                "publication_date": work.get("publication_date"),
                "authors": authors,
                "abstract": abstract,
                "venue": venue_name,
                "cited_by_count": work.get("cited_by_count", 0),
                "url": work.get("id"),
                "pdf_url": work.get("open_access", {}).get("oa_url"),
            }
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
