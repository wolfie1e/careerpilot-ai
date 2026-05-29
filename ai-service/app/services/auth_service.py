from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import create_access_token, hash_password, verify_password
from app.core.exceptions import ValidationException, CredentialsException
from app.config import settings
from app.models.user import User


async def register_user(db: AsyncSession, email: str, username: str, password: str, full_name: str | None) -> tuple[User, str]:
    existing = await db.execute(select(User).where((User.email == email) | (User.username == username)))
    if existing.scalar_one_or_none():
        raise ValidationException("Email or username already registered")

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    return user, token


async def login_user(db: AsyncSession, email: str, password: str) -> tuple[User, str]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise CredentialsException()
    if not user.is_active:
        raise ValidationException("Account is deactivated")

    token = create_access_token({"sub": user.id})
    return user, token
