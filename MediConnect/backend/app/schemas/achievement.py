from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    achievement_id: str
    name: str
    slug: str
    description: str
    category: str
    icon: str
    points: int
    tier: str


class UserAchievementProgress(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    achievement: AchievementResponse
    progress: int = 0
    max_progress: int = 1
    earned: bool = False
    earned_at: datetime | None = None


class AchievementWithProgress(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    achievement_id: str
    name: str
    slug: str
    description: str
    category: str
    icon: str
    points: int
    tier: str
    progress: int = 0
    max_progress: int = 1
    earned: bool = False
    earned_at: datetime | None = None


class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    username: str
    first_name: str
    last_name: str
    profile_photo: str | None = None
    total_points: int = 0
    achievements_count: int = 0
