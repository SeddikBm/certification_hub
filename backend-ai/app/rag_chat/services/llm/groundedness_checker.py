"""
Groundedness checker — the last gate before a response goes out.

Asks the LLM to judge its own (or a sibling call's) answer against the
context it was supposed to be grounded in. This is a JUDGMENT call, not a
guarantee — an LLM grading another LLM's output can itself be wrong — but
it catches the common, cheap-to-catch case of an answer drifting into
plausible-sounding specifics (a date, a score, a course detail) that
simply aren't in the retrieved context. One check, one retry at most (see
GROUNDEDNESS_MAX_RETRIES) — never a loop.
"""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

_SYSTEM_PROMPT = """Tu vérifies si une réponse est entièrement soutenue par \
un contexte donné.

Réponds UNIQUEMENT avec un objet JSON :
{"grounded": true|false, "unsupported_claims": [string, ...]}

"grounded" est false si la réponse contient la moindre affirmation \
spécifique (date, chiffre, détail de contenu) qui n'apparaît pas, même \
reformulée, dans le contexte. Une reformulation fidèle du contexte est \
acceptable ; une extrapolation ne l'est pas.
"""


class GroundednessChecker:
    def __init__(self, client: OpenRouterChatClient | None = None) -> None:
        self._client = client or OpenRouterChatClient()

    def check(self, answer: str, context: str) -> tuple[bool, str | None]:
        """Returns (grounded, reason_if_not)."""
        if not context.strip():
            # Nothing to ground against at all (e.g. source == NONE) — treat
            # as ungrounded by definition rather than trivially "passing".
            return False, "No retrieved context was available to check the answer against."

        user = f"Contexte :\n{context}\n\nRéponse à vérifier :\n{answer}"
        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT, user=user, model=settings.RAG_LLM_MODEL
            )
        except (LLMCallError, LLMResponseParsingError) as exc:
            # Fail closed: if we can't verify, don't claim it's grounded.
            raise RagChatError(str(exc)) from exc

        grounded = bool(data.get("grounded", False))
        if grounded:
            return True, None

        claims = data.get("unsupported_claims") or []
        if claims:
            reason = "Unsupported claim(s): " + "; ".join(str(c) for c in claims)
        else:
            reason = "Response not grounded in the retrieved context."
        return False, reason
