from __future__ import annotations

import json
import logging
from openai import OpenAI

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError

logger = logging.getLogger(__name__)


class NvidiaChatClient:
    """Chat & JSON LLM client utilizing NVIDIA NIM OpenAI-compatible API endpoint."""

    def __init__(self) -> None:
        self._client = OpenAI(
            base_url=settings.NVIDIA_BASE_URL,
            api_key=settings.NVIDIA_API_KEY,
            timeout=settings.GROQ_REQUEST_TIMEOUT_S,
        )

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
                    logger.error("[NVIDIA] Response substring was not valid JSON: %r", text[start : end + 1])
                    raise LLMResponseParsingError(f"LLM did not return valid JSON: {exc}") from exc
            logger.error("[NVIDIA] Response was not valid JSON: %r", text[:300])
            raise LLMResponseParsingError(f"LLM did not return valid JSON: {text[:100]}")

    def _complete(self, system: str, user: str, model: str, temperature: float, json_mode: bool) -> str:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        kwargs: dict = {}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            resp = self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                **kwargs,
            )
            return resp.choices[0].message.content or ""
        except Exception as exc:
            logger.error("[NVIDIA] API call failed (model=%s): %s", model, exc)
            raise LLMCallError(f"NVIDIA API call failed (model={model}): {exc}") from exc
