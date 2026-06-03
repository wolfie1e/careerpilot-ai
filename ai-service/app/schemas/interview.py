from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    role_title: str = Field(min_length=2, max_length=120)
    difficulty: str = "intermediate"
    interview_type: str = "behavioral"
    session_mode: str = "text"
    question_count: int = Field(default=5, ge=1, le=10)
    resume_id: str | None = None
    jd_id: str | None = None


class AnswerRequest(BaseModel):
    question_id: str
    answer_text: str = Field(min_length=1)
