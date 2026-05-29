"""Interview question generation service."""
from app.services.llm_client import complete_json

_SYSTEM = """You are a senior engineering interviewer at a top tech company.
You generate realistic, role-appropriate interview questions."""

_TMPL = """Generate exactly {count} interview questions for a {difficulty} {interview_type}
interview targeting a {role} position.

{resume_context}

Return a JSON array:
[{{
  "question_text": "<question>",
  "question_type": "behavioral|technical|situational|system_design|closing",
  "topic_area": "<topic>",
  "expected_focus": "<what a strong answer should demonstrate — 1-2 sentences>"
}}]

Rules:
- Behavioral: use "Tell me about a time..." or "Describe a situation..."
- Technical: reference specific technologies relevant to {role}
- Vary question types appropriately for {interview_type}
- Distribute difficulty: ~20% easy, ~60% medium, ~20% hard
- No duplicate topics"""


async def generate_questions(
    role: str,
    difficulty: str,
    interview_type: str,
    count: int = 5,
    resume_context: str = "",
) -> list[dict]:
    ctx = f"Resume context:\n{resume_context[:1500]}\n" if resume_context else ""
    user = _TMPL.format(
        count=count,
        difficulty=difficulty,
        interview_type=interview_type,
        role=role,
        resume_context=ctx,
    )
    result = await complete_json(_SYSTEM, user)
    return result if isinstance(result, list) else []
