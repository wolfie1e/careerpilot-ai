"""Tests for ATS scoring (rule-based, no LLM required)."""
import pytest
from app.services.ats_scorer import compute_ats_score


STRONG_RESUME = """
Jane Engineer
jane@example.com | 555-000-1234 | linkedin.com/in/janeeng

SUMMARY
Software engineer with expertise in Python, React, and cloud systems.

EXPERIENCE
Senior Engineer — BigCorp (2020-Present)
- Developed distributed microservices using Python and Docker, reducing deployment time by 35%
- Built React dashboard serving 50,000+ daily active users with 99.9% uptime
- Optimized PostgreSQL queries improving response time by 60%
- Led 3-person team to migrate 200TB dataset to AWS S3

EDUCATION
BS Computer Science — State University (2020)

SKILLS
Python, JavaScript, React, Node.js, PostgreSQL, Redis, Docker, Kubernetes, AWS, Git

PROJECTS
Distributed Task Queue — Built async job processing system with Redis and FastAPI handling 1M jobs/day
"""

WEAK_RESUME = """
I worked at some company for a while.
Helped with projects.
Did coding stuff.
"""


def test_strong_resume_scores_high():
    result = compute_ats_score(STRONG_RESUME, {})
    assert result["ats_score"] >= 60, f"Expected >= 60, got {result['ats_score']}"


def test_weak_resume_scores_low():
    result = compute_ats_score(WEAK_RESUME, {})
    assert result["ats_score"] < 50, f"Expected < 50, got {result['ats_score']}"


def test_breakdown_has_seven_categories():
    result = compute_ats_score(STRONG_RESUME, {})
    breakdown = result["breakdown"]
    assert len(breakdown) == 7
    for key in ["section_presence", "keyword_density", "action_verbs", "quantification",
                "formatting", "contact_completeness", "length_compliance"]:
        assert key in breakdown, f"Missing category: {key}"


def test_breakdown_scores_in_valid_range():
    result = compute_ats_score(STRONG_RESUME, {})
    for key, val in result["breakdown"].items():
        assert 0 <= val <= 100, f"{key} score {val} out of range"


def test_missing_contact_reduces_score():
    no_contact = "EXPERIENCE\nDid things. EDUCATION\nDegree. SKILLS\nPython"
    result_no_contact = compute_ats_score(no_contact, {})
    assert result_no_contact["breakdown"]["contact_completeness"] < 50


def test_action_verbs_detected():
    with_verbs = STRONG_RESUME
    result = compute_ats_score(with_verbs, {})
    assert result["breakdown"]["action_verbs"] > 30


def test_quantification_detected():
    result = compute_ats_score(STRONG_RESUME, {})
    assert result["breakdown"]["quantification"] > 20


def test_overall_equals_weighted_sum():
    result = compute_ats_score(STRONG_RESUME, {})
    breakdown = result["breakdown"]
    weights = {
        "section_presence": 0.20, "keyword_density": 0.20, "action_verbs": 0.15,
        "quantification": 0.15, "formatting": 0.15, "contact_completeness": 0.10,
        "length_compliance": 0.05,
    }
    expected = int(sum(breakdown[k] * w for k, w in weights.items()))
    assert abs(result["ats_score"] - expected) <= 1
