from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MentorshipRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    mentor_id: str
    goal: str = "career_guidance"
    message: str = Field(..., min_length=1, max_length=2000)


class MentorshipRequestUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    status: str
    response_message: str = ""


class MentorshipCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    mentee_id: str
    goal: str = "career_guidance"
    description: str = ""
    duration_months: int = 3
    meeting_frequency: str = "biweekly"
    mentor_goals: list[str] = Field(default_factory=list)
    mentee_goals: list[str] = Field(default_factory=list)


class MentorshipUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    status: str | None = None
    description: str | None = None
    duration_months: int | None = None
    meeting_frequency: str | None = None


class AvailabilitySlotIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    day: str = ""
    startTime: str = ""
    endTime: str = ""


class MentorProfileUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    bio: str | None = None
    max_mentees: int | None = Field(default=None, ge=1, le=20)
    specializations: list[str] | None = None
    availability: list[AvailabilitySlotIn] | None = None


class MentorshipSessionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    mentorship_id: str = ""
    scheduled_at: datetime
    duration_minutes: int = 30
    topic: str = ""


class MentorshipSessionUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    notes: str | None = None
    meeting_link: str | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=10, le=240)
    topic: str | None = None
    status: str | None = None
    completed: bool = False
    rating: int | None = Field(default=None, ge=0, le=5)
    feedback: str | None = None


class MentorshipSessionFeedback(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    rating: int = Field(..., ge=1, le=5)
    feedback: str = ""


class MentorshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    mentorship_id: str
    mentor_id: str
    mentee_id: str
    goal: str
    description: str
    status: str
    start_date: datetime
    end_date: datetime | None = None
    duration_months: int
    total_sessions: int
    completed_sessions: int
    meeting_frequency: str
    average_rating: float
    created_at: datetime
    updated_at: datetime


class MentorshipRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    request_id: str
    mentor_id: str
    mentee_id: str
    goal: str
    message: str
    status: str
    response_message: str
    created_at: datetime
