from datetime import datetime, timezone
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from pymongo import ASCENDING, IndexModel
from app.models.base import BaseDocument, EventStatus, EventType, EventMode, EventRegistrationStatus, AttendanceStatus


class Event(BaseDocument):
    event_id: str = Indexed(unique=True)
    host_id: str = ""
    organization_id: str | None = None
    title: str = ""
    description: str = ""
    event_type: EventType = EventType.CONFERENCE
    category: str = ""
    location: str = ""
    venue: str = ""
    mode: EventMode = EventMode.OFFLINE
    meeting_link: str = ""
    banner_image: str = ""
    start_datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    registration_deadline: datetime | None = None
    capacity: int = 0
    registered_count: int = 0
    status: EventStatus = EventStatus.DRAFT
    certificate_available: bool = False
    is_free: bool = True
    ticket_price: int = 0
    currency: str = "USD"
    cme_credits: int = 0
    tags: list[str] = Field(default_factory=list)
    speakers: list[str] = Field(default_factory=list)
    agenda: list[dict] = Field(default_factory=list)
    views_count: int = 0
    search_keywords: list[str] = Field(default_factory=list)

    class Settings:
        name = "events"
        indexes = [
            "event_id", "organization_id", "created_at",
            "status", "host_id", "category", "mode",
            "registration_deadline", "start_datetime",
            ("status", "start_datetime"),
        ]


class EventRegistration(BaseDocument):
    event_id: str = Indexed()
    user_id: str = Indexed()
    registration_status: EventRegistrationStatus = EventRegistrationStatus.REGISTERED
    attendance_status: AttendanceStatus = AttendanceStatus.PENDING
    certificate_issued: bool = False
    registered_at: datetime | None = None
    attendance_marked_at: datetime | None = None

    class Settings:
        name = "event_registrations"
        indexes = [
            "event_id", "user_id", "registration_status",
            IndexModel(
                [("event_id", ASCENDING), ("user_id", ASCENDING)],
                unique=True,
                name="event_user_unique",
            ),
        ]
