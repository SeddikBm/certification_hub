"""Create retrieval-ready, plain-text sections from certification web pages."""
from __future__ import annotations

import re
import logging
from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError
from app.services.llm.nvidia_client import NvidiaChatClient

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu es un expert en ingénierie de données RAG pour CertificationHub.
Ton rôle est d'analyser les métadonnées du catalogue et le contenu des pages web pour produire des sections thématiques structurées, claires et indépendantes pour la base vectorielle.

Produis les sections suivantes (si les informations sont disponibles) :
1. "Description & Objectifs" : Vue d'ensemble, but de la certification, public cible.
2. "Compétences & Domaines évalués" : Liste détaillée des connaissances et compétences testées.
3. "Prérequis & Recommandations" : Expérience requise, certifications préalables, niveau de difficulté.
4. "Format de l'Examen & Modalités" : Durée, nombre de questions, type de questions (QCM, lab), score de passage, langue.
5. "Préparation & Formation" : Cours recommandés, temps de préparation estimé, ressources et liens de formation.
6. "Informations Pratiques & Tarifs" : Coût de l'examen (USD/MAD), coût formation, durée de validité, fournisseur (AWS, Microsoft, etc.), liens officiels.

Règles strictes :
- Réponds UNIQUEMENT avec un objet JSON au format suivant :
{
  "sections": [
    {"title": "Description & Objectifs", "content": "..."},
    {"title": "Compétences & Domaines évalués", "content": "..."},
    {"title": "Prérequis & Recommandations", "content": "..."},
    {"title": "Format de l'Examen & Modalités", "content": "..."},
    {"title": "Préparation & Formation", "content": "..."},
    {"title": "Informations Pratiques & Tarifs", "content": "..."}
  ]
}
- Chaque section `content` doit être du texte brut clair, dense et informatif (pas de Markdown complexe, pas de tableaux HTML).
- Intègre impérativement toutes les données chiffrées du catalogue (coût, validité, heures de préparation, squad, priorité).
- Ne crée pas de section vide ou redondante."""

_MARKDOWN_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_MARKDOWN_DECORATION = re.compile(r"[*_`>#]+")


@dataclass(frozen=True)
class SyllabusSection:
    title: str
    content: str


class SyllabusSummarizer:
    def __init__(self, client: NvidiaChatClient | None = None) -> None:
        self._client = client or NvidiaChatClient()

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

        logger.info("[INGESTION][SUMMARIZER] Sending payload to LLM (%s) for '%s' (input chars: %d)...",
                    settings.RAG_LLM_MODEL, certification_title, sum(len(p) for p in parts))

        try:
            payload = self._client.chat_json(
                system=_SYSTEM_PROMPT,
                user="\n\n".join(parts),
                model=settings.RAG_LLM_MODEL,
            )
            sections = _sections_from_payload(payload)
            if sections:
                logger.info("[INGESTION][SUMMARIZER] LLM generated %d section(s) for '%s': %s",
                            len(sections), certification_title, [s.title for s in sections])
                for idx, s in enumerate(sections, 1):
                    logger.info("[INGESTION][SECTION %d/%d] '%s' (%d chars): %s...",
                                idx, len(sections), s.title, len(s.content), s.content[:150])
                return sections
        except (LLMCallError, LLMResponseParsingError, ValueError) as exc:
            # Every catalogue certification stays indexable even if an
            # external provider or model endpoint is temporarily unavailable.
            logger.warning("[INGESTION][SECTIONS] Structured model output unavailable; using fallback: %s", exc)

        fallback = _fallback_sections(metadata_context, content_a, content_b)
        logger.info("[INGESTION][SECTIONS] Fallback produced %d section(s) for '%s'", len(fallback), certification_title)
        for idx, s in enumerate(fallback, 1):
            logger.info("[INGESTION][FALLBACK-SECTION %d/%d] '%s' (%d chars): %s...",
                        idx, len(fallback), s.title, len(s.content), s.content[:150])
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
