from datetime import datetime, timezone
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from app.models.base import BaseDocument, MentorshipRequestStatus


class AvailabilitySlot(BaseModel):
    day: str = ""
    start_time: str = ""
    end_time: str = ""


class MentorProfile(BaseDocument):
    profile_id: str = Indexed(unique=True)
    mentor_id: str = Indexed(unique=True)
    bio: str = ""
    specializations: list[str] = Field(default_factory=list)
    max_mentees: int = 5
    availability: list[AvailabilitySlot] = Field(default_factory=list)
    is_active: bool = True

    class Settings:
        name = "mentor_profiles"
        indexes = ["profile_id", "mentor_id", "is_active"]


class MentorshipSession(BaseDocument):
    session_id: str = Indexed(unique=True)
    request_id: str = Indexed()
    mentor_id: str = Indexed()
    mentee_id: str = Indexed()
    scheduled_at: datetime | None = None
    duration: int = 30
    topic: str = ""
    meeting_link: str = ""
    notes: str = ""
    status: str = "scheduled"
    completed_at: datetime | None = None
    rating: int = 0
    feedback: str = ""

    class Settings:
        name = "mentorship_sessions"
        indexes = [
            "session_id", "request_id", "mentor_id", "mentee_id", "scheduled_at", "status",
        ]


class MentorshipRequest(BaseDocument):
    request_id: str = Indexed(unique=True)
    mentor_id: str = Indexed()
    mentee_id: str = Indexed()
    message: str = ""
    response_message: str = ""
    status: MentorshipRequestStatus = MentorshipRequestStatus.PENDING
    requested_at: datetime | None = None
    responded_at: datetime | None = None

    class Settings:
        name = "mentorship_requests"
        indexes = ["request_id", "mentor_id", "mentee_id", "status", "requested_at"]
