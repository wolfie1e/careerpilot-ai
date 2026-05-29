"""Interview answer evaluation with STAR rubric scoring."""
from app.services.llm_client import complete_json

_SYSTEM = """You are an expert interviewer who evaluates answers using structured rubrics.
Be specific in your feedback — cite exact phrases from the candidate's answer."""

_TMPL = """Evaluate this interview answer for a {role} {interview_type} interview.

Question: {question}
Expected focus: {expected_focus}
Candidate's answer: {answer}

Return JSON:
{{
  "score": <overall 0-100>,
  "rubric_scores": {{
    "situation_clarity": <0-20>,
    "task_definition": <0-20>,
    "action_specificity": <0-20>,
    "result_quantification": <0-20>,
    "role_relevance": <0-20>
  }},
  "feedback_positive": ["<specific strength from the answer>", ...],
  "feedback_improve": ["<specific improvement with example>", ...],
  "model_answer_hint": "<paragraph outline of an ideal answer>"
}}

Scoring guide:
- 90-100: Exceptional STAR structure with quantified results
- 75-89: Good, clear structure with some metrics
- 60-74: Adequate but lacks specifics
- Below 60: Missing structure or key content

feedback_positive: 2-3 items
feedback_improve: 2-3 items (specific, not generic)"""


async def evaluate_answer(
    question: str,
    answer: str,
    expected_focus: str,
    role: str = "software engineer",
    interview_type: str = "behavioral",
) -> dict:
    user = _TMPL.format(
        role=role,
        interview_type=interview_type,
        question=question,
        expected_focus=expected_focus or "demonstrate relevant experience and problem-solving",
        answer=answer[:3000],
    )
    return await complete_json(_SYSTEM, user)


async def generate_session_summary(answers: list[dict], role: str) -> dict:
    """Generate overall session summary from all answers."""
    scores = [a.get("score", 0) for a in answers if a.get("score")]
    if not scores:
        return {"avg_score": 0, "summary": "No answers evaluated.", "readiness_level": "Not assessed"}

    avg = sum(scores) / len(scores)
    best = max(scores)
    worst = min(scores)

    if avg >= 85:
        readiness = "Interview Ready"
    elif avg >= 70:
        readiness = "Almost Ready — Minor Polish Needed"
    elif avg >= 55:
        readiness = "Developing — More Practice Needed"
    else:
        readiness = "Early Stage — Focus on STAR Structure"

    return {
        "avg_score": round(avg),
        "best_score": best,
        "worst_score": worst,
        "readiness_level": readiness,
        "total_questions": len(answers),
    }
