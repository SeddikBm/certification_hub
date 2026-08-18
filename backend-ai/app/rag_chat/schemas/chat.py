"""
Public data contracts — what Spring Boot / the React widget actually sees
over HTTP. Keep this file backwards-compatible; it's the contract the
Java/React side codes against.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.rag_chat.schemas.enums import Intent, RetrievalSource


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    user_id: str | None = None
    user_role: str | None = None
    user_name: str | None = None
    squad_id: str | None = None
    thread_id: str | None = Field(
        default=None,
        description="Conversation/session id for multi-turn memory. Omit for a one-off question.",
    )


from typing import Any


class RetrievedChunk(BaseModel):
    certification_id: Any | None = None
    certification_code: str | None = None
    certification_title: str
    section: str | None = None
    text: str
    score: float
    source_url: str | None = None


class SourceInfo(BaseModel):
    type: str = "vector_db"
    title: str
    url: str | None = None
    score: float = 0.0


class ChatResponse(BaseModel):
    thread_id: str
    on_topic: bool
    intent: Intent | None = None
    source: RetrievalSource
    answer: str
    response: str | None = None
    sources: list[SourceInfo] = Field(default_factory=list)
    suggestedActions: list[str] = Field(default_factory=list)
    latencyMs: int = 0
    grounded: bool
    retrieved_chunks: list[RetrievedChunk] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list, description="Trace of what happened, for debugging/observability.")

    model_config = ConfigDict(use_enum_values=True)

