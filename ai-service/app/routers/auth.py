from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.resume import Resume
from app.models.interview_session import InterviewSession
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RegisterRequest, UpdateProfileRequest, UserResponse
from app.services.auth_service import change_user_password, login_user, register_user, update_user_profile
from app.config import settings

router = APIRouter()


async def _build_user_response(user, db: AsyncSession) -> dict:
    resumes_res = await db.execute(
        select(func.count()).select_from(Resume).where(Resume.user_id == user.id, Resume.is_active == True)
    )
    total_resumes = resumes_res.scalar() or 0

    interviews_res = await db.execute(
        select(func.count()).select_from(InterviewSession).where(
            InterviewSession.user_id == user.id, InterviewSession.status == "completed"
        )
    )
    total_interviews = interviews_res.scalar() or 0

    data = UserResponse.model_validate(user).model_dump()
    data["total_resumes"] = total_resumes
    data["total_interviews"] = total_interviews
    return data


@router.post("/register", response_model=dict, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user, token = await register_user(db, payload.email, payload.username, payload.password, payload.full_name)
    return {
        "user": await _build_user_response(user, db),
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
    }


@router.post("/login", response_model=dict)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, token = await login_user(db, payload.email, payload.password)
    return {
        "user": await _build_user_response(user, db),
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
    }


@router.get("/me", response_model=dict)
async def get_me(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _build_user_response(current_user, db)


@router.patch("/me", response_model=dict)
async def update_me(
    payload: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await update_user_profile(
        db,
        current_user,
        username=payload.username,
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
    )
    return await _build_user_response(updated, db)


@router.post("/password", response_model=dict)
async def change_password(
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await change_user_password(
        db,
        current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return {"message": "Password updated successfully"}
