"""Tests for JD matching and skill gap detection (no DB / LLM required)."""
import pytest
from app.utils.skill_taxonomy import extract_skills_from_text
from app.services.jd_matcher import _mark_critical


RESUME_TEXT = "Python Django PostgreSQL Docker AWS Git REST API React"
JD_TEXT = "Requirements: Python, Docker, Kubernetes, AWS, PostgreSQL, Terraform, CI/CD"


def test_extract_skills_finds_known_skills():
    skills = extract_skills_from_text(RESUME_TEXT)
    assert "python" in skills
    assert "docker" in skills
    assert "postgresql" in skills


def test_extract_skills_case_insensitive():
    skills = extract_skills_from_text("PYTHON REACT DOCKER")
    assert "python" in skills
    assert "react" in skills


def test_extract_skills_returns_no_dupes():
    skills = extract_skills_from_text("python python python")
    assert skills.count("python") == 1


def test_skill_gap_finds_missing():
    resume_skills = set(extract_skills_from_text(RESUME_TEXT))
    jd_skills = set(extract_skills_from_text(JD_TEXT))
    missing = jd_skills - resume_skills
    assert "kubernetes" in missing or "terraform" in missing


def test_mark_critical_identifies_repeated_skills():
    jd = "kubernetes kubernetes kubernetes is required for this role"
    critical = _mark_critical(["kubernetes", "docker"], jd)
    assert "kubernetes" in critical


def test_mark_critical_skips_non_repeated():
    jd = "kubernetes is mentioned once here"
    critical = _mark_critical(["kubernetes"], jd)
    assert "kubernetes" not in critical


def test_keyword_score_calculation():
    resume_skills = set(extract_skills_from_text(RESUME_TEXT))
    jd_skills = set(extract_skills_from_text(JD_TEXT))
    matched = resume_skills & jd_skills
    score = len(matched) / max(len(jd_skills), 1)
    assert 0.0 <= score <= 1.0
