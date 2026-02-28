from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    role: str
    content: str
    negotiation_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSendRequest(BaseModel):
    message: str
    negotiation_id: Optional[str] = None
