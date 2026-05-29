"""Resume-JD matching using pgvector similarity + keyword overlap."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.embedding_service import compute_similarity, store_embeddings
from app.utils.skill_taxonomy import extract_skills_from_text


async def match_resume_to_jd(
    db: AsyncSession,
    resume_id: str,
    resume_text: str,
    jd_id: str,
    jd_text: str,
) -> dict:
    """Compute semantic + keyword match score between resume and JD."""

    # Ensure JD is embedded
    await store_embeddings(db, "job_description", jd_id, jd_text)

    # Semantic similarity: JD embedding vs resume text as query
    semantic_score = await compute_similarity(db, "job_description", jd_id, resume_text[:3000])
    semantic_score = max(0.0, min(1.0, semantic_score))

    # Keyword overlap
    resume_skills = set(extract_skills_from_text(resume_text))
    jd_skills = set(extract_skills_from_text(jd_text))

    skills_matched = sorted(resume_skills & jd_skills)
    skills_missing = sorted(jd_skills - resume_skills)
    skills_critical = _mark_critical(skills_missing, jd_text)

    keyword_score = len(skills_matched) / max(len(jd_skills), 1)

    overall = int((semantic_score * 0.6 + keyword_score * 0.4) * 100)
    overall = max(0, min(100, overall))

    return {
        "overall_score": overall,
        "semantic_score": round(semantic_score, 4),
        "keyword_score": round(keyword_score * 100),
        "skills_matched": skills_matched,
        "skills_missing": skills_missing,
        "skills_critical": skills_critical,
    }


def _mark_critical(missing: list[str], jd_text: str) -> list[str]:
    """Skills mentioned multiple times in JD are marked critical."""
    jd_lower = jd_text.lower()
    critical = []
    for skill in missing:
        if jd_lower.count(skill) >= 2:
            critical.append(skill)
    return critical
