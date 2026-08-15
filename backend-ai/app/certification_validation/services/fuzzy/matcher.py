"""
Fuzzy comparison logic — step 5 in the diagram ("Calcule les distances,
Nom à 96%, Titre à 100%").

rapidfuzz is used instead of hand-rolled Levenshtein because it's a C++
implementation (10-100x faster than pure-Python difflib).

Names and titles are deliberately scored differently, not with the same
generic "fuzzy ratio":

- A person's NAME is free text, transcribed by OCR from handwriting-like
  serif fonts, sometimes with a missing middle name or reordered words
  ("Karim Alaoui" vs "Alaoui Karim" is a legitimate variation). It needs
  real tolerance: token_sort_ratio (order-insensitive) on accent-stripped,
  casefolded text.

- A certification TITLE is not free text — it's one exact string out of a
  finite, issuer-defined catalog ("AZ-204", "Python for Data Science, AI &
  Development"...). Word order is never legitimately different, so an
  order-sensitive ratio is the right tool, not token_sort_ratio. The only
  genuine noise here is formatting divergence between two independent
  systems describing the same course (Devoteam's catalog vs the issuer's
  exact wording) — "&" vs "and", a missing comma, different casing — which
  is why titles get punctuation stripped before comparison, on top of the
  accent/case normalization names already get.

Dates are NOT compared as text/fuzzy at all — see score_date_field, which
takes actual `date` objects and does date arithmetic, not string similarity.
That's intentional: an issue date is already a fully systematized value by
the time it reaches this function (the LLM parser normalises it to
YYYY-MM-DD upstream), so there's nothing "fuzzy" left to compare.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date

from rapidfuzz import fuzz

from app.core.config import settings
from app.schemas.validation import ExpectedInfo, FieldScores, ParsedCertificate

# Weights for the overall score. Name and title matter far more than the
# date for fraud detection — a wrong date alone is usually a typo, a wrong
# name or title is the whole point of the check.
_WEIGHTS = {"name": 0.45, "title": 0.45, "date": 0.10}

_PUNCTUATION_RE = re.compile(r"[^\w\s]")
_AMPERSAND_RE = re.compile(r"\s*&\s*")


def _strip_accents_and_casefold(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    without_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return without_accents.casefold()


def _normalize_name(text: str | None) -> str:
    """Casefold + strip accents, so 'Aláoui' and 'alaoui' compare equal."""
    if not text:
        return ""
    return " ".join(_strip_accents_and_casefold(text).split())


def _normalize_title(text: str | None) -> str:
    """
    More aggressive than name normalization: a course/cert title is a fixed
    catalog string, so the only tolerable differences are pure formatting
    ("&" vs "and", punctuation, whitespace) — never a genuinely different word.
    """
    if not text:
        return ""
    normalized = _strip_accents_and_casefold(text)
    normalized = _AMPERSAND_RE.sub(" and ", normalized)
    normalized = _PUNCTUATION_RE.sub(" ", normalized)
    return " ".join(normalized.split())


def score_name_field(expected: str | None, actual: str | None) -> float:
    if not expected or not actual:
        return 0.0
    ratio = fuzz.token_sort_ratio(_normalize_name(expected), _normalize_name(actual))
    score = round(ratio / 100, 4)
    # Seuil strict pour le fuzzy matching du nom (score >= 90% / 0.90)
    if score < 0.90:
        return 0.0
    return score


def score_title_field(expected: str | None, actual: str | None) -> float:
    """
    Comparaison stricte du titre de la certification (pas de fuzzy ratio).
    Tolère uniquement la normalisation de casse, accents, et ponctuation.
    """
    if not expected or not actual:
        return 0.0

    norm_expected = _normalize_title(expected)
    norm_actual = _normalize_title(actual)

    if not norm_expected or not norm_actual:
        return 0.0

    # Comparaison stricte exacte ou inclusion stricte de chaîne
    if norm_expected == norm_actual or norm_expected in norm_actual or norm_actual in norm_expected:
        return 1.0

    return 0.0


def score_date_field(
    expected_date: date | None, actual: date | None
) -> float:
    """
    Comparaison stricte exacte de la date (date BDD == date certificat).
    """
    if expected_date is None or actual is None:
        return 0.0

    # Strict equality comparison
    if actual == expected_date:
        return 1.0

    return 0.0





def compute_scores(expected: ExpectedInfo, actual: ParsedCertificate) -> FieldScores:
    exp_date = getattr(expected, "expected_date", None) or getattr(expected, "expected_not_before", None)
    name_score = score_name_field(expected.expected_name, actual.holder_name)
    title_score = score_title_field(expected.expected_certification_title, actual.certification_title)
    date_score = score_date_field(exp_date, actual.issue_date)

    overall = (
        _WEIGHTS["name"] * name_score
        + _WEIGHTS["title"] * title_score
        + _WEIGHTS["date"] * date_score
    )

    return FieldScores(
        name_score=name_score,
        title_score=title_score,
        date_score=date_score,
        overall_score=round(overall, 4),
    )


