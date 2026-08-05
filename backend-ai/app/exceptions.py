"""
Domain exceptions for the validation engine.

Each maps to a specific failure mode in the pipeline so the API layer can
decide, per exception type, whether to fail the request (400/422/500) or —
more often, given this is a fraud-sensitive workflow — degrade gracefully
into a PENDING_REVIEW decision instead of losing the submission.
"""


class ValidationEngineError(Exception):
    """Base class for all engine errors."""


class UnsupportedFileTypeError(ValidationEngineError):
    """Uploaded file is neither a PDF nor a supported image format."""


class DocumentExtractionError(ValidationEngineError):
    """Native text extraction and OCR both failed to produce usable text."""


class LLMParsingError(ValidationEngineError):
    """The LLM failed to return a well-formed structured payload."""


class WebScrapingError(ValidationEngineError):
    """The web verification agent could not confirm data on the issuer site."""


class UntrustedDomainError(ValidationEngineError):
    """A URL was found but its domain is not on the trusted issuer allowlist."""
