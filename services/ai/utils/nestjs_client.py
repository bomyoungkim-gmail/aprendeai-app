"""
NestJS API Client for AI Service

Calls existing NestJS endpoints instead of duplicating database access.
This ensures single source of truth and clean separation of concerns.
"""

import httpx
import os
from typing import Dict, List, Optional
import logging

# Phase 1: Centralized URL Configuration
from config.urls import NESTJS_API_URL

logger = logging.getLogger(__name__)


class NestJSClient:
    """Client to interact with NestJS API"""
    
    def __init__(self):
        self.base_url = NESTJS_API_URL
        self.timeout = 10.0
        logger.info(f"NestJS Client initialized with base URL: {self.base_url}")
    
    async def get_learner_profile(self, user_id: str) -> Dict:
        """
        Get learner profile from NestJS LearnerProfile service
        
        Returns:
            {
                "educationLevel": "MEDIO",
                "age": 16,
                "preferredLanguages": ["PT"],
                ...
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}/profiles/{user_id}"
            logger.debug(f"Fetching learner profile: {url}")
            
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to fetch learner profile: {e}")
                raise
    
    async def get_vocab_focus(
        self, 
        user_id: str, 
        limit: int = 50,
        due_only: bool = True
    ) -> Dict:
        """
        Get vocabulary focus (due words) for learner
        
        Returns:
            {
                "dueWords": [
                    {"word": "exemplo", "dueAt": "...", "lapsesCount": 2},
                    ...
                ],
                "totalDue": 10
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}/vocab"
            params = {
                "userId": user_id,
                "limit": limit,
                "dueOnly": str(due_only).lower()
            }
            logger.debug(f"Fetching vocab focus: {url} with params {params}")
            
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                vocab_data = response.json()
                
                # Transform to focus format
                return {
                    "dueWords": vocab_data[:limit] if isinstance(vocab_data, list) else [],
                    "totalDue": len(vocab_data) if isinstance(vocab_data, list) else 0
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to fetch vocab: {e}")
                # Return empty if vocab not critical
                return {"dueWords": [], "totalDue": 0}
    
    async def get_session(self, session_id: str) -> Dict:
        """
        Get reading session data
        
        Returns:
            {
                "id": "rs_123",
                "phase": "PRE",
                "contentId": "ct_001",
                "goalStatement": "...",
                "targetWordsJson": [...],
                ...
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}/reading-sessions/{session_id}"
            logger.debug(f"Fetching session: {url}")
            
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to fetch session: {e}")
                raise
    
    async def get_session_events(self, session_id: str) -> List[Dict]:
        """
        Get all events for a session
        
        Returns:
            [
                {
                    "eventType": "MARK_UNKNOWN_WORD",
                    "payloadJson": {...},
                    "createdAt": "..."
                },
                ...
            ]
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}/reading-sessions/{session_id}/events"
            logger.debug(f"Fetching session events: {url}")
            
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to fetch events: {e}")
                return []  # Return empty if not critical
    
    async def get_content_metadata(self, content_id: str) -> Dict:
        """
        Get content metadata (for retrieval context)
        
        Returns:
            {
                "id": "ct_001",
                "title": "...",
                "originalLanguage": "PT",
                "difficulty": "medium"
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}/contents/{content_id}"
            logger.debug(f"Fetching content metadata: {url}")
            
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to fetch content: {e}")
                raise


# Global client instance
nestjs_client = NestJSClient()
