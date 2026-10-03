from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class Block(Document):
    user_id: str = Indexed()
    blocked_id: str = Indexed()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "blocks"
        indexes = [
            "user_id", "blocked_id",
            IndexModel([("user_id", ASCENDING), ("blocked_id", ASCENDING)], unique=True, name="user_blocked_unique"),
        ]
