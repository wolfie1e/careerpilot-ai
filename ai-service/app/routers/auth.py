from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import login_user, register_user
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=dict, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user, token = await register_user(db, payload.email, payload.username, payload.password, payload.full_name)
    return {
        "user": UserResponse.model_validate(user).model_dump(),
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
    }


@router.post("/login", response_model=dict)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, token = await login_user(db, payload.email, payload.password)
    return {
        "user": UserResponse.model_validate(user).model_dump(),
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user
