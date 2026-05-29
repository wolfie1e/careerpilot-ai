from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.resume_analysis import ResumeAnalysis
from app.models.interview_session import InterviewSession
from app.models.match_result import MatchResult

router = APIRouter()


@router.get("/overview")
async def overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ATS score trend
    ats_res = await db.execute(
        select(ResumeAnalysis.ats_score, ResumeAnalysis.created_at)
        .where(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.asc())
        .limit(20)
    )
    ats_trend = [
        {"date": str(r.created_at.date()), "score": r.ats_score}
        for r in ats_res.fetchall()
        if r.ats_score is not None
    ]

    # Interview score trend
    int_res = await db.execute(
        select(InterviewSession.overall_score, InterviewSession.created_at, InterviewSession.interview_type)
        .where(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "completed",
        )
        .order_by(InterviewSession.created_at.asc())
        .limit(20)
    )
    interview_sessions = int_res.fetchall()
    interview_trend = [
        {"date": str(s.created_at.date()), "score": s.overall_score}
        for s in interview_sessions
        if s.overall_score is not None
    ]

    avg_score_res = await db.execute(
        select(func.avg(InterviewSession.overall_score))
        .where(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "completed",
        )
    )
    avg_interview = avg_score_res.scalar()

    # Total counts
    total_resumes_res = await db.execute(
        select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.user_id == current_user.id)
    )
    total_interviews_res = await db.execute(
        select(func.count(InterviewSession.id)).where(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "completed",
        )
    )

    # Latest ATS score
    latest_ats = ats_trend[-1]["score"] if ats_trend else None

    # Match score trend
    match_res = await db.execute(
        select(MatchResult.overall_score, MatchResult.created_at)
        .where(MatchResult.user_id == current_user.id)
        .order_by(MatchResult.created_at.asc())
        .limit(20)
    )
    match_trend = [
        {"date": str(r.created_at.date()), "score": r.overall_score}
        for r in match_res.fetchall()
        if r.overall_score is not None
    ]

    return {
        "latest_ats_score": latest_ats,
        "avg_interview_score": round(avg_interview) if avg_interview else None,
        "total_resumes_analyzed": total_resumes_res.scalar() or 0,
        "total_interviews": total_interviews_res.scalar() or 0,
        "ats_trend": ats_trend,
        "interview_trend": interview_trend,
        "match_trend": match_trend,
    }
