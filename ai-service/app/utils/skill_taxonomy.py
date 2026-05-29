"""Curated skill taxonomy for extraction and gap analysis."""

TECH_SKILLS = {
    # Languages
    "python", "java", "javascript", "typescript", "go", "golang", "rust", "c++", "c#",
    "scala", "kotlin", "swift", "ruby", "php", "r", "matlab", "bash", "shell",
    # Frontend
    "react", "next.js", "vue", "angular", "svelte", "html", "css", "tailwind",
    "redux", "graphql", "webpack", "vite",
    # Backend
    "node.js", "express", "fastapi", "django", "flask", "spring", "rails",
    "rest api", "grpc", "microservices",
    # Data / ML
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "pandas", "numpy", "spark", "hadoop", "nlp", "computer vision", "llm",
    "data engineering", "etl", "data pipeline",
    # Cloud / DevOps
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
    "ci/cd", "jenkins", "github actions", "linux", "nginx",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra",
    "dynamodb", "sqlite", "bigquery", "snowflake",
    # Tools
    "git", "jira", "agile", "scrum", "kafka", "rabbitmq", "celery",
    # Concepts
    "system design", "distributed systems", "cloud native", "containerization",
    "api design", "database design", "object oriented", "functional programming",
    "test driven development", "tdd", "clean architecture",
}

SOFT_SKILLS = {
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "project management", "stakeholder management", "mentoring", "collaboration",
    "adaptability", "time management", "attention to detail",
}

ALL_SKILLS = TECH_SKILLS | SOFT_SKILLS


def extract_skills_from_text(text: str) -> list[str]:
    """Return list of skills found in text."""
    text_lower = text.lower()
    found = []
    for skill in TECH_SKILLS:
        if skill in text_lower:
            found.append(skill)
    return sorted(set(found))
