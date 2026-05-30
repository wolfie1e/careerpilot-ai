from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.schemas.resume import ResumeListItem, ResumeResponse
from app.services.resume_parser import extract_sections, parse_contact_info, parse_file
from app.utils.file_utils import save_upload
from app.utils.text_utils import count_words

router = APIRouter()


@router.post("/upload", response_model=ResumeResponse, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_path, file_type, file_size = await save_upload(file)
    raw_text = parse_file(file_path)
    sections = extract_sections(raw_text)
    contact = parse_contact_info(raw_text)
    if "contact" not in sections:
        sections["contact"] = contact

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename or "resume",
        file_type=file_type,
        file_size=file_size,
        raw_text=raw_text,
        parsed_sections=sections,
        word_count=count_words(raw_text),
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


@router.get("/", response_model=list[ResumeListItem])
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id, Resume.is_active == True)
        .order_by(Resume.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume.is_active = False
    await db.flush()


@router.get("/{resume_id}/analyses")
async def get_resume_analyses(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resume not found")

    analyses_res = await db.execute(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.resume_id == resume_id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(10)
    )
    analyses = analyses_res.scalars().all()
    return [
        {
            "id": a.id,
            "overall_score": a.overall_score,
            "ats_score": a.ats_score,
            "section_scores": a.section_scores,
            "strengths": a.strengths,
            "weaknesses": a.weaknesses,
            "suggestions": a.suggestions,
            "ats_breakdown": a.ats_breakdown,
            "created_at": a.created_at,
        }
        for a in analyses
    ]
