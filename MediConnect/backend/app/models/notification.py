from datetime import datetime, timezone
from pydantic import Field
from beanie import Document, Indexed
from app.models.base import BaseDocument, NotificationType, NotificationPriority


class Notification(BaseDocument):
    notification_id: str = Indexed(unique=True)
    recipient_id: str = Indexed()
    sender_id: str | None = None
    notification_type: NotificationType = NotificationType.SYSTEM_NOTIFICATION
    title: str = ""
    message: str = ""
    reference_id: str | None = None
    reference_type: str | None = None
    is_read: bool = False
    read_at: datetime | None = None
    priority: NotificationPriority = NotificationPriority.NORMAL

    class Settings:
        name = "notifications"
        indexes = [
            "notification_id", "recipient_id",
            "notification_type", "is_read", "created_at", "priority",
            ("recipient_id", "is_read"),
            ("recipient_id", "created_at"),
        ]


class Device(BaseDocument):
    device_id: str = Indexed(unique=True)
    user_id: str = Indexed()
    device_name: str = ""
    platform: str = ""
    fcm_token: str = Indexed(unique=True)
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "device_tokens"
        indexes = ["device_id", "user_id", ("fcm_token",)]
