from datetime import datetime, timezone
from beanie import Indexed
from pydantic import Field
from app.models.base import BaseDocument


class SearchHistory(BaseDocument):
    """Recent searches performed by users."""
    class Settings:
        name = "search_history"
        indexes = ["user_id", "search_type", "searched_at"]

    user_id: str = Indexed()
    search_query: str = ""
    search_type: str = ""  # users, organizations, posts, research, jobs, internships, events, mentors
    searched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
