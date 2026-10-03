from datetime import datetime, timezone
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from pymongo import ASCENDING, IndexModel
from app.models.base import BaseDocument, InternshipStatus, InternshipType, WorkMode, ApplicationStatus


class Stipend(BaseModel):
    minimum_stipend: int = 0
    maximum_stipend: int = 0
    currency: str = "INR"


class Internship(BaseDocument):
    internship_id: str = Indexed(unique=True)
    mentor_id: str | None = Indexed(default=None)
    organization_id: str | None = None
    title: str = ""
    description: str = ""
    department: str = ""
    location: str = ""
    work_mode: WorkMode = WorkMode.ONSITE
    internship_type: InternshipType = InternshipType.CLINICAL
    duration: int = 0
    stipend: Stipend = Field(default_factory=Stipend)
    skills: list[str] = Field(default_factory=list)
    eligibility: str = ""
    vacancies: int = 0
    application_count: int = 0
    current_participants: int = 0
    status: InternshipStatus = InternshipStatus.DRAFT
    start_date: datetime | None = None
    end_date: datetime | None = None
    deadline: datetime | None = None
    is_paid: bool = False

    class Settings:
        name = "internships"
        indexes = [
            "internship_id", "organization_id", "created_at",
            "status", "department", "work_mode", "location", "deadline",
            ("status", "deadline"),
        ]


class InternshipApplication(BaseDocument):
    application_id: str = Indexed(unique=True)
    internship_id: str = Indexed()
    applicant_id: str = Indexed()
    cover_letter: str = ""
    resume_url: str = ""
    status: ApplicationStatus = ApplicationStatus.APPLIED
    applied_at: datetime | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    answers: list[dict] = Field(default_factory=list)

    class Settings:
        name = "internship_applications"
        indexes = [
            "application_id", "internship_id", "applicant_id", "status", "applied_at",
            IndexModel(
                [("internship_id", ASCENDING), ("applicant_id", ASCENDING)],
                unique=True,
                name="internship_applicant_unique",
            ),
        ]