# CareerPilot AI

**Your AI Career Coach for Resumes, Interviews, and Job Readiness**

Upload your resume, match it with job descriptions, improve your ATS score, and practice interviews with real-time AI feedback.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

| Feature | Description |
|---------|-------------|
| 📄 Resume Analysis | Section-by-section quality scoring with strengths, weaknesses, and priority suggestions |
| 📊 ATS Score Calculator | 7-category rule-based rubric (keyword density, action verbs, formatting, contact completeness, etc.) |
| 🎯 Job Description Matcher | Semantic similarity + keyword overlap match score with skill gap breakdown |
| 🧠 Skill Gap Detection | Critical vs. optional missing skills with personalized learning roadmap |
| ✏️ AI Bullet Rewriter | Transform weak bullets into STAR-format achievements with impact scoring |
| 🔧 Section Improver | Full section rewrites (summary, experience, projects) with before/after comparison |
| 💡 Project Recommendations | Portfolio project ideas tailored to your missing skills and target role |
| 🎤 Text Mock Interviews | Role-specific questions with STAR rubric feedback on every answer |
| 🎙️ Voice Mock Interviews | Record audio answers — transcribed and evaluated in real time |
| 📚 Interview History | All sessions with per-question STAR breakdown and model answer hints |
| 📈 Analytics Dashboard | Score trends (ATS, interview, match), skill radar, interview type donut, readiness score |
| 🧭 Command Center | Prioritized cross-tracker action queue with planner handoff, source triage, pause controls, and exports |
| 📥 Report Export | Download PDF or Markdown reports with score summary and recommendations |
| 📖 Learning Path | Track courses, books, projects, practice, progress, deadlines, and planner-ready next steps |
| 🏅 Certification Tracker | Plan exam attempts, track study progress, store credential proof, and monitor renewal windows |
| 🤝 Mentorship Tracker | Manage mentors, advisors, peers, conversation cadence, goals, topics, and follow-up tasks |
| 🏢 Target Companies | Research and prioritize companies by fit, interest, roles, contacts, readiness, and next actions |
| 👤 Professional References | Prepare trusted advocates with permission, context, strengths, stories, reminders, and thank-you tracking |
| 📚 Interview Question Bank | Build answer outlines, track confidence and difficulty, schedule reviews, and record practice repetitions |
| 🗂️ Portfolio Projects | Track project readiness, skills, technology, evidence links, impact, milestones, and publication progress |
| 🔒 Route Protection | JWT auth with httpOnly cookies and server-side middleware |
| ⚡ Rate Limiting | AI-heavy endpoints limited to 10 req/min per IP |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui (Radix UI), Framer Motion, Recharts |
| State | Zustand, TanStack Query |
| Forms | React Hook Form, Zod v4 |
| Backend (BFF) | Next.js API Routes (proxy layer) |
| AI Service | FastAPI, Python 3.11 |
| Database | PostgreSQL 17 + pgvector extension |
| Auth | JWT (httpOnly cookies, bcrypt) |
| File Parsing | pypdf, pdfminer.six, python-docx |
| Voice | faster-whisper (base.en, CPU int8) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2, 384-dim) |
| Rate Limiting | slowapi |
| Reports | ReportLab (PDF), Markdown |
| Containerization | Docker + Docker Compose |

---

## Architecture

```
Browser
  │
  ▼
┌─────────────────────────────────┐
│  Next.js 16 (web/)              │
│  • App Router + TypeScript      │
│  • Tailwind CSS + shadcn/ui     │
│  • Framer Motion animations     │
│  • API Routes (BFF proxy)       │
│    - Validates JWT cookie       │
│    - Forwards to AI service     │
└────────────┬────────────────────┘
             │ Internal HTTP (never exposed to browser)
             ▼
┌─────────────────────────────────┐
│  FastAPI (ai-service/)          │
│  • Resume parsing & analysis    │
│  • ATS scoring (rule-based)     │
│  • pgvector semantic matching   │
│  • LLM inference (internal)     │
│  • faster-whisper transcription │
│  • Rate limiting (slowapi)      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  PostgreSQL 17 + pgvector       │
│  Tables: users, resumes,        │
│  resume_analyses, job_descs,    │
│  match_results, embeddings,     │
│  interview_sessions/questions/  │
│  answers                        │
└─────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+, pnpm
- Python 3.11+, pip
- PostgreSQL 17 with pgvector (`brew install pgvector` on macOS)
- Docker (optional)

### Local Setup

```bash
# 1. Clone
git clone https://github.com/wolfie1e/careerpilot-ai.git
cd careerpilot-ai

# 2. Environment
cp .env.example .env
# Edit .env — set AI_API_KEY, DATABASE_URL, JWT_SECRET_KEY

