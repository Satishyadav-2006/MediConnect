from datetime import datetime, timezone
from pydantic import Field
from beanie import Document, Indexed
from app.models.base import BaseDocument


class Achievement(BaseDocument):
    achievement_id: str = Indexed(unique=True)
    name: str
    slug: str = Indexed(unique=True)
    description: str = ""
    category: str = "general"
    icon: str = ""
    points: int = 0
    tier: str = "bronze"
    threshold: int = 0
    metric: str = ""
    is_active: bool = True

    class Settings:
        name = "achievements"
        indexes = ["achievement_id", "slug", "category", "is_active"]


class UserAchievement(BaseDocument):
    user_id: str = Indexed()
    achievement_id: str = Indexed()
    progress: int = 0
    max_progress: int = 1
    earned: bool = False
    earned_at: datetime | None = None

    class Settings:
        name = "user_achievements"
        indexes = [
            "user_id",
            "achievement_id",
            ("user_id", "achievement_id"),
            "earned",
        ]
