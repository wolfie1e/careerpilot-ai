from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.dependencies import get_current_user
from app.main import limiter
from app.models.user import User
from app.models.resume import Resume
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.interview_answer import InterviewAnswer
from app.schemas.interview import AnswerRequest, CreateSessionRequest
from app.services.interview_generator import generate_questions
from app.services.answer_evaluator import evaluate_answer, generate_session_summary

router = APIRouter()


@router.post("/sessions", status_code=201)
@limiter.limit("10/minute")
async def create_session(
    request: Request,
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume_context = ""
    if body.resume_id:
        res = await db.execute(select(Resume).where(Resume.id == body.resume_id, Resume.user_id == current_user.id))
        resume = res.scalar_one_or_none()
        if resume and resume.raw_text:
            resume_context = resume.raw_text[:1500]

    questions_data = await generate_questions(
        body.role_title, body.difficulty, body.interview_type,
        body.question_count, resume_context
    )

    session = InterviewSession(
        user_id=current_user.id,
        resume_id=body.resume_id,
        jd_id=body.jd_id,
        role_title=body.role_title,
        difficulty=body.difficulty,
        interview_type=body.interview_type,
        session_mode=body.session_mode,
        question_count=len(questions_data),
    )
    db.add(session)
    await db.flush()

    question_objects = []
    for i, q in enumerate(questions_data):
        question = InterviewQuestion(
            session_id=session.id,
            question_number=i + 1,
            question_text=q.get("question_text", ""),
            question_type=q.get("question_type"),
            topic_area=q.get("topic_area"),
            expected_focus=q.get("expected_focus"),
        )
        db.add(question)
        question_objects.append(question)
    await db.flush()

    return {
        "session_id": session.id,
        "role_title": session.role_title,
        "difficulty": session.difficulty,
        "interview_type": session.interview_type,
        "question_count": session.question_count,
        "questions": [
            {
                "id": q.id,
                "number": q.question_number,
                "text": q.question_text,
                "type": q.question_type,
                "topic": q.topic_area,
            }
            for q in question_objects
        ],
    }


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    q_res = await db.execute(
        select(InterviewQuestion).where(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.question_number)
    )
    questions = q_res.scalars().all()

    a_res = await db.execute(
        select(InterviewAnswer).where(InterviewAnswer.session_id == session_id)
    )
    answers = {a.question_id: a for a in a_res.scalars().all()}

    return {
        "session": {
            "id": session.id,
            "role_title": session.role_title,
            "difficulty": session.difficulty,
            "interview_type": session.interview_type,
            "session_mode": session.session_mode,
            "status": session.status,
            "overall_score": session.overall_score,
            "summary": session.summary,
            "created_at": session.created_at,
        },
        "questions": [
            {
                "id": q.id,
                "number": q.question_number,
                "text": q.question_text,
                "type": q.question_type,
                "topic": q.topic_area,
                "answer": _format_answer(answers.get(q.id)),
            }
            for q in questions
        ],
    }


@router.post("/sessions/{session_id}/answer")
async def submit_answer(
    session_id: str,
    body: AnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    q_res = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.id == body.question_id,
            InterviewQuestion.session_id == session_id,
        )
    )
    question = q_res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    feedback = await evaluate_answer(
        question.question_text,
        body.answer_text,
        question.expected_focus or "",
        session.role_title,
        session.interview_type,
    )

    answer = InterviewAnswer(
        session_id=session_id,
        question_id=body.question_id,
        answer_text=body.answer_text,
        score=feedback.get("score"),
        rubric_scores=feedback.get("rubric_scores"),
        feedback_positive=feedback.get("feedback_positive"),
        feedback_improve=feedback.get("feedback_improve"),
        model_answer_hint=feedback.get("model_answer_hint"),
    )
    db.add(answer)

    await _maybe_complete_session(session, session_id, db)
    await db.flush()
    return feedback


@router.get("/history")
async def get_history(
    page: int = 1,
    difficulty: str | None = None,
    interview_type: str | None = None,
    session_mode: str | None = None,
    status: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * 20
    filters = [InterviewSession.user_id == current_user.id]
    if difficulty:
        filters.append(InterviewSession.difficulty == difficulty)
    if interview_type:
        filters.append(InterviewSession.interview_type == interview_type)
    if session_mode:
        filters.append(InterviewSession.session_mode == session_mode)
    if status:
        filters.append(InterviewSession.status == status)
    if search:
        filters.append(InterviewSession.role_title.ilike(f"%{search}%"))

    res = await db.execute(
        select(InterviewSession)
        .where(*filters)
        .order_by(InterviewSession.created_at.desc())
        .limit(20).offset(offset)
    )
    sessions = res.scalars().all()

    count_res = await db.execute(
        select(func.count()).where(*filters)
    )
    total = count_res.scalar() or 0

    return {
        "sessions": [
            {
                "id": s.id,
                "role_title": s.role_title,
                "difficulty": s.difficulty,
                "interview_type": s.interview_type,
                "session_mode": s.session_mode,
                "status": s.status,
                "overall_score": s.overall_score,
                "question_count": s.question_count,
                "created_at": s.created_at,
            }
            for s in sessions
        ],
        "total": total,
        "page": page,
        "pages": max(1, (total + 19) // 20),
    }


def _format_answer(answer: InterviewAnswer | None) -> dict | None:
    if not answer:
        return None
    return {
        "id": answer.id,
        "answer_text": answer.answer_text,
        "transcript": answer.transcript,
        "score": answer.score,
        "rubric_scores": answer.rubric_scores,
        "feedback_positive": answer.feedback_positive,
        "feedback_improve": answer.feedback_improve,
        "model_answer_hint": answer.model_answer_hint,
    }


async def _maybe_complete_session(session: InterviewSession, session_id: str, db: AsyncSession) -> None:
    # Flush first so the new answer being added is counted
    await db.flush()
    a_res = await db.execute(
        select(InterviewAnswer).where(InterviewAnswer.session_id == session_id)
    )
    answers_so_far = a_res.scalars().all()
    if len(answers_so_far) >= session.question_count:
        all_feedback = [{"score": a.score} for a in answers_so_far]
        summary_data = await generate_session_summary(all_feedback, session.role_title)
        session.status = "completed"
        session.overall_score = summary_data.get("avg_score")
        session.summary = summary_data.get("readiness_level")
        session.completed_at = datetime.now(timezone.utc)
