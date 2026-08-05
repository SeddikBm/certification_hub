from datetime import date

from app.services.fuzzy.matcher import (
    compute_scores,
    score_date_field,
    score_name_field,
    score_title_field,
)


def test_score_name_field_exact_match_ignores_accents_and_case():
    assert score_name_field("Karim Alaoui", "karim alaoui") == 1.0
    assert score_name_field("Aláoui", "alaoui") == 1.0


def test_score_name_field_handles_word_order():
    # token_sort_ratio should score this very close to 1.0 despite reordering
    # — legitimate for a name (unlike a title, see below).
    assert score_name_field("Karim Alaoui", "Alaoui Karim") > 0.95


def test_score_name_field_empty_inputs_score_zero():
    assert score_name_field(None, "Karim Alaoui") == 0.0
    assert score_name_field("Karim Alaoui", None) == 0.0


def test_score_title_field_exact_match():
    assert score_title_field("AZ-204", "AZ-204") == 1.0


def test_score_title_field_ampersand_and_punctuation_are_formatting_noise():
    # Same real-world course, described slightly differently by two
    # independent systems — this must NOT be penalised.
    assert (
        score_title_field(
            "Python for Data Science, AI & Development",
            "Python for Data Science, AI and Development",
        )
        == 1.0
    )
    assert score_title_field("AI & ML Fundamentals", "AI and ML Fundamentals") == 1.0


def test_score_title_field_is_order_sensitive_unlike_name():
    # Word order swaps are never a legitimate title variation, so this
    # should score noticeably lower than the equivalent name-reorder case.
    reordered_title_score = score_title_field(
        "Data Science AI Development", "Development AI Data Science"
    )
    reordered_name_score = score_name_field("Karim Alaoui", "Alaoui Karim")
    assert reordered_title_score < reordered_name_score


def test_score_title_field_catches_a_genuinely_different_title():
    assert score_title_field("AZ-204", "AZ-900") < 0.9


def test_score_date_field_no_constraint():
    assert score_date_field(None, date(2026, 1, 1), tolerance_days=3) == 1.0


def test_score_date_field_unknown_actual_is_neutral():
    assert score_date_field(date(2026, 1, 1), None, tolerance_days=3) == 0.5


def test_score_date_field_within_tolerance():
    assert score_date_field(date(2026, 1, 5), date(2026, 1, 3), tolerance_days=3) == 1.0


def test_score_date_field_predates_assignment_is_hard_fail():
    assert score_date_field(date(2026, 1, 10), date(2025, 6, 1), tolerance_days=3) == 0.0


def test_compute_scores_matching_certificate(expected_info, matching_certificate):
    scores = compute_scores(expected_info, matching_certificate)
    assert scores.name_score == 1.0
    assert scores.title_score == 1.0
    assert scores.overall_score >= 0.95


def test_compute_scores_mismatched_certificate(expected_info, mismatched_certificate):
    scores = compute_scores(expected_info, mismatched_certificate)
    assert scores.name_score < 0.5
    assert scores.title_score < 0.7
    assert scores.overall_score < 0.60
