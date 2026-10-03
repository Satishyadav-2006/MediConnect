from datetime import datetime, timezone
from pydantic import Field
from beanie import Document, Indexed
from pymongo import IndexModel, ASCENDING
from app.models.base import BaseDocument


class Comment(BaseDocument):
    comment_id: str = Indexed(unique=True)
    post_id: str = Indexed()
    author_id: str = Indexed()
    parent_comment_id: str | None = None
    content: str = ""
    mentions: list[str] = Field(default_factory=list)
    is_edited: bool = False
    edited_at: datetime | None = None
    status: str = "active"
    reaction_count: int = 0
    reply_count: int = 0

    class Settings:
        name = "comments"
        indexes = [
            "comment_id", "post_id", "author_id", "parent_comment_id", "created_at",
            ("post_id", "created_at"),
        ]


class CommentReaction(BaseDocument):
    comment_id: str = Indexed()
    user_id: str = Indexed()

    class Settings:
        name = "comment_reactions"
        indexes = [
            "comment_id", "user_id",
            IndexModel([("comment_id", ASCENDING), ("user_id", ASCENDING)], unique=True, name="comment_user_unique"),
        ]
