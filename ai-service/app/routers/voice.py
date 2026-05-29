from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.interview_answer import InterviewAnswer
from app.services.voice_processor import transcribe_audio
from app.services.answer_evaluator import evaluate_answer

router = APIRouter()


@router.post("/transcribe/{session_id}")
async def transcribe_and_evaluate(
    session_id: str,
    question_id: str = Form(...),
    audio: UploadFile = File(...),
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
            InterviewQuestion.id == question_id,
            InterviewQuestion.session_id == session_id,
        )
    )
    question = q_res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    audio_bytes = await audio.read()
    content_type = audio.content_type or "audio/webm"
    fmt = "webm" if "webm" in content_type else "wav"

    transcription = await transcribe_audio(audio_bytes, fmt)
    transcript = transcription.get("transcript", "")

    if not transcript.strip():
        return {"transcript": "", "score": 0, "feedback_positive": [], "feedback_improve": ["No speech detected. Please try again."]}

    feedback = await evaluate_answer(
        question.question_text,
        transcript,
        question.expected_focus or "",
        session.role_title,
        session.interview_type,
    )

    answer = InterviewAnswer(
        session_id=session_id,
        question_id=question_id,
        answer_text=transcript,
        transcript=transcript,
        score=feedback.get("score"),
        rubric_scores=feedback.get("rubric_scores"),
        feedback_positive=feedback.get("feedback_positive"),
        feedback_improve=feedback.get("feedback_improve"),
        model_answer_hint=feedback.get("model_answer_hint"),
    )
    db.add(answer)
    await db.flush()

    return {
        "transcript": transcript,
        "language": transcription.get("language"),
        **feedback,
    }
