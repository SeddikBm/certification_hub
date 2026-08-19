"""
Node: web_scrape_node — live fallback when cached knowledge is insufficient.

Fetches BOTH official_url (Udemy/Devoteam Learning — course content)
and exam_provider_url (official exam portal — format, domains, prerequisites),
then merges + deduplicates them with a focused LLM call before passing
the clean summary to generate_node.

Why deduplicate here, not in generate_node?
  The response generator already has a strict system prompt telling it to answer
  only from context. If we feed it two raw HTML-stripped blobs with duplicated
  content, the same info appears twice — the generator can't merge it, it just
  echoes it. A single focused summary call here costs one extra LLM call
  (same approach as ingestion-time summarizer) but makes the downstream
  context much cleaner: no duplicate sections, no repeated prerequisite lists.
"""
from __future__ import annotations
import logging
import psycopg
from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import ScrapingError
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.scraper.web_scraper import fetch_live_content
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

logger = logging.getLogger(__name__)

_MERGE_SYSTEM_PROMPT = """Tu reçois le contenu brut de deux pages web sur une certification informatique.
SOURCE A : page de formation (Udemy / Devoteam Learning) — modules, durée, contenu.
SOURCE B : portail officiel de l'examen — format, domaines, score de passage, prérequis.

Fusionne les deux en un résumé Markdown structuré, SANS DUPLICATION.
Si une information apparaît dans les deux sources, garde-la une seule fois.
Ignore : navigation, publicités, avis utilisateurs, éléments de paiement.
Omets les sections pour lesquelles tu n'as aucune donnée.

Structure de sortie :
## Description
## Compétences et domaines évalués
## Prérequis
## Format de l'examen
## Préparation recommandée
## Liens officiels

Réponds UNIQUEMENT avec le contenu Markdown, sans explication préliminaire."""


def web_scrape_node(state: GraphState) -> dict:
    chunks = state.get("vector_chunks", [])
    reasons = state.get("reasons", [])

    cert_id = chunks[0].certification_id if chunks else None
    cert_title = chunks[0].certification_title if chunks else "cette certification"
    if not cert_id:
        return {"scraped_content": None, "scrape_error": "No certification_id.",
                "reasons": [*reasons, "[SCRAPING] Skipped: no certification_id."]}

    official_url, exam_url = _get_urls(str(cert_id))
    if not official_url and not exam_url:
        return {"scraped_content": None, "scrape_error": "No URLs in DB.",
                "reasons": [*reasons, "[SCRAPING] Skipped: no URLs in DB."]}

    # --- Scrape both URLs -----------------------------------------------
    content_a, content_b = "", ""
    urls_scraped: list[str] = []
    for url, label, dest in [
        (official_url, "official_url", "a"),
        (exam_url, "exam_provider_url", "b"),
    ]:
        if not url:
            continue
        try:
            content = fetch_live_content(url)
            if dest == "a":
                content_a = content
            else:
                content_b = content
            urls_scraped.append(label)
            logger.info("[SCRAPING] %d chars from %s (%s)", len(content), url, label)
        except ScrapingError as exc:
            logger.warning("[SCRAPING] Failed %s %s: %s", label, url, exc)

    if not content_a and not content_b:
        return {"scraped_content": None, "scrape_error": "All URLs failed.",
                "reasons": [*reasons, "[SCRAPING] All URLs failed."]}

    # --- LLM merge + deduplication ---------------------------------------
    merged = _merge_with_llm(cert_title, content_a, content_b)

    return {
        "scraped_content": merged,
        "scrape_error": None,
        "reasons": [*reasons, f"[SCRAPING] Merged {len(urls_scraped)} URL(s): {', '.join(urls_scraped)}"],
    }


def _merge_with_llm(cert_title: str, content_a: str, content_b: str) -> str:
    """
    Uses the same cheap LLM call pattern as SyllabusSummarizer to merge
    two raw scraped texts into a clean, deduplicated Markdown summary.
    Falls back to simple concatenation if the LLM call fails.
    """
    parts = [f"Certification : {cert_title}"]
    if content_a.strip():
        parts.append(f"SOURCE A (page de formation) :\n{content_a[:6000]}")
    if content_b.strip():
        parts.append(f"SOURCE B (portail officiel) :\n{content_b[:6000]}")

    try:
        return OpenRouterChatClient().chat(
            system=_MERGE_SYSTEM_PROMPT,
            user="\n\n".join(parts),
            model=settings.RAG_LLM_MODEL,
        ).strip()
    except LLMCallError as exc:
        logger.warning("[SCRAPING] LLM merge failed (%s). Using raw concatenation.", exc)
        # Graceful fallback: raw concat is still better than nothing
        return "\n\n".join(p for p in [content_a, content_b] if p.strip())


def _get_urls(certification_id: str) -> tuple[str, str]:
    try:
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT official_url, exam_provider_url FROM certifications WHERE id=%s::uuid",
                (certification_id,))
            row = cur.fetchone()
            if row:
                return row[0] or "", row[1] or ""
    except Exception as exc:
        logger.warning("[SCRAPING] DB lookup failed: %s", exc)
    return "", ""
