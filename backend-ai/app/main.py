from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

from app.api.routes import chat, health, ingestion, validation
from app.core.config import settings
from app.core.logging import new_request_id, setup_logging

setup_logging(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s (env=%s, ocr_engine=%s, parser_model=%s)",
        settings.APP_NAME,
        settings.ENV,
        settings.OCR_ENGINE,
        settings.GROQ_PARSER_MODEL,
    )
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title="CertificationHub — Moteur de Validation IA",
        description="Microservice FastAPI unique hébergeant les modules IA de "
        "CertificationHub : validation automatique de certificats"
        "et agent RAG de conseil en certifications, exposés au "
        "gateway Spring Boot.",
        version="2.0.0",
        lifespan=lifespan,
    )

    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        new_request_id()
        response = await call_next(request)
        response.headers["X-Request-ID"] = uuid.uuid4().hex[:12]
        return response

    app.include_router(health.router)
    app.include_router(validation.router)
    app.include_router(ingestion.router)
    app.include_router(chat.router)

    return app


app = create_app()
