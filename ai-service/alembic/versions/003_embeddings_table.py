"""Add embeddings table with pgvector column

Revision ID: 003
Revises: 002
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE embeddings (
            id VARCHAR(36) PRIMARY KEY,
            entity_type VARCHAR(30) NOT NULL,
            entity_id VARCHAR(36) NOT NULL,
            chunk_index SMALLINT DEFAULT 0,
            chunk_text TEXT,
            embedding vector(384),
            model_name VARCHAR(100) DEFAULT 'all-MiniLM-L6-v2',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_embeddings_entity ON embeddings (entity_type, entity_id)")
    op.execute("""
        CREATE INDEX idx_embeddings_vector ON embeddings
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    """)


def downgrade() -> None:
    op.drop_table("embeddings")
