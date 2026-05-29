import os
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.core.exceptions import FileTooLargeException, UnsupportedFileTypeException


async def save_upload(upload: UploadFile) -> tuple[str, str, int]:
    """Save uploaded file to disk. Returns (path, file_type, size_bytes)."""
    content = await upload.read()

    if len(content) > settings.max_upload_size_bytes:
        raise FileTooLargeException(settings.max_upload_size_mb)

    original_name = upload.filename or "resume"
    ext = Path(original_name).suffix.lower().lstrip(".")
    if ext not in settings.allowed_extension_list:
        raise UnsupportedFileTypeException(settings.allowed_extension_list)

    os.makedirs(settings.upload_dir, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(settings.upload_dir, unique_name)

    with open(path, "wb") as f:
        f.write(content)

    return path, ext, len(content)
