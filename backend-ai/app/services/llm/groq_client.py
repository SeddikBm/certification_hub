from __future__ import annotations

import json
import logging
import httpx
from groq import Groq

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError

logger = logging.getLogger(__name__)


class GroqChatClient:
    """Unified LLM client supporting OpenRouter (with z-ai/glm-5.2:free) and Groq fallback."""

    def __init__(self) -> None:
        self._groq_client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_REQUEST_TIMEOUT_S) if settings.GROQ_API_KEY else None
        self._openrouter_key = settings.OPENROUTER_API_KEY
        self._openrouter_url = f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
        self._openrouter_headers = {
            "Authorization": f"Bearer {self._openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://certificationhub.devoteam.com",
            "X-Title": "CertificationHub",
        }

    def chat(self, system: str, user: str, model: str | None = None, temperature: float = 0.0) -> str:
        """Plain-text completion."""
        target_model = model or settings.RAG_LLM_MODEL
        return self._complete(system=system, user=user, model=target_model, temperature=temperature, json_mode=False)

    def chat_json(self, system: str, user: str, model: str | None = None, temperature: float = 0.0) -> dict:
        """JSON-mode completion, parsed. Robust against markdown code fences."""
        target_model = model or settings.RAG_LLM_MODEL
        text = self._complete(system=system, user=user, model=target_model, temperature=temperature, json_mode=True).strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except json.JSONDecodeError as exc:
                    logger.error("[LLM] Response substring was not valid JSON: %r", text[start : end + 1])
                    raise LLMResponseParsingError(f"LLM did not return valid JSON: {exc}") from exc
            logger.error("[LLM] Response was not valid JSON: %r", text[:300])
            raise LLMResponseParsingError(f"LLM did not return valid JSON: {text[:100]}")

    def _complete(self, system: str, user: str, model: str, temperature: float, json_mode: bool) -> str:
        # 1. Try OpenRouter if configured and requested
        if self._openrouter_key and (":free" in model or "z-ai/" in model or "nvidia/" in model or not self._groq_client):
            try:
                payload: dict = {
                    "model": model,
                    "temperature": temperature,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}
                with httpx.Client(timeout=45.0) as client:
                    resp = client.post(self._openrouter_url, headers=self._openrouter_headers, json=payload)
                    resp.raise_for_status()
                    return resp.json()["choices"][0]["message"]["content"] or ""
            except Exception as exc:
                logger.warning("[LLM] OpenRouter call failed (model=%s): %s. Falling back to Groq.", model, exc)
                if not self._groq_client:
                    raise LLMCallError(f"OpenRouter call failed and no Groq fallback: {exc}") from exc

        # 2. Groq execution (direct or fallback)
        if not self._groq_client:
            raise LLMCallError("No LLM provider available (GROQ_API_KEY not configured)")

        groq_model = "openai/gpt-oss-120b" if (":free" in model or "z-ai/" in model) else model
        kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
        if json_mode and "json" not in system.lower() and "json" not in user.lower():
            system = f"{system}\n\nRespond with a valid JSON object."
        try:
            completion = self._groq_client.chat.completions.create(
                model=groq_model,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                **kwargs,
            )
            return completion.choices[0].message.content or ""
        except Exception as exc:
            logger.error("[LLM] Groq API call failed (model=%s): %s", groq_model, exc)
            raise LLMCallError(f"Groq call failed (model={groq_model}): {exc}") from exc
