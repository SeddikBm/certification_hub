from __future__ import annotations

from fastapi import Header, HTTPException, status

from app.core.config import settings


async def verify_internal_api_key(x_api_key: str = Header(...)) -> None:
    """
    This microservice is only ever called by the Spring Boot gateway
    (internal network / Docker network, not public-facing), but a shared
    secret costs nothing and prevents any other container on the same
    network from triggering validations or scraping requests through us.
    """
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header.",
        )
