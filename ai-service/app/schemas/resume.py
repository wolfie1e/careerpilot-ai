from datetime import datetime
from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int | None
    word_count: int | None
    parsed_sections: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    id: str
    filename: str
    file_type: str
    word_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
