"""
Text-to-SQL generation.

Deliberately dumb and narrow: this only turns natural language into a
candidate SQL string. It has NO authority to decide what's safe to run —
that's exclusively app.rag_chat.services.sql.guardrail's job, called right
after this in text_to_sql_node. Splitting generation from validation this
way means the guardrail's logic doesn't change no matter how the prompt
here evolves.
"""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import SqlGenerationError
from app.services.llm.groq_client import GroqChatClient

_SYSTEM_PROMPT = """You translate a question about IT certifications into a \
single read-only PostgreSQL SELECT query.

Schema (only these tables/columns exist — never reference anything else):
- assignments(id, user_id, certification_id, status, assigned_at, completed_at)
- certifications(id, title, provider, level)
- users(id, full_name, squad_id)

Rules:
- Output ONLY the raw SQL, no markdown fences, no explanation.
- Exactly one SELECT statement. Never write INSERT/UPDATE/DELETE/DROP/ALTER.
- Never write a WHERE clause on user_id yourself — it is added \
automatically afterward. Focus only on the rest of the question's logic \
(status filters, counts, date ranges, joins to certifications for titles).
- If the question cannot be answered from this schema, output exactly: \
NOT_ANSWERABLE
"""


class SqlGenerator:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def generate(self, question: str) -> str:
        try:
            raw = self._client.chat(
                system=_SYSTEM_PROMPT,
                user=question,
                model=settings.RAG_LLM_MODEL,
            )
        except LLMCallError as exc:
            raise SqlGenerationError(str(exc)) from exc

        sql = raw.strip().strip("`").removeprefix("sql").strip()
        if not sql or sql.upper() == "NOT_ANSWERABLE":
            raise SqlGenerationError("The question cannot be answered from the available schema.")
        return sql
