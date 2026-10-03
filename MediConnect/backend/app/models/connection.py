from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel, ASCENDING
from app.models.base import ConnectionStatus


class Connection(Document):
    sender_id: str = Indexed()
    receiver_id: str = Indexed()
    status: ConnectionStatus = ConnectionStatus.PENDING
    connected_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "connections"
        indexes = [
            "sender_id", "receiver_id", "status",
            IndexModel([("sender_id", ASCENDING), ("receiver_id", ASCENDING)], unique=True, name="sender_receiver_unique"),
        ]


class Follow(Document):
    follower_id: str = Indexed()
    following_id: str = Indexed()
    following_type: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "followers"
        indexes = [
            "follower_id", "following_id", "following_type",
            IndexModel([("follower_id", ASCENDING), ("following_id", ASCENDING), ("following_type", ASCENDING)], unique=True, name="follower_following_unique"),
        ]
