from __future__ import annotations

import json
import logging

from groq import Groq

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError

logger = logging.getLogger(__name__)


class GroqChatClient:
    def __init__(self) -> None:
        self._client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_REQUEST_TIMEOUT_S)

    def chat(self, system: str, user: str, model: str | None = None, temperature: float = 0.0) -> str:
        """Plain-text completion."""
        target_model = model or settings.RAG_LLM_MODEL
        return self._complete(system=system, user=user, model=target_model, temperature=temperature, json_mode=False)

    def chat_json(self, system: str, user: str, model: str | None = None, temperature: float = 0.0) -> dict:
        """JSON-mode completion, parsed. Raises LLMResponseParsingError on malformed JSON."""
        target_model = model or settings.RAG_LLM_MODEL
        text = self._complete(system=system, user=user, model=target_model, temperature=temperature, json_mode=True)
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error("[LLM] Response was not valid JSON: %r", text[:300])
            raise LLMResponseParsingError(f"LLM did not return valid JSON: {exc}") from exc

    def _complete(self, system: str, user: str, model: str, temperature: float, json_mode: bool) -> str:
        kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
        try:
            completion = self._client.chat.completions.create(
                model=model,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                **kwargs,
            )
            return completion.choices[0].message.content or ""
        except Exception as exc:  # network/API errors (bad key, rate limit, model retired, timeout...)
            logger.error("[LLM] Groq API call failed (model=%s): %s", model, exc)
            raise LLMCallError(f"Groq call failed (model={model}): {exc}") from exc
