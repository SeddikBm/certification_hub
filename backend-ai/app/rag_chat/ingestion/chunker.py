"""
Chunking strategy for syllabus/course content — see README benchmark for
the reasoning behind each choice.

1. Structure-aware first: split on Markdown/HTML headers, since syllabus
   pages are naturally sectioned ("Compétences évaluées", "Prérequis",
   modules...) — splitting on structure beats a blind fixed-size cut for
   content that already has clear boundaries.
2. Contextualize every chunk before it's embedded: prefix with the
   certification title + section name, so a chunk doesn't lose its
   identity once separated from its document — otherwise "understand
   storage services" from two different cloud certifications' syllabi
   becomes indistinguishable at retrieval time.
3. Recursive character fallback (CHUNK_SIZE_TOKENS, CHUNK_OVERLAP_RATIO)
   for any section still too long after step 1 — the well-validated
   default for content without further usable structure.

A rough 4-chars-per-token heuristic is used for the token-size fallback
rather than pulling in a full tokenizer here — good enough for chunking
decisions (not for anything the LLM actually pays for), keeps this module
dependency-light.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.core.config import settings
from app.rag_chat.ingestion.summarizer import SyllabusSection

_HEADER_RE = re.compile(r"^(#{1,4})\s+(.+)$", re.MULTILINE)
_CHARS_PER_TOKEN = 4  # rough heuristic, see module docstring


@dataclass
class Chunk:
    certification_title: str
    section: str | None
    text: str  # contextualized, ready to embed


def chunk_syllabus(certification_title: str, markdown_text: str) -> list[Chunk]:
    sections = _split_by_headers(markdown_text)
    chunks: list[Chunk] = []

    for section_title, section_text in sections:
        for piece in _recursive_split(section_text):
            contextualized = _contextualize(certification_title, section_title, piece)
            chunks.append(Chunk(certification_title=certification_title, section=section_title, text=contextualized))

    return chunks


def chunk_sections(certification_title: str, sections: list[SyllabusSection]) -> list[Chunk]:
    """Chunk structured plain text while retaining its section identity."""
    chunks: list[Chunk] = []
    for section in sections:
        for piece in _recursive_split(section.content):
            chunks.append(
                Chunk(
                    certification_title=certification_title,
                    section=section.title,
                    text=_contextualize(certification_title, section.title, piece),
                )
            )
    return chunks


def _split_by_headers(markdown_text: str) -> list[tuple[str | None, str]]:
    matches = list(_HEADER_RE.finditer(markdown_text))
    if not matches:
        return [(None, markdown_text.strip())] if markdown_text.strip() else []

    sections: list[tuple[str | None, str]] = []

    preamble = markdown_text[: matches[0].start()].strip()
    if preamble:
        sections.append((None, preamble))

    for i, match in enumerate(matches):
        title = match.group(2).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown_text)
        body = markdown_text[start:end].strip()
        if body:
            sections.append((title, body))

    return sections


def _recursive_split(text: str) -> list[str]:
    max_chars = settings.CHUNK_SIZE_TOKENS * _CHARS_PER_TOKEN
    overlap_chars = int(max_chars * settings.CHUNK_OVERLAP_RATIO)

    if len(text) <= max_chars:
        return [text]

    # Recursive character splitting: try paragraph breaks first, then
    # sentence breaks, then a hard cut — same "try the most natural
    # boundary first" idea as LangChain's RecursiveCharacterTextSplitter,
    # kept dependency-free here since the logic is short.
    pieces: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            # back up to the last paragraph or sentence boundary within the window
            boundary = text.rfind("\n\n", start, end)
            if boundary == -1:
                boundary = text.rfind(". ", start, end)
            if boundary != -1 and boundary > start:
                end = boundary + 1
        pieces.append(text[start:end].strip())
        start = end - overlap_chars if end - overlap_chars > start else end

    return [p for p in pieces if p]


def _contextualize(certification_title: str, section_title: str | None, text: str) -> str:
    header = f"[{certification_title}" + (f" — {section_title}]" if section_title else "]")
    return f"{header}\n{text}"
