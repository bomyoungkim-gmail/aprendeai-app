"""
HMAC Authentication Middleware for FastAPI

Phase 0: MVP-Hardening Security
Validates HMAC signature from NestJS to prevent unauthorized access to AI Service.
"""
import hmac
import hashlib
import os
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Awaitable, Callable
from utils.correlation import set_correlation_id  # Phase 0: Correlation ID


class HMACAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to validate HMAC signatures on incoming requests."""
    
    def __init__(self, app, secret: str):
        super().__init__(app)
        if not secret or len(secret) < 32:
            raise ValueError("AI_SERVICE_SECRET must be at least 32 characters")
        self.secret = secret.encode('utf-8')
    
    async def dispatch(
        self, 
        request: Request, 
        call_next: Callable[[Request], Awaitable]
    ):
        # Skip auth for health check endpoint
        if request.url.path == "/health":
            return await call_next(request)
        
        # Extract headers
        signature = request.headers.get("X-Signature")
        correlation_id = request.headers.get("X-Correlation-ID")
        
        # Validate headers presence
        if not signature:
            raise HTTPException(
                status_code=401,
                detail="Missing X-Signature header"
            )
        
        if not correlation_id:
            raise HTTPException(
                status_code=401,
                detail="Missing X-Correlation-ID header"
            )
        
        # Read request body
        body = await request.body()
        
        # Compute expected signature
        expected_hmac = hmac.new(self.secret, body, hashlib.sha256).hexdigest()
        expected_signature = f"sha256={expected_hmac}"
        
        # Validate signature (constant-time comparison)
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(
                status_code=401,
                detail="Invalid signature"
            )
        
        # Phase 0: Set correlation ID for logging
        set_correlation_id(correlation_id)
        
        # Store correlation ID in request state for access in handlers
        request.state.correlation_id = correlation_id
        
        # Proceed with request
        return await call_next(request)

