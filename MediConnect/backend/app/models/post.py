from datetime import datetime, timezone
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from pymongo import IndexModel, ASCENDING, TEXT
from app.models.base import BaseDocument, PostType, PostStatus, Visibility, ReactionType


class MediaItem(BaseModel):
    cloudinary_url: str = ""
    media_type: str = "image"
    thumbnail_url: str = ""
    file_name: str = ""
    mime_type: str = ""
    file_size: int = 0
    duration: int = 0
    width: int = 0
    height: int = 0


class Post(BaseDocument):
    post_id: str = Indexed(unique=True)
    author_id: str = Indexed()
    organization_id: str | None = None
    post_type: PostType = PostType.TEXT
    content: str = ""
    media: list[MediaItem] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    mentions: list[str] = Field(default_factory=list)
    visibility: Visibility = Visibility.PUBLIC
    location: str = ""
    is_edited: bool = False
    edited_at: datetime | None = None
    author_type: str = "user"
    status: PostStatus = PostStatus.ACTIVE
    comment_count: int = 0
    reaction_count: int = 0
    share_count: int = 0
    bookmark_count: int = 0
    view_count: int = 0

    class Settings:
        name = "posts"
        indexes = [
            "post_id", "author_id", "organization_id", "created_at",
            "visibility", "post_type", "hashtags", "status",
            ("author_id", "created_at"),
            ("organization_id", "created_at"),
            ("post_type", "created_at"),
            IndexModel([("content", TEXT), ("hashtags", TEXT)], name="text_search"),
        ]


class Reaction(Document):
    user_id: str = Indexed()
    post_id: str = Indexed()
    reaction_type: ReactionType = ReactionType.LIKE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "post_reactions"
        indexes = [
            "user_id", "post_id", "reaction_type",
            IndexModel([("post_id", ASCENDING), ("user_id", ASCENDING)], unique=True, name="post_user_unique"),
        ]


class Bookmark(BaseDocument):
    user_id: str = Indexed()
    post_id: str = Indexed()

    class Settings:
        name = "bookmarks"
        indexes = [
            "user_id", "post_id", "created_at",
            IndexModel([("user_id", ASCENDING), ("post_id", ASCENDING)], unique=True, name="user_post_unique"),
        ]
