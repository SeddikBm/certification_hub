"""Small OpenRouter chat client used exclusively by the RAG workflow."""
from __future__ import annotations

import json
import logging

import httpx

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError

logger = logging.getLogger(__name__)


class OpenRouterChatClient:
    def __init__(self) -> None:
        self._api_key = settings.OPENROUTER_API_KEY
        self._url = f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
        self._headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "CertificationHub",
        }

    def chat(self, system: str, user: str, model: str | None = None, temperature: float = 0.0) -> str:
        return self._complete(system, user, model, temperature, json_mode=False)

    def chat_json(self, system: str, user: str, model: str | None = None, temperature: float = 0.0) -> dict:
        text = self._complete(system, user, model, temperature, json_mode=True)
        try:
            value = json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error("[OPENROUTER] Invalid JSON response: %r", text[:300])
            raise LLMResponseParsingError(f"OpenRouter did not return valid JSON: {exc}") from exc
        if not isinstance(value, dict):
            raise LLMResponseParsingError("OpenRouter JSON response must be an object")
        return value

    def _complete(self, system: str, user: str, model: str | None, temperature: float, json_mode: bool) -> str:
        if not self._api_key:
            raise LLMCallError("OPENROUTER_API_KEY is not configured")
        payload: dict = {
            "model": model or settings.RAG_LLM_MODEL,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(self._url, headers=self._headers, json=payload)
                response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"] or ""
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            logger.error("[OPENROUTER] Chat call failed (model=%s): %s", payload["model"], exc)
            raise LLMCallError(f"OpenRouter call failed (model={payload['model']}): {exc}") from exc
