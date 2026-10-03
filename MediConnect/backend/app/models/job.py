from datetime import datetime, timezone
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from pymongo import ASCENDING, TEXT, IndexModel
from app.models.base import BaseDocument, JobStatus, JobType, WorkMode, ExperienceLevel, JobVisibility, ApplicationStatus


class SalaryRange(BaseModel):
    minimum_salary: int = 0
    maximum_salary: int = 0
    currency: str = "USD"


class Job(BaseDocument):
    job_id: str = Indexed(unique=True)
    recruiter_id: str | None = Indexed(default=None)
    organization_id: str | None = None
    title: str = ""
    description: str = ""
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    education: str = ""
    department: str = ""
    specialization_required: str = ""
    qualification_required: str = ""
    location: str = ""
    work_mode: WorkMode = WorkMode.ONSITE
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID
    skills: list[str] = Field(default_factory=list)
    benefits: list[dict] = Field(default_factory=list)
    salary: SalaryRange = Field(default_factory=SalaryRange)
    vacancies: int = 1
    application_count: int = 0
    status: JobStatus = JobStatus.DRAFT
    deadline: datetime | None = None
    is_urgent: bool = False
    visibility: JobVisibility = JobVisibility.PUBLIC
    search_keywords: list[str] = Field(default_factory=list)

    @property
    def employment_type(self) -> JobType:
        return self.job_type

    @property
    def specialization(self) -> str:
        return self.specialization_required

    class Settings:
        name = "jobs"
        indexes = [
            "job_id", "recruiter_id", "organization_id", "created_at",
            "status", "job_type", "work_mode", "location",
            "department", "specialization_required", "deadline",
            ("status", "deadline"),
            ("organization_id", "status"),
            ("specialization_required", "location"),
            IndexModel(
                [("title", TEXT), ("description", TEXT), ("skills", TEXT)],
                name="text_search",
            ),
        ]


class JobApplication(BaseDocument):
    application_id: str = Indexed(unique=True)
    job_id: str = Indexed()
    applicant_id: str = Indexed()
    cover_letter: str = ""
    resume_url: str = ""
    status: ApplicationStatus = ApplicationStatus.APPLIED
    applied_at: datetime | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    answers: list[dict] = Field(default_factory=list)

    class Settings:
        name = "job_applications"
        indexes = [
            "application_id", "job_id", "applicant_id", "status", "applied_at",
            IndexModel(
                [("job_id", ASCENDING), ("applicant_id", ASCENDING)],
                unique=True,
                name="job_applicant_unique",
            ),
        ]