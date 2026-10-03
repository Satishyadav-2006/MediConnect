from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict


class OrganizationCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=2, max_length=200)
    organization_type: str = Field(..., min_length=1)
    registration_number: str | None = None
    description: str | None = Field(default=None, max_length=5000)
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    country: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    address: str | None = None


class OrganizationUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=2, max_length=200)
    organization_type: str | None = None
    description: str | None = Field(default=None, max_length=5000)
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None
    logo: str | None = None
    banner: str | None = None


class EmployeeAddRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    department: str = Field("", max_length=120)
    designation: str = Field("", max_length=120)
    role: str = "employee"


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    organization_id: str
    owner_id: str
    name: str
    organization_type: str
    registration_number: str | None = None
    logo: str | None = None
    banner: str | None = None
    description: str = ""
    website: str = ""
    email: str = ""
    phone: str = ""
    country: str = ""
    state: str = ""
    city: str = ""
    address: str = ""
    verification_status: str
    employee_count: int = 0
    followers_count: int = 0
    posts_count: int = 0
    jobs_count: int = 0
    events_count: int = 0
    is_active: bool = True
    created_at: datetime


class OrganizationSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    organization_id: str
    name: str
    organization_type: str
    logo: str | None = None
    description: str = ""
    country: str = ""
    city: str = ""
    verification_status: str = ""
    employee_count: int = 0
    followers_count: int = 0


class DepartmentRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(..., min_length=1)
    head: str | None = None
