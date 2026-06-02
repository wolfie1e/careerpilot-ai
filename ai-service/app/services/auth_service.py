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


async def update_user_profile(
    db: AsyncSession,
    user: User,
    *,
    username: str | None = None,
    full_name: str | None = None,
    avatar_url: str | None = None,
) -> User:
    if username and username != user.username:
        existing = await db.execute(select(User).where(User.username == username))
        if existing.scalar_one_or_none():
            raise ValidationException("Username is already taken")
        user.username = username

    if full_name is not None:
        user.full_name = full_name.strip() or None
    if avatar_url is not None:
        user.avatar_url = avatar_url.strip() or None

    await db.flush()
    await db.refresh(user)
    return user


async def change_user_password(
    db: AsyncSession,
    user: User,
    *,
    current_password: str,
    new_password: str,
) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise CredentialsException("Current password is incorrect")
    if verify_password(new_password, user.hashed_password):
        raise ValidationException("New password must be different from the current password")

    user.hashed_password = hash_password(new_password)
    await db.flush()
