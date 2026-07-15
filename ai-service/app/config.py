from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+asyncpg://admin@localhost/careerpilot"
    database_url_sync: str = "postgresql://admin@localhost/careerpilot"

    # Auth
    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # AI inference
    ai_api_key: str = ""
    ai_model: str = "claude-sonnet-4-6"
    ai_max_tokens: int = 4096

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Voice transcription
    whisper_model: str = "base.en"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"

    # File upload
    max_upload_size_mb: int = 10
    upload_dir: str = "./uploads"
    allowed_extensions: str = "pdf,docx,txt"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Rate limiting
    rate_limit_per_minute: int = 30
    rate_limit_ai_per_minute: int = 10

    # App
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"

    @property
    def allowed_extension_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
