from datetime import datetime, timezone
from pydantic import Field
from beanie import Indexed
from app.models.base import BaseDocument


class ProfileView(BaseDocument):
    """A view of a user's public profile page."""

    profile_user_id: str = Indexed()
    viewer_id: str | None = None
    viewer_country: str | None = None
    viewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "profile_views"
        indexes = ["profile_user_id", "viewed_at"]