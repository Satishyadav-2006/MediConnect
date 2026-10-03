from pymongo import ASCENDING, IndexModel
from datetime import datetime
from pydantic import Field
from beanie import Indexed
from app.models.base import BaseDocument


class Conversation(BaseDocument):
    conversation_id: str = Indexed(unique=True)
    conversation_type: str = "private"
    participant_ids: list[str] = Field(default_factory=list)
    last_message_preview: str = ""
    last_message_id: str | None = None
    last_activity: datetime | None = None
    unread_count: int = 0
    unread_counts: dict[str, int] = Field(default_factory=dict)
    is_archived: bool = False
    is_deleted: bool = False
    is_pinned: bool = False

    class Settings:
        name = "conversations"
        indexes = [
            "conversation_id", "conversation_type",
            "is_archived", "is_deleted",
            "participant_ids", "last_activity", "created_at",
            # participant_ids is an array field â€” cannot be part of compound index
            [("conversation_type", ASCENDING), ("last_activity", ASCENDING)],
        ]

