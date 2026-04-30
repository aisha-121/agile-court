from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    is_perspective_flip: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    role: str
    title: Optional[str] = "New Chat"


class ConversationResponse(BaseModel):
    id: int
    role: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    content: str
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    role: str
    content: str
    conversation_id: int
    message_id: int


class FlipRequest(BaseModel):
    last_user_message: str
    target_role: str