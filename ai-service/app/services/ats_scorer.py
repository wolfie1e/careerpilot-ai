"""Rule-based ATS scoring — 7 weighted categories. No LLM required."""
import re

_ACTION_VERBS = {
    "developed", "built", "designed", "implemented", "created", "engineered", "architected",
    "led", "managed", "coordinated", "organized", "directed", "supervised", "mentored",
    "improved", "optimized", "reduced", "increased", "achieved", "delivered", "launched",
    "deployed", "migrated", "refactored", "automated", "integrated", "analyzed", "researched",
    "collaborated", "contributed", "spearheaded", "drove", "established", "transformed",
    "streamlined", "accelerated", "enhanced", "scaled", "maintained", "resolved",
}

_TECH_PATTERN = re.compile(
    r"\b(python|java|javascript|typescript|react|node|vue|angular|django|flask|fastapi|"
    r"spring|docker|kubernetes|aws|gcp|azure|sql|postgresql|mysql|mongodb|redis|git|"
    r"rest|api|graphql|microservices|ci/cd|jenkins|github|terraform|linux|bash|"
    r"machine\s*learning|deep\s*learning|tensorflow|pytorch|pandas|numpy|spark|kafka|"
    r"golang|rust|c\+\+|scala|kotlin|swift|flutter|css|html|tailwind)\b",
    re.IGNORECASE,
)

_CONTACT_FIELDS = {
    "email": re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"),
    "phone": re.compile(r"(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}"),
    "linkedin": re.compile(r"linkedin\.com", re.IGNORECASE),
}

_SECTION_KEYWORDS = {
    "experience": re.compile(r"experience|work\s+history|employment", re.IGNORECASE),
    "education": re.compile(r"education|degree|university|college", re.IGNORECASE),
    "skills": re.compile(r"\bskills\b|technologies|competencies", re.IGNORECASE),
    "contact": re.compile(r"contact|email|phone|linkedin|@", re.IGNORECASE),
}


def compute_ats_score(raw_text: str, sections: dict) -> dict:
    """Return dict with overall score (0-100) and per-category breakdown."""
    text = raw_text
    word_count = len(text.split())

    # 1. Section presence (20%)
    section_score = _score_sections(text, sections)

    # 2. Keyword density (20%)
    keyword_score = _score_keywords(text, word_count)

    # 3. Action verbs (15%)
    verb_score = _score_action_verbs(text)

    # 4. Quantification (15%)
    quant_score = _score_quantification(text)

    # 5. Formatting integrity (15%)
    format_score = _score_formatting(text)

    # 6. Contact completeness (10%)
    contact_score = _score_contact(text)

    # 7. Length compliance (5%)
    length_score = _score_length(word_count)

    overall = int(
        section_score * 0.20 +
        keyword_score * 0.20 +
        verb_score * 0.15 +
        quant_score * 0.15 +
        format_score * 0.15 +
        contact_score * 0.10 +
        length_score * 0.05
    )

    return {
        "ats_score": overall,
        "breakdown": {
            "section_presence": round(section_score),
            "keyword_density": round(keyword_score),
            "action_verbs": round(verb_score),
            "quantification": round(quant_score),
            "formatting": round(format_score),
            "contact_completeness": round(contact_score),
            "length_compliance": round(length_score),
        },
    }


def _score_sections(text: str, sections: dict) -> float:
    required = ["experience", "education", "skills"]
    found = sum(1 for r in required if r in sections or _SECTION_KEYWORDS[r].search(text))
    has_contact = "contact" in sections or _SECTION_KEYWORDS["contact"].search(text)
    return min(100, found / 3 * 80 + (20 if has_contact else 0))


def _score_keywords(text: str, word_count: int) -> float:
    if word_count == 0:
        return 0
    matches = len(_TECH_PATTERN.findall(text))
    density = (matches / word_count) * 100
    if density >= 3:
        return 100
    if density >= 1.5:
        return 70
    if density >= 0.8:
        return 45
    return 20


def _score_action_verbs(text: str) -> float:
    bullets = re.findall(r"(?:^|\n)[•\-\*]\s*(.+)", text)
    if not bullets:
        sentences = [s.strip() for s in re.split(r"[.\n]", text) if len(s.strip()) > 20]
        bullets = sentences[:30]
    if not bullets:
        return 30
    strong = sum(
        1 for b in bullets
        if b.split() and b.split()[0].rstrip(".,;").lower() in _ACTION_VERBS
    )
    ratio = strong / len(bullets)
    return min(100, ratio * 120)


def _score_quantification(text: str) -> float:
    bullets = re.findall(r"(?:^|\n)[•\-\*]\s*(.+)", text)
    if not bullets:
        return 30
    quantified = sum(1 for b in bullets if re.search(r"\d+\s*[%x+kmb$]?|\d+[%]", b, re.IGNORECASE))
    ratio = quantified / len(bullets)
    return min(100, ratio * 150)


def _score_formatting(text: str) -> float:
    score = 100
    # Penalize table-like pipe characters
    if text.count("|") > 10:
        score -= 25
    # Penalize image/object markers
    if re.search(r"\[image\]|\[object\]|<img", text, re.IGNORECASE):
        score -= 30
    # Penalize very long unbroken lines (suggests layout issues)
    long_lines = [l for l in text.split("\n") if len(l) > 200]
    if len(long_lines) > 5:
        score -= 15
    return max(0, score)


def _score_contact(text: str) -> float:
    found = sum(1 for pattern in _CONTACT_FIELDS.values() if pattern.search(text))
    return (found / len(_CONTACT_FIELDS)) * 100


def _score_length(word_count: int) -> float:
    if 400 <= word_count <= 800:
        return 100
    if 300 <= word_count < 400 or 800 < word_count <= 1000:
        return 70
    if 200 <= word_count < 300 or 1000 < word_count <= 1200:
        return 40
    return 15
