"""Sentence-transformer embeddings stored in PostgreSQL via pgvector."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.config import settings
from app.utils.text_utils import chunk_text

if TYPE_CHECKING:
    pass

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()


async def store_embeddings(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    text: str,
) -> None:
    """Chunk text, embed, and upsert into embeddings table."""
    from app.models.embedding import Embedding

    # Remove old embeddings for this entity
    await db.execute(
        text("DELETE FROM embeddings WHERE entity_type = :et AND entity_id = :eid"),
        {"et": entity_type, "eid": entity_id},
    )

    chunks = chunk_text(text, chunk_size=300, overlap=50)
    embeddings = embed_texts(chunks)

    for i, (chunk, vec) in enumerate(zip(chunks, embeddings)):
        row = Embedding(
            id=str(uuid.uuid4()),
            entity_type=entity_type,
            entity_id=entity_id,
            chunk_index=i,
            chunk_text=chunk,
        )
        db.add(row)
        await db.flush()
        # Use raw SQL to set the vector column (pgvector type)
        vec_str = "[" + ",".join(str(v) for v in vec) + "]"
        await db.execute(
            text("UPDATE embeddings SET embedding = :vec::vector WHERE id = :id"),
            {"vec": vec_str, "id": row.id},
        )


async def compute_similarity(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    query_text: str,
) -> float:
    """Return average cosine similarity between query and stored embeddings."""
    query_embedding = embed_texts([query_text])[0]
    vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    result = await db.execute(
        text("""
            SELECT AVG(1 - (embedding <=> :vec::vector)) AS avg_similarity
            FROM embeddings
            WHERE entity_type = :et AND entity_id = :eid AND embedding IS NOT NULL
        """),
        {"vec": vec_str, "et": entity_type, "eid": entity_id},
    )
    row = result.fetchone()
    if row and row[0] is not None:
        return float(row[0])
    return 0.0
