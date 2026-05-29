import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job_description import JobDescription
from app.models.match_result import MatchResult
from app.services.jd_matcher import match_resume_to_jd
from app.services.skill_gap import generate_skill_roadmap
from app.services.embedding_service import store_embeddings

router = APIRouter()


class MatchRequest(BaseModel):
    resume_id: str
    jd_text: str
    jd_title: str | None = None
    jd_company: str | None = None
    target_role: str | None = None


@router.post("/match")
async def match(
    body: MatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume).where(Resume.id == body.resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Save JD
    jd = JobDescription(
        user_id=current_user.id,
        title=body.jd_title,
        company=body.jd_company,
        raw_text=body.jd_text,
    )
    db.add(jd)
    await db.flush()

    # Embed resume (ensure fresh)
    await store_embeddings(db, "resume", resume.id, resume.raw_text or "")

    # Match
    match_data = await match_resume_to_jd(
        db, resume.id, resume.raw_text or "",
        jd.id, body.jd_text
    )

    # Learning roadmap
    roadmap = await generate_skill_roadmap(
        match_data["skills_critical"],
        [s for s in match_data["skills_missing"] if s not in match_data["skills_critical"]],
        match_data["skills_matched"],
        body.target_role or body.jd_title or "software engineer",
    )

    # Save match result
    mr = MatchResult(
        user_id=current_user.id,
        resume_id=resume.id,
        jd_id=jd.id,
        overall_score=match_data["overall_score"],
        semantic_score=match_data["semantic_score"],
        keyword_score=match_data["keyword_score"],
        skills_matched=match_data["skills_matched"],
        skills_missing=match_data["skills_missing"],
        skills_critical=match_data["skills_critical"],
        learning_roadmap=roadmap,
    )
    db.add(mr)
    await db.flush()

    return {
        "match_id": mr.id,
        "overall_score": mr.overall_score,
        "semantic_score": mr.semantic_score,
        "keyword_score": mr.keyword_score,
        "skills_matched": mr.skills_matched,
        "skills_missing": mr.skills_missing,
        "skills_critical": mr.skills_critical,
        "learning_roadmap": mr.learning_roadmap,
    }
