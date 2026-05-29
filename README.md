# CareerPilot AI

**Your AI Career Coach for Resumes, Interviews, and Job Readiness**

Upload your resume, match it with job descriptions, improve your ATS score, and practice interviews with real-time AI feedback.

---

## Features

- **Resume Analysis** — Section-by-section quality scoring with actionable feedback
- **ATS Score Calculator** — 7-category rubric scoring with keyword gap analysis
- **Job Description Matcher** — Semantic similarity matching with skill gap detection
- **Skill Gap Analysis** — Personalized learning roadmap for missing skills
- **AI Bullet Rewriter** — Transform weak bullets into impact-driven achievements
- **Resume Section Improver** — Full section rewrites with ATS optimization
- **Project Recommendations** — Portfolio project ideas tailored to your target role
- **Text Mock Interviews** — Practice with STAR-evaluated feedback per answer
- **Voice Mock Interviews** — Record answers, get transcripts and AI feedback
- **Interview History** — Track all sessions with per-question scoring
- **Analytics Dashboard** — Score trends, skill coverage, readiness metrics
- **Report Export** — Download PDF or Markdown reports of your analysis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| State | Zustand, TanStack Query |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend (BFF) | Next.js API Routes |
| AI Service | FastAPI, Python 3.11 |
| Database | PostgreSQL 17 + pgvector |
| Auth | JWT (httpOnly cookies) |
| File Parsing | pypdf, pdfminer, python-docx |
| Voice | faster-whisper (base.en model) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Containerization | Docker + Docker Compose |

---

## Getting Started

### Prerequisites

- Node.js 18+, pnpm
- Python 3.11+, pip
- PostgreSQL 17 with pgvector
- Docker (optional, for containerized dev)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/wolfie1e/careerpilot-ai.git
cd careerpilot-ai

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# 3. Create the database
psql -d postgres -c "CREATE DATABASE careerpilot OWNER admin;"
psql -d careerpilot -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Set up the AI service
cd ai-service
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 5. Set up the frontend (new terminal)
cd web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Docker Setup

```bash
cp .env.example .env
docker-compose up --build
```

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async connection string |
| `AI_API_KEY` | Your AI inference API key |
| `JWT_SECRET_KEY` | Secret for signing auth tokens |
| `AI_SERVICE_URL` | Internal URL for the FastAPI service |

---

## How the AI Pipeline Works

1. **Resume upload** — pypdf/python-docx extract raw text, heuristic parser identifies sections
2. **Embeddings** — sentence-transformers encodes resume chunks into 384-dim vectors, stored in PostgreSQL via pgvector
3. **JD matching** — Job description is embedded and compared via cosine similarity (`<=>` operator); combined with keyword overlap for the final match score
4. **ATS scoring** — Rule-based 7-category evaluation (no LLM required) for consistent, auditable scores
5. **LLM analysis** — AI inference generates section feedback, bullet rewrites, project recommendations, and interview question sets — all via structured JSON prompts
6. **Voice interviews** — Browser MediaRecorder captures audio, faster-whisper transcribes on CPU, LLM evaluates the transcript with STAR rubric

---

## How Resume-JD Matching Works

Match score = `(semantic_score × 0.6) + (keyword_score × 0.4)`

- **Semantic score**: cosine similarity between pgvector embeddings of resume and JD
- **Keyword score**: fraction of JD-required skills found in resume

The 60/40 weighting favors semantic understanding over keyword density, preventing gaming by keyword stuffing.

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
2. System generates questions targeted to the role and difficulty
3. User answers by text or voice recording
4. Voice answers are transcribed locally (no external transcription service)
5. Each answer is evaluated on a 5-dimension STAR rubric
6. Final session summary includes average score, strengths, improvement areas, and readiness level

---

## Future Roadmap

- [ ] LinkedIn profile import
- [ ] Resume version history with diff view
- [ ] Company-specific interview prep packs
- [ ] Peer review mode (share session with mentor)
- [ ] Mobile app (React Native)
- [ ] Integration with job boards (apply tracking)

---

## Resume Line

> Built an AI career assistant that performs resume-JD matching, ATS scoring, skill gap analysis, AI-powered resume improvement, and voice-based mock interviews with personalized feedback.
