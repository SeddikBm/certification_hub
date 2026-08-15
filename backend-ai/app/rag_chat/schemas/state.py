"""
Graph state definition — the shared blackboard every node in the chat
graph reads/writes. Mirrors the same pattern as
app.certification_validation.schemas.state.GraphState: a TypedDict (what
LangGraph's StateGraph expects natively), with Pydantic objects living
inside it where validation/typing matters (RetrievedChunk, etc.).
"""

from __future__ import annotations

from typing import TypedDict

from app.rag_chat.schemas.chat import RetrievedChunk
from app.rag_chat.schemas.enums import Intent, RetrievalSource


class GraphState(TypedDict, total=False):
    # --- input ---------------------------------------------------------
    message: str
    user_id: int
    squad_id: int | None
    thread_id: str

    # --- after guardrail_node ------------------------------------------------
    on_topic: bool
    guardrail_score: float

    # --- after rewrite_node --------------------------------------------------
    rewritten_query: str

    # --- after route_node --------------------------------------------------
    intent: Intent

    # --- after text_to_sql_node ----------------------------------------------
    sql_query: str | None
    sql_rows: list[dict] | None
    sql_error: str | None

    # --- after vector_search_node --------------------------------------------
    vector_chunks: list[RetrievedChunk]

    # --- after grade_retrieval_node -------------------------------------------
    retrieval_sufficient: bool
    retrieval_grade_reason: str | None

    # --- after web_scrape_node (only reached if retrieval was insufficient) ---
    scraped_content: str | None
    scrape_error: str | None

    # --- after generate_node --------------------------------------------------
    source: RetrievalSource
    answer: str
    generation_attempts: int

    # --- after groundedness_node ----------------------------------------------
    grounded: bool
    groundedness_reason: str | None

    # --- accumulated across the whole run --------------------------------------
    reasons: list[str]
