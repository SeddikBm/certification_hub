from __future__ import annotations
import logging
from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from app.api.deps import verify_internal_api_key
from app.rag_chat.ingestion.pipeline import ingest_certification
from app.rag_chat.ingestion.seed_chunks import seed_certification_chunks

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["ingestion"],
                   dependencies=[Depends(verify_internal_api_key)])


class IngestionRequest(BaseModel):
    certification_id: str          # UUID as string
    certification_title: str
    official_url: str = ""         # Devoteam Learning / Udemy course
    exam_provider_url: str = ""    # official exam portal
    source_url: str = ""           # backwards-compat alias


class IngestionAccepted(BaseModel):
    accepted: bool
    certification_id: str


class FullIngestionAccepted(BaseModel):
    accepted: bool
    mode: str


@router.post("/ingest", response_model=IngestionAccepted)
async def trigger_ingestion(request: IngestionRequest,
                            background_tasks: BackgroundTasks) -> IngestionAccepted:
    """Fire-and-forget: scrapes both URLs, merges, embeds, stores. Failures -> dead_letter."""
    official = request.official_url or request.source_url
    exam_url = request.exam_provider_url
    logger.info("[API] Ingestion triggered: id=%s official=%s exam=%s",
                request.certification_id, official, exam_url)
    background_tasks.add_task(
        ingest_certification,
        request.certification_id, request.certification_title, official, exam_url)
    return IngestionAccepted(accepted=True, certification_id=request.certification_id)


@router.post("/ingest/all", response_model=FullIngestionAccepted)
async def trigger_full_ingestion(background_tasks: BackgroundTasks) -> FullIngestionAccepted:
    """Rebuild the initial catalogue explicitly after clearing RAG chunks."""
    logger.info("[API] Full 53-certification ingestion triggered.")
    background_tasks.add_task(seed_certification_chunks)
    return FullIngestionAccepted(accepted=True, mode="full_catalogue")
