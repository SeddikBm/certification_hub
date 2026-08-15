"""
Shared, infrastructure-level exceptions.

These are raised by shared services (app/services/*) that both
app.certification_validation and app.rag_chat build on. Each module wraps
these into its own domain-specific exception types where it wants a more
precise name for its own error taxonomy (e.g.
certification_validation.exceptions.LLMParsingError) — but the underlying
"the Groq call itself failed" vs "the LLM answered with garbage" distinction
is shared, since it's the same Groq client either way.
"""


class AIServiceError(Exception):
    """Base class for every error raised by this service."""


class LLMCallError(AIServiceError):
    """The LLM API call itself failed: network, auth, rate limit, model retired, timeout..."""


class LLMResponseParsingError(AIServiceError):
    """The LLM responded, but the content wasn't usable (e.g. malformed JSON in JSON mode)."""
