"""Skill gap analysis with personalized learning roadmap generation."""
from app.services.llm_client import complete_json

_SYSTEM = "You are a senior engineering mentor who creates practical skill development roadmaps."

_ROADMAP_TMPL = """Generate a personalized learning roadmap for these missing skills for a {role} role.

Missing critical skills: {critical_skills}
Missing other skills: {other_skills}
Current skills: {current_skills}

Return a JSON array of roadmap items:
[{{
  "skill": "<skill name>",
  "priority": "critical|high|medium",
  "why_it_matters": "<one sentence>",
  "resources": ["<resource 1>", "<resource 2>"],
  "project_idea": "<one sentence project idea>",
  "weeks_to_learn": <integer 1-8>
}}]

Limit to 6 most important items. Be specific and practical."""


async def generate_skill_roadmap(
    missing_critical: list[str],
    missing_other: list[str],
    current_skills: list[str],
    role: str,
) -> list[dict]:
    if not missing_critical and not missing_other:
        return []

    user = _ROADMAP_TMPL.format(
        role=role or "software engineer",
        critical_skills=", ".join(missing_critical[:8]) or "none",
        other_skills=", ".join(missing_other[:8]) or "none",
        current_skills=", ".join(current_skills[:15]) or "general programming",
    )
    result = await complete_json(_SYSTEM, user)
    return result if isinstance(result, list) else []
