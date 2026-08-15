"""
Domain exceptions for the RAG chat module (Module 1).

Mirrors the same philosophy as app.certification_validation.exceptions:
each maps to a specific failure mode so the API layer can decide, per
exception type, how to degrade — and, just as importantly, so server logs
and the final answer's metadata can say *which* stage failed (embedding,
SQL generation, retrieval, generation, groundedness) without guessing.
"""


class RagChatError(Exception):
    """Base class for all Module 1 errors."""


class EmbeddingError(RagChatError):
    """The embedding model failed to encode a query or a document chunk."""


class SqlGenerationError(RagChatError):
    """The LLM failed to produce a usable SQL query."""


class SqlGuardrailViolation(RagChatError):
    """Generated SQL was rejected by the guardrail (not a single scoped SELECT)."""


class SqlExecutionError(RagChatError):
    """The (already-validated, already-scoped) SQL failed to execute against Postgres."""


class VectorSearchError(RagChatError):
    """The vector store query itself failed (connection, malformed query...)."""


class ScrapingError(RagChatError):
    """The live web-scraping fallback failed to retrieve usable content."""


class ResponseGenerationError(RagChatError):
    """The LLM failed to synthesise a final response from the retrieved context."""
