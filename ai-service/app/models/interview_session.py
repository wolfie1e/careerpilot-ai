import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"))
    jd_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("job_descriptions.id", ondelete="SET NULL"))
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    interview_type: Mapped[str] = mapped_column(String(30), nullable=False)
    session_mode: Mapped[str] = mapped_column(String(10), nullable=False, default="text")
    question_count: Mapped[int] = mapped_column(SmallInteger, default=5)
    status: Mapped[str] = mapped_column(String(20), default="active")
    overall_score: Mapped[int | None] = mapped_column(SmallInteger)
    score_breakdown: Mapped[dict | None] = mapped_column(JSONB)
    summary: Mapped[str | None] = mapped_column(Text)
    duration_secs: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped["User"] = relationship("User", back_populates="interview_sessions")
    questions: Mapped[list["InterviewQuestion"]] = relationship(
        "InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.question_number"
    )
    answers: Mapped[list["InterviewAnswer"]] = relationship(
        "InterviewAnswer", back_populates="session", cascade="all, delete-orphan"
    )
