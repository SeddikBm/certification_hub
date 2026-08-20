"""
Certificate field extraction — the module-specific prompt/logic layer on
top of the shared NvidiaChatClient (app.services.llm.nvidia_client).
"""

from __future__ import annotations

from datetime import date

from app.certification_validation.exceptions import LLMParsingError
from app.certification_validation.schemas.validation import ParsedCertificate
from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError
from app.services.llm.nvidia_client import NvidiaChatClient

_SYSTEM_PROMPT = """You are a strict information-extraction engine for IT \
certification documents (Credly, Coursera, AWS, Microsoft, CompTIA, PMI, etc.).

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


class CertificateFieldExtractor:
    def __init__(self, client: NvidiaChatClient | None = None) -> None:
        self._client = client or NvidiaChatClient()

    def extract_fields(self, raw_text: str) -> ParsedCertificate:
        if not raw_text.strip():
            return ParsedCertificate()

        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT,
                user=raw_text[:8000],
                model=settings.GROQ_PARSER_MODEL,
            )
        except (LLMCallError, LLMResponseParsingError) as exc:
            raise LLMParsingError(str(exc)) from exc

        return self._parse_payload(data)

    @staticmethod
    def _parse_payload(data: dict) -> ParsedCertificate:
        issue_date: date | None = None
        if data.get("issue_date"):
            try:
                issue_date = date.fromisoformat(data["issue_date"][:10])
            except ValueError:
                pass  # left as None — the caller treats a missing date as "unknown", not an error

        return ParsedCertificate(
            holder_name=data.get("holder_name"),
            certification_title=data.get("certification_title"),
            issue_date=issue_date,
            issuer=data.get("issuer"),
        )


# Backward compatibility alias
GroqClient = CertificateFieldExtractor
