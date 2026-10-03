from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str | None = Field(default=None, min_length=1, max_length=50)
    last_name: str | None = Field(default=None, min_length=1, max_length=50)
    phone: str | None = None
    headline: str | None = None
    bio: str | None = Field(default=None, max_length=2000)
    country: str | None = None
    state: str | None = None
    city: str | None = None
    professional_category: str | None = None
    specialization: str | None = None
    department: str | None = None
    designation: str | None = None
    experience_years: int | None = Field(default=None, ge=0, le=60)
    organization_id: str | None = None
    registration_number: str | None = None
    license_number: str | None = None
    interests: list[str] | None = None


class EducationUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    degree: str = ""
    institution: str = ""
    university: str = ""
    country: str = ""
    start_year: int | None = None
    end_year: int | None = None
    grade: str = ""
    description: str = ""


class ExperienceUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    organization: str = ""
    designation: str = ""
    department: str = ""
    employment_type: str = ""
    location: str = ""
    start_date: datetime | None = None
    end_date: datetime | None = None
    currently_working: bool = False
    description: str = ""


class SkillUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    skill_name: str = Field(..., min_length=1)
    skill_category: str = ""
    experience_level: str = "beginner"
    years: int = Field(default=0, ge=0, le=50)


class CertificationUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    certificate_name: str = Field(..., min_length=1)
    issuer: str = ""
    issue_date: datetime | None = None
    expiry_date: datetime | None = None
    credential_id: str = ""
    credential_url: str = ""


class LanguageUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    language: str = Field(..., min_length=1)
    read: bool = False
    write: bool = False
    speak: bool = False
    proficiency: str = "beginner"


class SocialLinksUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    linkedin: str = ""
    portfolio: str = ""
    researchgate: str = ""
    google_scholar: str = ""
    orcid: str = ""
    personal_website: str = ""


class PrivacyUpdateRequest(BaseModel):
    profile_visibility: str | None = None
    email_visibility: str | None = None
    phone_visibility: str | None = None
    profile_photo_visibility: str | None = None
    activity_visibility: str | None = None
    followers_visibility: str | None = None
    connections_visibility: str | None = None
    research_visibility: str | None = None


class NotificationSettingsUpdateRequest(BaseModel):
    messages: bool | None = None
    connections: bool | None = None
    followers: bool | None = None
    jobs: bool | None = None
    internships: bool | None = None
    events: bool | None = None
    mentorship: bool | None = None
    research: bool | None = None
    email_notifications: bool | None = None
    push_notifications: bool | None = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    first_name: str
    last_name: str
    username: str
    email: str
    phone: str | None = None
    role: str
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
    experience_years: int = 0
    specialization: str = ""
    verification_status: str
    email_verified: bool
    account_status: str
    profile_completion: int
    followers_count: int = 0
    following_count: int = 0
    connections_count: int = 0
    posts_count: int = 0
    created_at: datetime


class UserSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    first_name: str
    last_name: str
    username: str
    profile_photo: str | None = None
    headline: str | None = None
    role: str
    specialization: str = ""
    country: str = ""
    city: str = ""
    verification_status: str = ""
    followers_count: int = 0


class VerificationSubmitRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    method: str = Field(..., min_length=1)
    registration_number: str | None = None
    issuing_authority: str | None = None
    document_urls: list[str] = Field(default_factory=list)
    notes: str | None = None


class VerificationStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    reviewed_by: str | None = None
    reason: str | None = None
    remarks: str | None = None
