from datetime import datetime
from beanie import Indexed
from pydantic import BaseModel, Field, ConfigDict

from app.models.base import BaseDocument, AccountStatus, UserRole, VerificationStatus
from app.models.verification import VerificationDocument


class EducationItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    degree: str = ""
    course: str = ""
    specialization: str = ""
    institution: str = ""
    university: str = ""
    country: str = ""
    state: str = ""
    city: str = ""
    start_date: datetime | None = None
    end_date: datetime | None = None
    currently_studying: bool = False
    grade: str = ""
    description: str = ""


class ExperienceItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    organization_name: str = ""
    organization_id: str | None = None
    designation: str = ""
    department: str = ""
    employment_type: str = ""
    location: str = ""
    start_date: datetime | None = None
    end_date: datetime | None = None
    currently_working: bool = False
    description: str = ""


class CertificationItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    certificate_name: str = ""
    issuing_organization: str = ""
    issue_date: datetime | None = None
    expiry_date: datetime | None = None
    credential_id: str = ""
    credential_url: str = ""


class SkillItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    skill_name: str = ""
    category: str = ""
    experience_level: str = ""
    years_of_experience: int = 0
    verified: bool = False


class LanguageItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    language: str = ""
    reading: bool = False
    writing: bool = False
    speaking: bool = False
    proficiency: str = "beginner"


class PrivacySettings(BaseModel):
    profile_visibility: str = "public"
    phone_visibility: str = "private"
    email_visibility: str = "connections_only"
    activity_visibility: str = "public"
    connection_visibility: str = "public"
    followers_visibility: str = "public"
    research_visibility: str = "public"


class NotificationSettings(BaseModel):
    messages: bool = True
    jobs: bool = True
    internships: bool = True
    events: bool = True
    mentorship: bool = True
    research: bool = True
    connections: bool = True
    push_notifications: bool = True
    email_notifications: bool = True


class SocialLinks(BaseModel):
    linkedin: str = ""
    website: str = ""
    portfolio: str = ""
    github: str = ""
    twitter: str = ""
    other_links: list[str] = Field(default_factory=list)


class ResearchPublication(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str = ""
    publication: str = ""
    journal: str = ""
    conference: str = ""
    doi: str = ""
    publication_date: datetime | None = None
    authors: list[str] = Field(default_factory=list)
    files: list[str] = Field(default_factory=list)
    links: list[str] = Field(default_factory=list)
    research_area: str = ""
    keywords: list[str] = Field(default_factory=list)


class User(BaseDocument):
    user_id: str = Indexed(unique=True)
    first_name: str
    last_name: str
    middle_name: str | None = None
    username: str = Indexed(unique=True)
    email: str = Indexed(unique=True)
    phone: str | None = Indexed(unique=True, default=None)
    password_hash: str
    role: UserRole = UserRole.DOCTOR

    date_of_birth: datetime | None = None
    gender: str | None = None
    address: str | None = None

    profile_photo: str | None = None
    cover_photo: str | None = None
    headline: str | None = None
    bio: str | None = None

    country: str = ""
    state: str = ""
    city: str = ""

    organization_id: str | None = None
    department: str = ""
    designation: str = ""

    education: list[EducationItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    skills: list[SkillItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)
    research_publications: list[ResearchPublication] = Field(default_factory=list)

    verification_status: VerificationStatus = VerificationStatus.PENDING
    account_status: AccountStatus = AccountStatus.PENDING_EMAIL_VERIFICATION
    profile_completion: int = 0

    privacy_settings: PrivacySettings = Field(default_factory=PrivacySettings)
    notification_settings: NotificationSettings = Field(default_factory=NotificationSettings)
    social_links: SocialLinks = Field(default_factory=SocialLinks)

    professional_category: str | None = None
    registration_number: str | None = None
    license_number: str | None = None
    medical_council: str | None = None
    specialization: str | None = None
    experience_years: int | None = None

    mentor_available: bool = False

    last_login: datetime | None = None
    last_active: datetime | None = None
    email_verified: bool = False

    failed_login_attempts: int = 0
    locked_until: datetime | None = None

    otp_secret: str | None = None
    otp_code: str | None = None
    otp_attempts: int = 0
    otp_expires_at: datetime | None = None
    otp_last_sent_at: datetime | None = None

    password_reset_token: str | None = None
    password_reset_expires: datetime | None = None

    refresh_tokens: list[str] = Field(default_factory=list)
    sessions: list[dict] = Field(default_factory=list)

    saved_jobs: list[str] = Field(default_factory=list)
    saved_internships: list[str] = Field(default_factory=list)
    saved_events: list[str] = Field(default_factory=list)
    
    verification_documents: list[VerificationDocument] = Field(default_factory=list)
    verification_history: list[dict] = Field(default_factory=list)

    password_history: list[str] = Field(default_factory=list)

    last_login_ip: str | None = None

    class Settings:
        name = "users"
        indexes = [
            "user_id",
            "email",
            "username",
            "phone",
            "role",
            "account_status",
            "verification_status",
            "mentor_available",
            "created_at",
            "organization_id",
            "department",
            "country",
            "state",
            "city",
            "last_active",
            [("first_name", "text"), ("last_name", "text"), ("headline", "text"), ("bio", "text"), ("skills.skill_name", "text")],
        ]
