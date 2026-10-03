from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(default="", max_length=50)
    email: EmailStr
    phone: str | None = None
    username: str = Field(..., min_length=3, max_length=30)
    country: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8, max_length=64)
    confirm_password: str = Field(..., min_length=8, max_length=64)
    professional_category: str | None = None
    organization_name: str | None = None
    registration_number: str | None = None
    license_number: str | None = None
    college: str | None = None
    graduation_year: int | None = None
    experience_years: int | None = Field(default=None, ge=0, le=60)
    specialization: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain a lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a number")
        if not any(not c.isalnum() for c in v):
            raise ValueError("Password must contain a special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict[str, Any] | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=64)
    confirm_password: str = Field(..., min_length=8, max_length=64)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain a lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a number")
        if not any(not c.isalnum() for c in v):
            raise ValueError("Password must contain a special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=64)
    confirm_password: str = Field(..., min_length=8, max_length=64)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain a lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a number")
        if not any(not c.isalnum() for c in v):
            raise ValueError("Password must contain a special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    first_name: str
    last_name: str
    username: str
    email: str
    role: str
    profile_photo: str | None = None
    headline: str | None = None
    verification_status: str
    email_verified: bool
    account_status: str
    profile_completion: int


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    session_id: str
    device_name: str
    browser: str
    os: str
    ip_address: str
    login_at: datetime
    last_activity: datetime


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    first_name: str
    last_name: str
    username: str
    email: str
    phone: str | None = None
    role: str
    country: str
    state: str
    city: str
    profile_photo: str | None = None
    cover_photo: str | None = None
    headline: str | None = None
    bio: str | None = None
    verification_status: str
    email_verified: bool
    account_status: str
    profile_completion: int
    created_at: datetime
