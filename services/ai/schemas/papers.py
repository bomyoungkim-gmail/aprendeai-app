"""
Pydantic schemas for academic papers
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class PaperResult(BaseModel):
    """Normalized paper search result from OpenAlex"""
    source_id: str = Field(..., description="OpenAlex work ID")
    title: Optional[str] = Field(None, description="Paper title")
    doi: Optional[str] = Field(None, description="DOI")
    publication_year: Optional[int] = Field(None, description="Year published")
    publication_date: Optional[str] = Field(None, description="Full publication date")
    authors: List[str] = Field(default_factory=list, description="Author names")
    abstract: str = Field("", description="Abstract text")
    venue: str = Field("", description="Publication venue/journal")
    cited_by_count: int = Field(0, description="Citation count")
    url: Optional[str] = Field(None, description="OpenAlex URL")
    pdf_url: Optional[str] = Field(None, description="Open access PDF URL")
    kci_arti_id: Optional[str] = Field(None, description="KCI Article ID if available")


class KCIReference(BaseModel):
    """Bibliography entry from KCI"""
    ref_seq: Optional[str] = Field(None, description="Reference sequence number")
    title: Optional[str] = Field(None, description="Reference title")
    source: Optional[str] = Field(None, description="Source journal/book")
    year: Optional[str] = Field(None, description="Publication year")
    publisher: Optional[str] = Field(None, description="Publisher")
    uri: Optional[str] = Field(None, description="URI/link")
    ori_ref: Optional[str] = Field(None, description="Original reference text")


class KCIThesisInfo(BaseModel):
    """Full paper metadata from KCI"""
    arti_id: Optional[str] = Field(None, description="KCI Article ID")
    title: Optional[str] = Field(None, description="Korean title")
    title_eng: Optional[str] = Field(None, description="English title")
    authors: List[str] = Field(default_factory=list, description="Author names")
    abstract: Optional[str] = Field(None, description="Korean abstract")
    abstract_eng: Optional[str] = Field(None, description="English abstract")
    journal_name: Optional[str] = Field(None, description="Korean journal name")
    journal_name_eng: Optional[str] = Field(None, description="English journal name")
    publication_year: Optional[str] = Field(None, description="Publication year")
    volume: Optional[str] = Field(None, description="Volume number")
    issue: Optional[str] = Field(None, description="Issue number")
    start_page: Optional[str] = Field(None, description="Starting page")
    end_page: Optional[str] = Field(None, description="Ending page")
    doi: Optional[str] = Field(None, description="DOI")
    keywords: List[str] = Field(default_factory=list, description="Korean keywords")
    keywords_eng: List[str] = Field(default_factory=list, description="English keywords")


class PaperSearchResponse(BaseModel):
    """Response for paper search endpoint"""
    source: str = Field("openalex", description="Data source")
    page: int = Field(1, description="Current page")
    per_page: int = Field(25, description="Results per page")
    total_results: Optional[int] = Field(None, description="Total number of results")
    results: List[PaperResult] = Field(default_factory=list, description="Search results")


class KCIReferencesResponse(BaseModel):
    """Response for KCI references endpoint"""
    arti_id: str = Field(..., description="KCI Article ID")
    page: int = Field(1, description="Current page")
    per_page: int = Field(50, description="Results per page")
    total_count: int = Field(0, description="Total references")
    references: List[KCIReference] = Field(default_factory=list, description="Bibliography entries")
