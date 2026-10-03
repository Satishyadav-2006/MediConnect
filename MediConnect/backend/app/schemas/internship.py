from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class InternshipCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=10000)
    organization_id: str | None = None
    department: str = ""
    location: str = ""
    work_mode: str = "onsite"
    internship_type: str = "clinical"
    duration_weeks: int = 0
    stipend: int = 0
    currency: str = "USD"
    skills_required: list[str] = Field(default_factory=list)
    eligibility: str = ""
    max_participants: int = 0
    is_paid: bool = False
    start_date: datetime | None = None
    end_date: datetime | None = None
    application_deadline: datetime | None = None


class InternshipUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    department: str | None = None
    location: str | None = None
    work_mode: str | None = None
    internship_type: str | None = None
    duration_weeks: int | None = None
    stipend: int | None = None
    skills_required: list[str] | None = None
    eligibility: str | None = None
    max_participants: int | None = None
    status: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    application_deadline: datetime | None = None


class InternshipApplicationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    cover_letter: str = ""
    resume_url: str = ""


class InternshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    internship_id: str
    posted_by: str
    organization_id: str | None = None
    title: str
    description: str
    department: str
    location: str
    work_mode: str
    internship_type: str
    duration_weeks: int
    stipend: int
    currency: str
    skills_required: list[str]
    eligibility: str
    max_participants: int
    current_participants: int
    applicants_count: int
    views_count: int
    status: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    application_deadline: datetime | None = None
    is_paid: bool
    created_at: datetime
    updated_at: datetime
