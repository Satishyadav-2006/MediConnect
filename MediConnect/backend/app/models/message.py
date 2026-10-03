from pymongo import ASCENDING, IndexModel
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from beanie import Indexed
from app.models.base import BaseDocument, MessageStatus


class MessageAttachment(BaseModel):
    attachment_type: str = "image"
    cloudinary_url: str = ""
    thumbnail_url: str = ""
    file_name: str = ""
    mime_type: str = ""
    file_size: int = 0
    duration: int = 0
    width: int = 0
    height: int = 0


class Message(BaseDocument):
    message_id: str = Indexed(unique=True)
    conversation_id: str = Indexed()
    sender_id: str = Indexed()
    message_type: str = "text"
    content: str = ""
    attachments: list[MessageAttachment] = Field(default_factory=list)
    reply_to: str | None = None
    mentions: list[str] = Field(default_factory=list)
    status: MessageStatus = MessageStatus.SENT
    is_edited: bool = False
    edited_at: datetime | None = None
    deleted_for: list[str] = Field(default_factory=list)
    is_pinned: bool = False
    read_by: list[str] = Field(default_factory=list)
    delivered_to: list[str] = Field(default_factory=list)
    reactions: list[dict[str, Any]] = Field(default_factory=list)

    class Settings:
        name = "messages"
        indexes = [
            "message_id", "conversation_id", "sender_id",
            "created_at", "status",
            [("conversation_id", ASCENDING), ("created_at", ASCENDING)],
            [("sender_id", ASCENDING), ("created_at", ASCENDING)],
        ]

