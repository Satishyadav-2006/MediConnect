from pydantic import BaseModel
from typing import Any

class DashboardStatsResponse(BaseModel):
    total_users: int = 0
    total_posts: int = 0
    total_connections: int = 0
    total_jobs: int = 0
    total_events: int = 0

class AnalyticsResponse(BaseModel):
    period: str = "30d"
    data: dict[str, Any] = {}
