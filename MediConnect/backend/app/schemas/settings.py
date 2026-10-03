from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PrivacySettingsUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    profile_visibility: str | None = None
    email_visibility: str | None = None
    phone_visibility: str | None = None
    profile_photo_visibility: str | None = None
    activity_visibility: str | None = None
    followers_visibility: str | None = None
    connections_visibility: str | None = None
    research_visibility: str | None = None


class NotificationSettingsUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    messages: bool | None = None
    connections: bool | None = None
    followers: bool | None = None
    jobs: bool | None = None
    internships: bool | None = None
    events: bool | None = None
    mentorship: bool | None = None
    research: bool | None = None
    organization_updates: bool | None = None
    comments: bool | None = None
    likes: bool | None = None
    connection_requests: bool | None = None
    email_notifications: bool | None = None
    push_notifications: bool | None = None


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=64)


class EmailUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    new_email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)


class AccountDeactivateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    password: str = Field(..., min_length=1)
    reason: str | None = None


class AppearanceUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    theme: str = Field(default="light", pattern="^(light|dark|system)$")


class LanguageUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    language: str = Field(default="en", min_length=2, max_length=10)


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    device_name: str
    browser: str
    os: str
    ip_address: str
    login_at: datetime
    last_activity: datetime


class BlockedUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    username: str
    first_name: str
    last_name: str
    profile_photo: str | None = None
    blocked_at: datetime


class PrivacySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    profile_visibility: str = "public"
    email_visibility: str = "connections_only"
    phone_visibility: str = "private"
    profile_photo_visibility: str = "public"
    activity_visibility: str = "public"
    followers_visibility: str = "public"
    connections_visibility: str = "public"
    research_visibility: str = "public"


class NotificationSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    messages: bool = True
    connections: bool = True
    followers: bool = True
    jobs: bool = True
    internships: bool = True
    events: bool = True
    mentorship: bool = True
    research: bool = True
    organization_updates: bool = True
    comments: bool = True
    likes: bool = True
    connection_requests: bool = True
    email_notifications: bool = True
    push_notifications: bool = True


class AllSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    privacy: PrivacySettingsResponse
    notifications: NotificationSettingsResponse
    theme: str = "light"
    language: str = "en"


class AccountSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    username: str
    account_status: str
    email_verified: bool
    created_at: datetime
