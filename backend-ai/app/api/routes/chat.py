from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import verify_internal_api_key
from app.rag_chat.graph.runner import run_chat
from app.rag_chat.schemas.chat import ChatRequest, ChatResponse
from app.rag_chat.schemas.enums import RetrievalSource

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["chat"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    RAG Chat assistant for CertificationHub.
    Handles certification advisory, FAQ, syllabus exploration, and analytical questions.
    """
    logger.info(
        "[API] Received chat request: user_id=%s user_role=%s squad_id=%s msg=%r",
        request.user_id,
        request.user_role,
        request.squad_id,
        request.message[:80],
    )

    try:
        response = run_chat(request)
        return response
    except Exception as exc:
        logger.error("[API] Chat execution failed: %s", exc, exc_info=True)
        # Return a polite, helpful fallback response instead of a raw 500
        return ChatResponse(
            thread_id=request.thread_id or uuid.uuid4().hex,
            on_topic=True,
            source=RetrievalSource.NONE,
            answer="Je rencontre actuellement une indisponibilité technique temporaire pour répondre à votre question. Veuillez réessayer dans quelques instants.",
            grounded=False,
            retrieved_chunks=[],
            reasons=[f"[CHAT_ERROR] {type(exc).__name__}: {str(exc)}"],
        )
