"""
Node: text_to_sql_node — "Agent Text-to-SQL (Factual & Comptage)".

Three strictly separate steps, each independently testable — generation
has no authority to decide safety, the guardrail has no authority to
decide what SQL to write, execution only ever runs what the guardrail
already approved and re-scoped:

    generate (LLM) -> validate + scope (guardrail, sqlglot) -> execute (read-only)

Never fails the whole request on a SQL problem — a bad query means
sql_rows stays None and sql_error is set; generate_node downstream turns
that into an honest "I couldn't retrieve that" rather than a 500.
"""

from __future__ import annotations

import logging

import psycopg

from app.core.config import settings
from app.rag_chat.exceptions import RagChatError, SqlExecutionError, SqlGuardrailViolation
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.llm.sql_generator import SqlGenerator
from app.rag_chat.services.sql.guardrail import validate_and_scope_sql

logger = logging.getLogger(__name__)


def text_to_sql_node(state: GraphState) -> dict:
    question = state["rewritten_query"]
    user_id = state["user_id"]
    reasons = state.get("reasons", [])

    logger.info("[SQL] Generating SQL for: %r", question)

    try:
        raw_sql = SqlGenerator().generate(question)
        scoped_sql = validate_and_scope_sql(raw_sql, user_id=user_id, allowed_tables=settings.SQL_ALLOWED_TABLES)
        rows = _execute_read_only(scoped_sql)
    except SqlGuardrailViolation as exc:
        logger.error("[SQL] Guardrail rejected generated SQL: %s", exc)
        return {
            "sql_query": None,
            "sql_rows": None,
            "sql_error": str(exc),
            "reasons": [*reasons, f"[SQL] Rejected by guardrail: {exc}"],
        }
    except (RagChatError, psycopg.Error) as exc:
        logger.error("[SQL] Failed: %s", exc)
        return {
            "sql_query": None,
            "sql_rows": None,
            "sql_error": str(exc),
            "reasons": [*reasons, f"[SQL] Failed: {exc}"],
        }

    logger.info("[SQL] Executed successfully, %d row(s)", len(rows))
    return {
        "sql_query": scoped_sql,
        "sql_rows": rows,
        "sql_error": None,
        "reasons": [*reasons, f"[SQL] {scoped_sql} -> {len(rows)} row(s)"],
    }


def _execute_read_only(sql: str) -> list[dict]:
    try:
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute(sql)
            columns = [desc.name for desc in cur.description]
            return [dict(zip(columns, row, strict=True)) for row in cur.fetchall()]
    except psycopg.Error as exc:
        raise SqlExecutionError(f"Query execution failed: {exc}") from exc
