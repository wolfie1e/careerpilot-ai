"""AI resume bullet rewriting service."""
from app.services.llm_client import complete_json

_SYSTEM = """You are a professional resume writer specializing in software engineering
and technical roles. You write achievement-oriented bullets in STAR format.
Every bullet you write starts with a strong past-tense action verb."""

_SINGLE_TMPL = """Rewrite this resume bullet to maximize impact for a {role} position.

Requirements:
- Start with a strong past-tense action verb
- Include a quantifiable metric or realistic estimate (e.g. "~30% faster")
- Inject relevant keywords from this list where natural: {keywords}
- Keep under 25 words
- Sound authentic, not over-inflated

Return JSON:
{{
  "rewritten": "<the new bullet>",
  "impact_score": <0-100>,
  "keywords_added": ["<kw>", ...],
  "rationale": "<one sentence explanation>"
}}

Original bullet: {bullet}"""

_BATCH_TMPL = """Rewrite each of these {count} resume bullets for a {role} position.
Keywords to inject where natural: {keywords}

Bullets:
{bullets}

Return a JSON array with one object per bullet:
[{{
  "original": "<original>",
  "rewritten": "<improved>",
  "impact_score": <0-100>,
  "keywords_added": ["<kw>", ...]
}}]"""


async def rewrite_bullet(
    bullet: str,
    target_role: str = "",
    keywords: list[str] | None = None,
) -> dict:
    user = _SINGLE_TMPL.format(
        role=target_role or "software engineer",
        keywords=", ".join(keywords or []) or "none specified",
        bullet=bullet,
    )
    return await complete_json(_SYSTEM, user)


async def rewrite_bullets_batch(
    bullets: list[str],
    target_role: str = "",
    keywords: list[str] | None = None,
) -> list[dict]:
    bullets_text = "\n".join(f"{i+1}. {b}" for i, b in enumerate(bullets))
    user = _BATCH_TMPL.format(
        count=len(bullets),
        role=target_role or "software engineer",
        keywords=", ".join(keywords or []) or "none specified",
        bullets=bullets_text,
    )
    result = await complete_json(_SYSTEM, user)
    return result if isinstance(result, list) else []
