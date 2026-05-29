"""AI resume section improvement service."""
from app.services.llm_client import complete_json

_SYSTEM = """You are a professional resume editor who transforms mediocre resume sections
into polished, ATS-optimized content. You maintain the candidate's authentic voice
while improving clarity, impact, and keyword coverage."""

_TMPL = """Improve this {section_name} section of a resume for a {role} role.

Current content:
{section_text}

Return JSON:
{{
  "improved_text": "<the rewritten section>",
  "changes_made": ["<change description>", ...],
  "keywords_added": ["<kw>", ...],
  "quality_before": <0-100>,
  "quality_after": <0-100>
}}

Requirements:
- Preserve all factual content (dates, company names, degrees)
- Strengthen action language and quantify where possible
- Add relevant ATS keywords for {role} roles
- Improve sentence variety and remove filler phrases"""


async def improve_section(
    section_name: str,
    section_text: str,
    target_role: str = "",
) -> dict:
    user = _TMPL.format(
        section_name=section_name,
        role=target_role or "software engineer",
        section_text=section_text[:3000],
    )
    return await complete_json(_SYSTEM, user)
