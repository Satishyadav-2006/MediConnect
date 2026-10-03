from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PostCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    post_type: str = "text"
    content: str = Field(..., min_length=1, max_length=10000)
    media: list[dict] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    mentions: list[str] = Field(default_factory=list)
    visibility: str = "public"
    location: str = ""
    organization_id: str | None = None


class PostUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    content: str | None = Field(default=None, max_length=10000)
    visibility: str | None = None
    hashtags: list[str] | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    post_id: str
    author_id: str
    organization_id: str | None = None
    post_type: str
    content: str
    media: list[dict] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    mentions: list[str] = Field(default_factory=list)
    visibility: str
    location: str
    edited: bool
    comments_count: int = 0
    reactions_count: int = 0
    shares_count: int = 0
    bookmarks_count: int = 0
    views_count: int = 0
    created_at: datetime
    updated_at: datetime


class CommentCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    content: str = Field(..., min_length=1, max_length=5000)
    parent_comment_id: str | None = None
    mentions: list[str] = Field(default_factory=list)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    comment_id: str
    post_id: str
    author_id: str
    parent_comment_id: str | None = None
    content: str
    edited: bool
    reactions_count: int = 0
    replies_count: int = 0
    created_at: datetime


class ReactionRequest(BaseModel):
    reaction_type: str = "like"


class ReportRequest(BaseModel):
    reason: str = Field(..., min_length=1)
    description: str = ""
