from datetime import datetime, timezone
from beanie import Indexed
from pydantic import BaseModel, Field

from app.models.base import BaseDocument, VerificationStatus


class OrganizationAddress(BaseModel):
    address_line_1: str = ""
    address_line_2: str = ""
    city: str = ""
    district: str = ""
    state: str = ""
    country: str = ""
    postal_code: str = ""
    latitude: float = 0.0
    longitude: float = 0.0


class OrganizationContactPerson(BaseModel):
    name: str = ""
    designation: str = ""
    email: str = ""
    phone: str = ""


class OrganizationSocialLinks(BaseModel):
    linkedin: str = ""
    twitter: str = ""
    facebook: str = ""
    instagram: str = ""
    website: str = ""
    youtube: str = ""


class Organization(BaseDocument):
    organization_id: str = Indexed(unique=True)
    owner_id: str = Indexed()
    organization_name: str = Indexed()
    organization_type: str = ""
    registration_number: str = ""
    license_number: str = ""

    logo: str | None = None
    banner: str | None = None
    description: str = ""

    website: str = ""
    email: str = ""
    phone: str = ""

    contact_person: OrganizationContactPerson = Field(
        default_factory=OrganizationContactPerson
    )
    address: OrganizationAddress = Field(default_factory=OrganizationAddress)

    country: str = ""
    state: str = Indexed()
    city: str = Indexed()

    social_links: OrganizationSocialLinks = Field(
        default_factory=OrganizationSocialLinks
    )

    verification_status: VerificationStatus = VerificationStatus.PENDING

    employee_count: int = 0
    followers_count: int = 0
    department_count: int = 0

    organization_status: str = "active"
    founded_year: int | None = None

    class Settings:
        name = "organizations"
        indexes = [
            "organization_id",
            "owner_id",
            "organization_name",
            "organization_type",
            "registration_number",
            "license_number",
            "verification_status",
            "organization_status",
            "country",
            "state",
            "city",
            "created_at",
            [("organization_name", "text"), ("description", "text")],
        ]
