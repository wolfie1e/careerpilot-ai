import pytest
from pydantic import ValidationError

from app.schemas.interview import CreateSessionRequest


def test_create_session_accepts_valid_payload():
    payload = CreateSessionRequest(
        role_title="Backend Engineer",
        question_count=5,
        difficulty="advanced",
        interview_type="technical",
        session_mode="text",
    )

    assert payload.role_title == "Backend Engineer"
    assert payload.question_count == 5


def test_create_session_rejects_empty_role():
    with pytest.raises(ValidationError):
        CreateSessionRequest(role_title="", question_count=5)


def test_create_session_rejects_too_many_questions():
    with pytest.raises(ValidationError):
        CreateSessionRequest(role_title="Backend Engineer", question_count=25)


def test_create_session_rejects_zero_questions():
    with pytest.raises(ValidationError):
        CreateSessionRequest(role_title="Backend Engineer", question_count=0)
