from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


class EventCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=10000)
    event_type: str = "conference"
    location: str = ""
    venue: str = ""
    mode: str = "offline"
    meeting_link: str = ""
    banner_image: str = ""
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime | None = None
    max_participants: int = 0
    is_free: bool = True
    ticket_price: int = 0
    currency: str = "USD"
    cme_credits: int = 0
    certificate_available: bool = False
    agenda: list[dict] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    speakers: list[str] = Field(default_factory=list)

    @field_validator("max_participants", mode="before")
    @classmethod
    def _coerce_null_int(cls, v):
        if v is None:
            return 0
        return v


class EventUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    event_type: str | None = None
    location: str | None = None
    venue: str | None = None
    mode: str | None = None
    meeting_link: str | None = None
    banner_image: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    registration_deadline: datetime | None = None
    max_participants: int | None = None
    status: str | None = None
    is_free: bool | None = None
    ticket_price: int | None = None
    cme_credits: int | None = None
    certificate_available: bool | None = None
    agenda: list[dict] | None = None
    tags: list[str] | None = None
    speakers: list[str] | None = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_id: str
    organizer_id: str
    organization_id: str | None = None
    title: str
    description: str
    event_type: str
    location: str
    venue: str
    mode: str
    banner_image: str
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime | None = None
    max_participants: int
    current_participants: int
    attendees_count: int
    views_count: int
    status: str
    is_free: bool
    ticket_price: int
    currency: str
    cme_credits: int
    certificate_available: bool
    tags: list[str]
    speakers: list[str]
    created_at: datetime
    updated_at: datetime
