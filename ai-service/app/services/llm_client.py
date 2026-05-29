"""Internal inference client. Not referenced by vendor name in any UI or README."""
import json
import re
from typing import Any

import anthropic

from app.config import settings

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ai_api_key)
    return _client


async def complete(
    system: str,
    user: str,
    max_tokens: int | None = None,
) -> str:
    client = _get_client()
    message = client.messages.create(
        model=settings.ai_model,
        max_tokens=max_tokens or settings.ai_max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


async def complete_json(
    system: str,
    user: str,
    max_tokens: int | None = None,
) -> Any:
    """Call LLM and parse JSON response. Retries once on parse failure."""
    text = await complete(system, user + "\n\nReturn ONLY valid JSON. No markdown, no explanation outside the JSON.", max_tokens)
    try:
        return _parse_json(text)
    except (json.JSONDecodeError, ValueError):
        retry_text = await complete(
            system,
            f"Your previous response was not valid JSON. Return ONLY the JSON object, nothing else.\n\n{user}",
            max_tokens,
        )
        return _parse_json(retry_text)


def _parse_json(text: str) -> Any:
    text = text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)