# 3. Database
psql -d postgres -c "CREATE DATABASE careerpilot OWNER admin;"
psql -d careerpilot -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. AI service
cd ai-service
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 5. Frontend (new terminal)
cd web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker

```bash
cp .env.example .env
docker-compose up --build
```

### Vercel Frontend Deploy

Deploy the website from the `web/` project root. Vercel should install with `pnpm install --frozen-lockfile` and build with `pnpm build`.

```bash
cd web
vercel --prod
```

Set these Vercel environment variables before production deploys:

| Variable | Purpose |
|----------|---------|
| `AI_SERVICE_URL` | Public or private URL for the FastAPI service used by Next.js API routes |
| `AI_PROXY_TIMEOUT_MS` | Proxy timeout for long AI requests |
| `NEXT_PUBLIC_APP_URL` | Production website URL |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async connection (`postgresql+asyncpg://...`) |
| `AI_API_KEY` | Inference API key |
| `JWT_SECRET_KEY` | Secret for signing auth tokens (change in production) |
| `AI_SERVICE_URL` | Internal URL for FastAPI service (Next.js → FastAPI) |
| `AI_PROXY_TIMEOUT_MS` | Frontend proxy timeout for AI service requests |
| `WHISPER_MODEL` | Transcription model (`base.en` recommended for CPU) |
| `EMBEDDING_MODEL` | Sentence transformer model (`all-MiniLM-L6-v2`) |

See `.env.example` for the full list.

---

## How the AI Pipeline Works

1. **Resume upload** — pypdf/python-docx extracts raw text; heuristic parser identifies sections (experience, education, skills, projects, etc.)
2. **Embeddings** — sentence-transformers encodes resume chunks into 384-dim vectors stored in PostgreSQL via pgvector
3. **JD matching** — Job description is embedded and compared via cosine similarity (`<=>` operator); combined 60/40 with keyword overlap score
4. **ATS scoring** — Rule-based 7-category evaluation (no LLM) for consistent, auditable scores
5. **LLM analysis** — Inference generates section feedback, bullet rewrites, project recommendations, and interview questions via structured JSON prompts
6. **Voice interviews** — Browser MediaRecorder captures `audio/webm`, faster-whisper transcribes on CPU (~3-5s for 60s audio), LLM evaluates with STAR rubric

---

## How Resume-JD Matching Works

```
Score = (semantic_score × 0.6) + (keyword_score × 0.4)
```

- **Semantic score**: cosine similarity between pgvector embeddings of resume chunks and JD
- **Keyword score**: fraction of JD-required skills found in resume

The 60/40 weighting favors semantic understanding, preventing keyword stuffing from gaming the score.

---

## How ATS Scoring Works

| Category | Weight | What Is Measured |
|----------|--------|-----------------|
| Section Presence | 20% | Contact, Experience, Education, Skills all present |
| Keyword Density | 20% | Technical terms per 100 words |
| Action Verbs | 15% | % bullets starting with strong past-tense verb |
| Quantification | 15% | % bullets containing numbers or percentages |
| Formatting Integrity | 15% | No tables, images, or special-char headers |
| Contact Completeness | 10% | Email, phone, LinkedIn present |
| Length Compliance | 5% | 400–800 word ideal range |

---

## How Mock Interviews Work

1. User selects role, difficulty, interview type (behavioral/technical/mixed), and question count
2. Questions are generated targeting the role and difficulty
3. User answers by text typing or voice recording
4. Voice answers are transcribed locally
5. Each answer is evaluated on a 5-dimension STAR rubric (0-20 each → 0-100 total)
6. Final session summary includes average score, readiness level, and improvement areas

---

## Running Tests

```bash
cd ai-service
pytest tests/ -v
```

Tests cover: ATS scorer (rule-based), resume parser (section extraction, contact parsing), JD matcher (skill extraction, gap detection, critical skill classification).

## Health Checks

The AI service exposes `GET /health` for local and container probes. The response includes service status, database status, app version, and current environment so deploy tooling can distinguish a degraded database from a fully unavailable API.

```json
{
  "status": "healthy",
  "service": "careerpilot-ai",
  "version": "1.0.0",
  "environment": "development",
  "database": "healthy"
}
```

---

## Future Roadmap

- [ ] LinkedIn profile import
- [ ] Company-specific interview prep packs
- [ ] Resume version diff view
- [ ] Peer review / mentor sharing mode
- [ ] Mobile app (React Native)
- [ ] Job board integration (application tracking)

---

> Built an AI career assistant that performs resume-JD matching, ATS scoring, skill gap analysis, AI-powered resume improvement, and voice-based mock interviews with personalized feedback.
