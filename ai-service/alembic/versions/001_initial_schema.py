"""Initial schema: users, resumes, resume_analyses, job_descriptions, match_results

Revision ID: 001
Revises:
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column("plan", sa.String(20), server_default="free"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("is_verified", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_users_email", "users", ["email"])

    op.create_table(
        "resumes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("file_type", sa.String(10), nullable=False),
        sa.Column("file_size", sa.Integer),
        sa.Column("raw_text", sa.Text),
        sa.Column("parsed_sections", JSONB),
        sa.Column("word_count", sa.Integer),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_resumes_user_id", "resumes", ["user_id"])
    op.create_index("idx_resumes_created_at", "resumes", ["created_at"])

    op.create_table(
        "resume_analyses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("overall_score", sa.SmallInteger),
        sa.Column("section_scores", JSONB),
        sa.Column("strengths", JSONB),
        sa.Column("weaknesses", JSONB),
        sa.Column("suggestions", JSONB),
        sa.Column("keywords_found", JSONB),
        sa.Column("ats_score", sa.SmallInteger),
        sa.Column("ats_breakdown", JSONB),
        sa.Column("analysis_version", sa.String(10), server_default="1.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_resume_analyses_resume_id", "resume_analyses", ["resume_id"])
    op.create_index("idx_resume_analyses_user_id", "resume_analyses", ["user_id"])

    op.create_table(
        "job_descriptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255)),
        sa.Column("company", sa.String(255)),
        sa.Column("raw_text", sa.Text, nullable=False),
        sa.Column("parsed_skills", JSONB),
        sa.Column("parsed_keywords", JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_jd_user_id", "job_descriptions", ["user_id"])

    op.create_table(
        "match_results",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("jd_id", sa.String(36), sa.ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("overall_score", sa.SmallInteger),
        sa.Column("semantic_score", sa.Float),
        sa.Column("keyword_score", sa.SmallInteger),
        sa.Column("skills_matched", JSONB),
        sa.Column("skills_missing", JSONB),
        sa.Column("skills_critical", JSONB),
        sa.Column("learning_roadmap", JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_match_results_user_id", "match_results", ["user_id"])
    op.create_index("idx_match_results_resume_jd", "match_results", ["resume_id", "jd_id"])


def downgrade() -> None:
    op.drop_table("match_results")
    op.drop_table("job_descriptions")
    op.drop_table("resume_analyses")
    op.drop_table("resumes")
    op.drop_table("users")
