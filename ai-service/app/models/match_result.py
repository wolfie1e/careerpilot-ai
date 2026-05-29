import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    jd_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    overall_score: Mapped[int | None] = mapped_column(SmallInteger)
    semantic_score: Mapped[float | None] = mapped_column(Float)
    keyword_score: Mapped[int | None] = mapped_column(SmallInteger)
    skills_matched: Mapped[list | None] = mapped_column(JSONB)
    skills_missing: Mapped[list | None] = mapped_column(JSONB)
    skills_critical: Mapped[list | None] = mapped_column(JSONB)
    learning_roadmap: Mapped[list | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
