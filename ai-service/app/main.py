import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import settings
from app.core.middleware import RequestLoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CareerPilot AI service starting up...")
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    logger.info("CareerPilot AI service shutting down.")


app = FastAPI(
    title="CareerPilot AI Service",
    version="1.0.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "careerpilot-ai"}


# Routers are imported lazily to avoid circular imports at startup
from app.routers import auth, resume, analysis, matcher, interview, voice, analytics, reports  # noqa: E402

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(resume.router, prefix="/resumes", tags=["Resume"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(matcher.router, prefix="/matcher", tags=["Matcher"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
