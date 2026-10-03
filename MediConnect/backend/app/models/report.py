from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field, ConfigDict
from app.models.base import (
    BaseDocument,
    AnnouncementStatus,
    NotificationPriority,
    ReportStatus,
    TargetAudience,
)


class Report(BaseDocument):
    reporter_id: str = Indexed()
    resource_id: str = Indexed()
    resource_type: str = Indexed()
    reason: str = ""
    description: str = ""
    status: ReportStatus = ReportStatus.PENDING
    reviewed_by: str | None = None
    resolution_action: str | None = None
    resolution_notes: str | None = None
    reviewed_at: datetime | None = None

    class Settings:
        name = "reports"
        indexes = [
            "reporter_id",
            "resource_id",
            "resource_type",
            "status",
            "reviewed_by",
            "created_at",
            ("status", "created_at"),
            ("resource_type", "resource_id"),
        ]


class AuditLog(Document):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    actor_id: str = Indexed()
    action: str = ""
    resource_type: str = ""
    resource_id: str | None = None
    old_value: dict | None = None
    new_value: dict | None = None
    ip_address: str = ""
    device_information: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
        validate_on_save = True
        indexes = [
            "actor_id",
            "action",
            "resource_type",
            "resource_id",
            "created_at",
            ("actor_id", "created_at"),
            ("action", "created_at"),
        ]


class Announcement(BaseDocument):
    title: str = ""
    content: str = ""
    published_by: str | None = None
    target_audience: TargetAudience = TargetAudience.ALL_USERS
    priority: NotificationPriority = NotificationPriority.NORMAL
    status: AnnouncementStatus = AnnouncementStatus.DRAFT
    published_at: datetime | None = None
    expires_at: datetime | None = None

    class Settings:
        name = "announcements"
        indexes = [
            "status",
            "priority",
            "published_at",
            "published_by",
            "expires_at",
        ]
