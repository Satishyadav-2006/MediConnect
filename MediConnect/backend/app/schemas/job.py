from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class JobCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=10000)
    organization_id: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    education: str = ""
    department: str = ""
    location: str = ""
    work_mode: str = "onsite"
    job_type: str = "full_time"
    experience_level: str = "mid"
    specialization_required: str = ""
    qualification_required: str = ""
    skills_required: list[str] = Field(default_factory=list)
    benefits: list[dict] = Field(default_factory=list)
    salary_range: dict = Field(default_factory=dict)
    vacancies: int = 1
    application_deadline: datetime | None = None
    is_urgent: bool = False
    visibility: str = "public"


class JobUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    responsibilities: list[str] | None = None
    requirements: list[str] | None = None
    education: str | None = None
    department: str | None = None
    location: str | None = None
    work_mode: str | None = None
    job_type: str | None = None
    experience_level: str | None = None
    skills_required: list[str] | None = None
    salary_range: dict | None = None
    vacancies: int | None = None
    status: str | None = None
    visibility: str | None = None
    application_deadline: datetime | None = None
    is_urgent: bool | None = None


class JobApplicationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    cover_letter: str = ""
    resume_url: str = ""


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    job_id: str
    posted_by: str
    recruiter_id: str | None = None
    organization_id: str | None = None
    title: str
    description: str
    responsibilities: list[str]
    requirements: list[str]
    education: str
    department: str
    location: str
    work_mode: str
    job_type: str
    experience_level: str
    specialization_required: str
    qualification_required: str
    skills_required: list[str]
    salary_range: dict
    vacancies: int
    applicants_count: int
    views_count: int
    status: str
    visibility: str
    application_deadline: datetime | None = None
    is_urgent: bool
    created_at: datetime
    updated_at: datetime
