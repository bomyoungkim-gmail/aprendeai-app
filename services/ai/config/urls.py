"""
Centralized URL Configuration for AI Service

Single source of truth for all external service URLs.
Benefits:
- Easy environment management
- Type-safe URL access
- Fails fast if required env vars missing in production
"""

import os
from typing import Optional


class URLConfig:
    """URL Configuration Singleton"""
    
    _instance: Optional['URLConfig'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.NODE_ENV = os.getenv("NODE_ENV", "development")
        self.IS_PRODUCTION = self.NODE_ENV == "production"
        
        # NestJS API URL
        self.NESTJS_API_URL = self._get_required(
            "NESTJS_API_URL",
            "http://localhost:4000/api/v1"
        )
        
        # Frontend URL (for CORS)
        self.FRONTEND_URL = self._get_required(
            "FRONTEND_URL",
            "http://localhost:3000"
        )
        
        # Additional frontend URL for dev
        self.FRONTEND_URL_DEV = os.getenv("FRONTEND_URL_DEV", "http://localhost:3001")
        
        # Database URL
        self.DATABASE_URL = self._get_required(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/aprendeai"
        )
        
        # RabbitMQ URL
        self.RABBITMQ_URL = self._get_required(
            "RABBITMQ_URL",
            "amqp://guest:guest@localhost:5672"
        )
        
        # Redis URL (for Games mastery tracking)
        self.REDIS_URL = os.getenv(
            "REDIS_URL",
            "redis://localhost:6379"
        )
        
        self._initialized = True
    
    def _get_required(self, key: str, dev_fallback: str) -> str:
        """Get required env var with dev fallback"""
        value = os.getenv(key)
        
        if not value:
            if self.IS_PRODUCTION:
                raise ValueError(
                    f"❌ FATAL: {key} environment variable is required in production"
                )
            return dev_fallback
        
        return value
    
    def get_cors_origins(self) -> list[str]:
        """Get CORS origins as list"""
        origins_str = os.getenv("CORS_ORIGINS")
        
        if origins_str:
            return [o.strip() for o in origins_str.split(",")]
        
        # Development defaults
        if self.IS_PRODUCTION:
            return [self.FRONTEND_URL]
        else:
            return [self.FRONTEND_URL, self.FRONTEND_URL_DEV]


# Global instance
url_config = URLConfig()

# Export for convenience
NESTJS_API_URL = url_config.NESTJS_API_URL
FRONTEND_URL = url_config.FRONTEND_URL
DATABASE_URL = url_config.DATABASE_URL
RABBITMQ_URL = url_config.RABBITMQ_URL
REDIS_URL = url_config.REDIS_URL
