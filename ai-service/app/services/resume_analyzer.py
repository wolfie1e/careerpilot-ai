"""LLM-powered resume quality analysis."""
from app.services.llm_client import complete_json

_SYSTEM = """You are an expert resume reviewer and hiring manager with 15 years of experience
in talent acquisition across software engineering, product, and data science roles.
Provide specific, actionable feedback — never vague platitudes."""

_USER_TMPL = """Analyze this resume and return a JSON object with this exact schema:
{{
  "overall_score": <integer 0-100>,
  "section_scores": {{
    "contact": <0-100>,
    "summary": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "skills": <0-100>,
    "projects": <0-100>
  }},
  "strengths": ["<specific strength>", ...],
  "weaknesses": ["<specific weakness>", ...],
  "suggestions": [
    {{"section": "<name>", "type": "missing|weak|improve", "message": "<actionable>", "priority": "high|medium|low"}}
  ],
  "keywords_found": ["<keyword>", ...]
}}

Rules:
- 3-5 items in strengths and weaknesses (specific, not generic)
- 3-7 suggestions ordered by priority
- keywords_found: list technical terms detected in the resume

Resume text:
{resume_text}

Target role (optional): {target_role}"""


async def analyze_resume(resume_text: str, target_role: str = "") -> dict:
    user = _USER_TMPL.format(
        resume_text=resume_text[:6000],
        target_role=target_role or "general software engineering"
    )
    return await complete_json(_SYSTEM, user)
