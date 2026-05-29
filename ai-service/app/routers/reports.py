from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.services.report_generator import generate_resume_report_pdf, generate_resume_report_markdown

router = APIRouter()


@router.get("/resume/{resume_id}")
async def resume_report(
    resume_id: str,
    format: str = Query("pdf", pattern="^(pdf|md)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = res.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    analysis_res = await db.execute(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.resume_id == resume_id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(1)
    )
    analysis = analysis_res.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found. Run analysis first.")

    data = {
        "filename": resume.filename,
        "overall_score": analysis.overall_score,
        "ats_score": analysis.ats_score,
        "section_scores": analysis.section_scores,
        "strengths": analysis.strengths,
        "weaknesses": analysis.weaknesses,
        "suggestions": analysis.suggestions,
        "ats_breakdown": analysis.ats_breakdown,
    }

    if format == "pdf":
        pdf_bytes = generate_resume_report_pdf(data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="resume-report.pdf"'},
        )

    md_text = generate_resume_report_markdown(data)
    return Response(
        content=md_text,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="resume-report.md"'},
    )
