"""Portfolio project recommendation engine."""
from app.services.llm_client import complete_json

_SYSTEM = """You are a senior engineering mentor who designs practical, portfolio-worthy
projects that directly demonstrate skills valued by hiring managers."""

_TMPL = """Recommend {count} portfolio projects for a candidate targeting a {role} position.

Their missing skills (prioritize covering these): {missing_skills}
Their current skills: {current_skills}
Experience level: {level}

Return a JSON array:
[{{
  "title": "<project name>",
  "description": "<2-3 sentence description>",
  "tech_stack": ["<tech1>", "<tech2>", ...],
  "skills_demonstrated": ["<skill>", ...],
  "difficulty": "beginner|intermediate|advanced",
  "estimated_weeks": <integer>,
  "why_it_helps": "<one sentence — specific to {role} role>",
  "resume_bullet": "<ready-to-use resume bullet starting with a past-tense action verb>"
}}]

Make projects specific and realistic — not generic CRUD apps."""


async def recommend_projects(
    role: str,
    missing_skills: list[str],
    current_skills: list[str],
    level: str = "intermediate",
    count: int = 4,
) -> list[dict]:
    user = _TMPL.format(
        count=count,
        role=role or "software engineer",
        missing_skills=", ".join(missing_skills[:10]) or "general backend development",
        current_skills=", ".join(current_skills[:10]) or "python, javascript",
        level=level,
    )
    result = await complete_json(_SYSTEM, user)
    return result if isinstance(result, list) else []
