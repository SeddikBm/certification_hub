"""
Groq LLM wrapper.

We call the Groq SDK directly rather than through a LangChain chat-model
wrapper: LangGraph nodes are just plain functions, they don't need
LangChain's Runnable interface, and one fewer abstraction layer means one
fewer place a JSON-mode quirk can get lost in translation.

IMPORTANT (2026-07): Groq deprecated llama-3.1-8b-instant and
llama-3.3-70b-versatile for free/developer-tier usage on 2026-06-17. The
model id is read from settings.GROQ_PARSER_MODEL specifically so this file
never needs to change again when Groq reshuffles its lineup — update the
.env, not the code.
"""

from __future__ import annotations

import json
import logging
from datetime import date

from groq import Groq

from app.core.config import settings
from app.exceptions import LLMParsingError
from app.schemas.validation import ParsedCertificate

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are a strict information-extraction engine for IT \
certification documents (Credly, Udemy, AWS, Microsoft, CompTIA, PMI, etc.).

Rules:
- Extract ONLY what is literally written in the text. Never guess, infer, \
autocomplete, or "correct" a name or title to something more plausible.
- If a field is missing or illegible, return null for it. Returning a \
plausible-sounding guess is a critical error in this system: it directly \
undermines fraud detection.
- Dates must be normalised to YYYY-MM-DD. If only a month/year is given, \
use the first day of that month.
- Respond with ONLY a JSON object, no prose, matching exactly this schema:
{"holder_name": string|null, "certification_title": string|null, \
"issue_date": string|null, "issuer": string|null}
"""


class GroqClient:
    def __init__(self) -> None:
        self._client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_REQUEST_TIMEOUT_S)

    def extract_fields(self, raw_text: str) -> ParsedCertificate:
        if not raw_text.strip():
            return ParsedCertificate()

        try:
            completion = self._client.chat.completions.create(
                model=settings.GROQ_PARSER_MODEL,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": raw_text[:8000]},
                ],
            )
            payload = completion.choices[0].message.content
        except Exception as exc:  # network/API errors (bad key, rate limit, model retired, timeout...)
            logger.error(
                "[LLM] Groq API call failed (model=%s): %s", settings.GROQ_PARSER_MODEL, exc
            )
            raise LLMParsingError(f"Groq call failed: {exc}") from exc

        return self._parse_payload(payload)

    @staticmethod
    def _parse_payload(payload: str) -> ParsedCertificate:
        try:
            data = json.loads(payload)
        except json.JSONDecodeError as exc:
            logger.error("[LLM] Response was not valid JSON: %r", payload[:300])
            raise LLMParsingError(f"LLM did not return valid JSON: {exc}") from exc

        issue_date: date | None = None
        if data.get("issue_date"):
            try:
                issue_date = date.fromisoformat(data["issue_date"][:10])
            except ValueError:
                logger.warning("Unparseable issue_date from LLM: %r", data.get("issue_date"))

        return ParsedCertificate(
            holder_name=data.get("holder_name"),
            certification_title=data.get("certification_title"),
            issue_date=issue_date,
            issuer=data.get("issuer"),
        )
