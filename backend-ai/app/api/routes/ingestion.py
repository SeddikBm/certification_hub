from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel

from app.api.deps import verify_internal_api_key
from app.rag_chat.ingestion.pipeline import ingest_certification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["ingestion"], dependencies=[Depends(verify_internal_api_key)])


class IngestionRequest(BaseModel):
    certification_id: int
    certification_title: str
    source_url: str


class IngestionAccepted(BaseModel):
    accepted: bool
    certification_id: int


@router.post("/ingest", response_model=IngestionAccepted)
async def trigger_ingestion(request: IngestionRequest, background_tasks: BackgroundTasks) -> IngestionAccepted:
    """
    Fire-and-forget by design: ingestion (scrape + summarize + embed) can
    take several seconds, well past what Spring Boot's event listener
    should block on. Runs in the background; failures land in
    ingestion_jobs as dead_letter (see app.rag_chat.ingestion.pipeline),
    not silently — check that table rather than this endpoint's response
    for the actual outcome.
    """
    logger.info(
        "[API] Ingestion triggered: certification_id=%s (%s)",
        request.certification_id,
        request.source_url,
    )
    background_tasks.add_task(
        ingest_certification,
        request.certification_id,
        request.certification_title,
        request.source_url,
    )
    return IngestionAccepted(accepted=True, certification_id=request.certification_id)
