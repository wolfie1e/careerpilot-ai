from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=8, max_length=100)
    full_name: str | None = Field(None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(None, max_length=255)
    username: str | None = Field(None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    avatar_url: str | None = Field(None, max_length=500)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=100)
    new_password: str = Field(min_length=8, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str | None
    avatar_url: str | None
    plan: str
    is_active: bool
    total_resumes: int = 0
    total_interviews: int = 0

    model_config = {"from_attributes": True}
