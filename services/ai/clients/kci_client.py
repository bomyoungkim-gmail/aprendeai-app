"""
KCI (Korea Citation Index) API Client
Integrates with data.go.kr OpenAPI for Korean academic papers
Requires: ServiceKey from data.go.kr
"""
import httpx
import os
from typing import List, Dict, Any, Optional
from defusedxml import ElementTree as ET

BASE_URL = "http://apis.data.go.kr/B552540/KCIOpenApi"
SERVICE_KEY = os.getenv("DATA_GO_KCI_SERVICE_KEY", "")


async def get_references(
    arti_id: str,
    page_no: int = 1,
    record_cnt: int = 50
) -> Dict[str, Any]:
    """
    Get bibliography/references for a KCI paper by ARTIID.
    
    API: /refInfo/openApiD272List
   

 
    Args:
        arti_id: KCI Article ID (ARTIID)
        page_no: Page number (1-indexed)
        record_cnt: Records per page
        
    Returns:
        Dict with 'arti_id', 'total_count', 'references' list
    """
    if not SERVICE_KEY:
        raise ValueError("DATA_GO_KCI_SERVICE_KEY not configured")
    
    url = f"{BASE_URL}/refInfo/openApiD272List"
    params = {
        "ServiceKey": SERVICE_KEY,
        "pageNo": page_no,
        "recordCnt": record_cnt,
        "artiId": arti_id,
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        
        # Parse XML response
        root = ET.fromstring(response.content)
        
        # Extract references
        references = []
        for item in root.findall(".//item"):
            ref = {
                "ref_seq": item.findtext("refSeq"),
                "title": item.findtext("title"),
                "source": item.findtext("source"),
                "year": item.findtext("year"),
                "publisher": item.findtext("publisher"),
                "uri": item.findtext("uri"),
                "ori_ref": item.findtext("oriRef"),
            }
            references.append(ref)
        
        # Extract total count
        total_count = root.findtext(".//totalCnt", "0")
        
        return {
            "arti_id": arti_id,
            "page": page_no,
            "per_page": record_cnt,
            "total_count": int(total_count),
            "references": references,
        }


async def get_thesis_info(
    arti_id: str,
    page_no: int = 1,
    record_cnt: int = 10
) -> Optional[Dict[str, Any]]:
    """
    Get thesis/paper metadata from KCI by ARTIID.
    
    API: /artiInfo/openApiD217List
    
    Args:
        arti_id: KCI Article ID (ARTIID)
        page_no: Page number (1-indexed)
        record_cnt: Records per page
        
    Returns:
        Dict with paper metadata or None if not found
    """
    if not SERVICE_KEY:
        raise ValueError("DATA_GO_KCI_SERVICE_KEY not configured")
    
    url = f"{BASE_URL}/artiInfo/openApiD217List"
    params = {
        "ServiceKey": SERVICE_KEY,
        "pageNo": page_no,
        "recordCnt": record_cnt,
        "artiId": arti_id,
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        
        # Parse XML response
        root = ET.fromstring(response.content)
        
        # Get first item (should be unique by artiId)
        item = root.find(".//item")
        if item is None:
            return None
        
        # Extract authors
        authors = []
        author_text = item.findtext("author", "")
        if author_text:
            # Authors are typically semicolon or comma separated
            authors = [a.strip() for a in author_text.replace(";", ",").split(",") if a.strip()]
        
        return {
            "arti_id": item.findtext("artiId"),
            "title": item.findtext("artiTitle"),
            "title_eng": item.findtext("artiTitleEng"),
            "authors": authors,
            "abstract": item.findtext("abstract"),
            "abstract_eng": item.findtext("abstractEng"),
            "journal_name": item.findtext("journalName"),
            "journal_name_eng": item.findtext("journalNameEng"),
            "publication_year": item.findtext("pubYear"),
            "volume": item.findtext("volume"),
            "issue": item.findtext("issue"),
            "start_page": item.findtext("startPage"),
            "end_page": item.findtext("endPage"),
            "doi": item.findtext("doi"),
            "keywords": item.findtext("keyword", "").split(";") if item.findtext("keyword") else [],
            "keywords_eng": item.findtext("keywordEng", "").split(";") if item.findtext("keywordEng") else [],
        }
