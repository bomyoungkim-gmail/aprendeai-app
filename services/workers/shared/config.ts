"""
Shared Worker Configuration

Common configuration utilities for all workers.
"""

import os
from typing import Optional


class WorkerConfig:
    """Worker URL Configuration"""
    
    def __init__(self):
        self.NODE_ENV = os.getenv("NODE_ENV", "development")
        self.IS_PRODUCTION = self.NODE_ENV == "production"
        
        # API URL (for posting results)
        self.API_URL = self._get_with_fallback(
            "API_URL",
            "http://localhost:4000"
        )
        
        # AI Service URL (for processing)
        self.AI_SERVICE_URL = self._get_with_fallback(
            "AI_SERVICE_URL",
            "http://localhost:8001"
        )
        
        # RabbitMQ URL
        self.RABBITMQ_URL = self._get_with_fallback(
            "RABBITMQ_URL",
            "amqp://guest:guest@localhost:5672"
        )
        
        # Database URL (for workers that need it)
        self.DATABASE_URL = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/aprendeai"
        )
        
        # Storage Path (for extraction worker)
        self.STORAGE_LOCAL_PATH = os.getenv(
            "STORAGE_LOCAL_PATH",
            "./uploads"
        )
    
    def _get_with_fallback(self, key: str, fallback: str) -> str:
        """Get env var with fallback, warn in production if missing"""
        value = os.getenv(key)
        
        if not value:
            if self.IS_PRODUCTION:
                print(f"⚠️  WARNING: {key} not set in production, using: {fallback}")
            return fallback
        
        return value


# Global instance
worker_config = WorkerConfig()

# Export for convenience
API_URL = worker_config.API_URL
AI_SERVICE_URL = worker_config.AI_SERVICE_URL
RABBITMQ_URL = worker_config.RABBITMQ_URL
DATABASE_URL = worker_config.DATABASE_URL
STORAGE_LOCAL_PATH = worker_config.STORAGE_LOCAL_PATH
