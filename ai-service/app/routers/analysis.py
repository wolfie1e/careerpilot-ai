from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.services.resume_analyzer import analyze_resume
from app.services.ats_scorer import compute_ats_score
from app.services.bullet_rewriter import rewrite_bullet, rewrite_bullets_batch
from app.services.section_improver import improve_section
from app.services.project_recommender import recommend_projects
from app.utils.skill_taxonomy import extract_skills_from_text

router = APIRouter()


async def _get_resume_or_404(resume_id: str, user_id: str, db: AsyncSession) -> Resume:
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.post("/{resume_id}/analyze")
async def analyze(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = await _get_resume_or_404(resume_id, current_user.id, db)
    result = await analyze_resume(resume.raw_text or "", "")
    ats = compute_ats_score(resume.raw_text or "", resume.parsed_sections or {})

    analysis = ResumeAnalysis(
        resume_id=resume.id,
        user_id=current_user.id,
        overall_score=result.get("overall_score"),
        section_scores=result.get("section_scores"),
        strengths=result.get("strengths"),
        weaknesses=result.get("weaknesses"),
        suggestions=result.get("suggestions"),
        keywords_found=result.get("keywords_found"),
        ats_score=ats["ats_score"],
        ats_breakdown=ats["breakdown"],
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)
    return {
        "id": analysis.id,
        "overall_score": analysis.overall_score,
        "section_scores": analysis.section_scores,
        "strengths": analysis.strengths,
        "weaknesses": analysis.weaknesses,
        "suggestions": analysis.suggestions,
        "ats_score": analysis.ats_score,
        "ats_breakdown": analysis.ats_breakdown,
    }


@router.post("/{resume_id}/ats")
async def ats_score(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = await _get_resume_or_404(resume_id, current_user.id, db)
    return compute_ats_score(resume.raw_text or "", resume.parsed_sections or {})


class BulletRewriteRequest(BaseModel):
    bullet: str
    bullets: list[str] | None = None
    target_role: str = ""
    keywords: list[str] | None = None


@router.post("/{resume_id}/rewrite")
async def rewrite(
    resume_id: str,
    body: BulletRewriteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_resume_or_404(resume_id, current_user.id, db)
    if body.bullets:
        return await rewrite_bullets_batch(body.bullets, body.target_role, body.keywords)
    return await rewrite_bullet(body.bullet, body.target_role, body.keywords)


class SectionImproveRequest(BaseModel):
    section_name: str
    section_text: str
    target_role: str = ""


@router.post("/{resume_id}/improve")
async def improve(
    resume_id: str,
    body: SectionImproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_resume_or_404(resume_id, current_user.id, db)
    return await improve_section(body.section_name, body.section_text, body.target_role)


class ProjectsRequest(BaseModel):
    target_role: str
    missing_skills: list[str] | None = None
    level: str = "intermediate"


@router.post("/{resume_id}/projects")
async def projects(
    resume_id: str,
    body: ProjectsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = await _get_resume_or_404(resume_id, current_user.id, db)
    current_skills = extract_skills_from_text(resume.raw_text or "")
    return await recommend_projects(
        body.target_role,
        body.missing_skills or [],
        current_skills,
        body.level,
    )
