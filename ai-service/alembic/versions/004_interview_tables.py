"""Add interview sessions, questions, and answers tables

Revision ID: 004
Revises: 003
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "interview_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("resumes.id", ondelete="SET NULL")),
        sa.Column("jd_id", sa.String(36), sa.ForeignKey("job_descriptions.id", ondelete="SET NULL")),
        sa.Column("role_title", sa.String(255), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False),
        sa.Column("interview_type", sa.String(30), nullable=False),
        sa.Column("session_mode", sa.String(10), nullable=False, server_default="text"),
        sa.Column("question_count", sa.SmallInteger, server_default="5"),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("overall_score", sa.SmallInteger),
        sa.Column("score_breakdown", JSONB),
        sa.Column("summary", sa.Text),
        sa.Column("duration_secs", sa.Integer),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_sessions_user_id", "interview_sessions", ["user_id"])
    op.create_index("idx_sessions_status", "interview_sessions", ["status"])
    op.create_index("idx_sessions_created_at", "interview_sessions", ["created_at"])

    op.create_table(
        "interview_questions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_number", sa.SmallInteger, nullable=False),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("question_type", sa.String(30)),
        sa.Column("topic_area", sa.String(100)),
        sa.Column("expected_focus", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_questions_session_id", "interview_questions", ["session_id"])

    op.create_table(
        "interview_answers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(36), sa.ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer_text", sa.Text),
        sa.Column("audio_url", sa.String(500)),
        sa.Column("transcript", sa.Text),
        sa.Column("score", sa.SmallInteger),
        sa.Column("rubric_scores", JSONB),
        sa.Column("feedback_positive", JSONB),
        sa.Column("feedback_improve", JSONB),
        sa.Column("model_answer_hint", sa.Text),
        sa.Column("response_time_secs", sa.Integer),
        sa.Column("answered_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_answers_session_id", "interview_answers", ["session_id"])
    op.create_index("idx_answers_question_id", "interview_answers", ["question_id"])


def downgrade() -> None:
    op.drop_table("interview_answers")
    op.drop_table("interview_questions")
    op.drop_table("interview_sessions")
