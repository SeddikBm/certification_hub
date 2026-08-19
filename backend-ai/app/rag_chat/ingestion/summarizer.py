"""Create retrieval-ready, plain-text sections from certification web pages."""
from __future__ import annotations

import re
import logging
from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu prépares une base RAG de certifications informatiques.

Fusionne le catalogue et les deux pages web éventuelles en sections indépendantes.
Réponds UNIQUEMENT avec cet objet JSON :
{"sections": [{"title": "Description", "content": "texte simple"}]}

Règles strictes :
- Chaque `content` est du texte brut lisible, sans Markdown, sans tableau, sans HTML.
- Transforme chaque information tabulaire en phrases explicites. Exemple :
  "Ressource : Cypress Master Class. Type : formation vidéo complète. Durée estimée : 40 heures."
- Garde toutes les informations pertinentes : description, compétences, prérequis,
  format, préparation, coûts, validité, ressources et liens officiels.
- Utilise les valeurs du catalogue si les sites ne les précisent pas.
- Ignore navigation, publicité, avis, paiement et répétitions.
- Ne crée pas de section sans information factuelle."""

_MARKDOWN_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_MARKDOWN_DECORATION = re.compile(r"[*_`>#]+")


@dataclass(frozen=True)
class SyllabusSection:
    title: str
    content: str


class SyllabusSummarizer:
    def __init__(self, client: OpenRouterChatClient | None = None) -> None:
        self._client = client or OpenRouterChatClient()

    def summarize_sections(
        self,
        certification_title: str,
        content_a: str = "",
        content_b: str = "",
        metadata_context: str = "",
    ) -> list[SyllabusSection]:
        parts = [f"Certification : {certification_title}"]
        if metadata_context.strip():
            parts.append(f"CATALOGUE CERTIFICATIONHUB :\n{metadata_context}")
        if content_a.strip():
            parts.append(f"SOURCE A — page de formation :\n{content_a[:12000]}")
        if content_b.strip():
            parts.append(f"SOURCE B — portail officiel de l'examen :\n{content_b[:12000]}")

        try:
            payload = self._client.chat_json(
                system=_SYSTEM_PROMPT,
                user="\n\n".join(parts),
                model=settings.RAG_LLM_MODEL,
            )
            sections = _sections_from_payload(payload)
            if sections:
                return sections
        except (LLMCallError, LLMResponseParsingError, ValueError) as exc:
            # Every catalogue certification stays indexable even if an
            # external provider or model endpoint is temporarily unavailable.
            logger.warning("[INGESTION][SECTIONS] Structured model output unavailable; using fallback: %s", exc)

        fallback = _fallback_sections(metadata_context, content_a, content_b)
        logger.info("[INGESTION][SECTIONS] Fallback produced %d section(s)", len(fallback))
        return fallback


def _sections_from_payload(payload: dict[str, Any]) -> list[SyllabusSection]:
    raw_sections = payload.get("sections")
    if not isinstance(raw_sections, list):
        raise ValueError("Missing sections array")
    sections: list[SyllabusSection] = []
    for raw in raw_sections:
        if not isinstance(raw, dict):
            continue
        title = _plain_text(str(raw.get("title", "")))[:255]
        content = _plain_text(str(raw.get("content", "")))
        if title and content:
            sections.append(SyllabusSection(title=title, content=content))
    return sections


def _fallback_sections(metadata_context: str, content_a: str, content_b: str) -> list[SyllabusSection]:
    sections: list[SyllabusSection] = []
    if metadata_context.strip():
        sections.append(SyllabusSection("Informations du catalogue", _plain_text(metadata_context)))
    if content_a.strip():
        sections.append(SyllabusSection("Ressources de formation", _plain_text(content_a)))
    if content_b.strip():
        sections.append(SyllabusSection("Informations de l'examen", _plain_text(content_b)))
    return sections


def _plain_text(value: str) -> str:
    """Normalise model or fallback output so chunks never contain Markdown tables."""
    lines = [line.strip() for line in value.splitlines()]
    normalised: list[str] = []
    table_headers: list[str] | None = None
    for line in lines:
        if not line or re.fullmatch(r"[|:\- ]+", line):
            continue
        if line.count("|") >= 2:
            cells = [cell.strip() for cell in line.strip("|").split("|") if cell.strip()]
            if cells:
                if table_headers is None:
                    table_headers = cells
                else:
                    pairs = [f"{header} : {cell}" for header, cell in zip(table_headers, cells)]
                    normalised.append(". ".join(pairs) + ".")
            continue
        table_headers = None
        line = _MARKDOWN_LINK.sub(r"\1 (\2)", line)
        line = _MARKDOWN_DECORATION.sub("", line)
        normalised.append(line)
    return re.sub(r"\s+", " ", " ".join(normalised)).strip()
