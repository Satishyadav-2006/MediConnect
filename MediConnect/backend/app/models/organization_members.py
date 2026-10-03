from datetime import datetime, timezone
from beanie import Indexed
from pymongo import ASCENDING, IndexModel
from pydantic import Field
from app.models.base import BaseDocument, OrganizationRole, OrganizationMemberStatus, PyObjectId


class OrganizationMember(BaseDocument):
    """Relationship between users and organizations."""
    class Settings:
        name = "organization_members"
        indexes = [
            "organization_id", "user_id", "department", "organization_role", "status",
            IndexModel(
                [("organization_id", ASCENDING), ("user_id", ASCENDING)],
                unique=True,
                name="org_member_unique",
            ),
        ]

    organization_id: str = Indexed()
    user_id: str = Indexed()
    organization_role: OrganizationRole = OrganizationRole.EMPLOYEE
    department: str = ""
    designation: str = ""
    employment_type: str = ""  # full_time, part_time, intern, consultant, resident, visiting, volunteer
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    left_at: datetime | None = None
    currently_active: bool = True
    status: OrganizationMemberStatus = OrganizationMemberStatus.ACTIVE


class Department(BaseDocument):
    """Organization departments."""
    class Settings:
        name = "departments"
        indexes = [
            "organization_id", "department_name", "department_code",
            IndexModel(
                [("organization_id", ASCENDING), ("department_name", ASCENDING)],
                unique=True,
                name="org_dept_unique",
            ),
        ]

    organization_id: str = Indexed()
    department_name: str = ""
    department_code: str = ""
    description: str = ""
    head_of_department: str | None = None
    status: str = "active"


class OrganizationVerification(BaseDocument):
    """Verification requests for organizations."""
    class Settings:
        name = "organization_verification"
        indexes = [
            "organization_id", "status", "submitted_at", "reviewed_by", "verification_type",
        ]

    organization_id: str = Indexed()
    submitted_by: str = Indexed()
    verification_type: str = ""  # registration, license, identity
    registration_documents: list[dict] = []
    license_documents: list[dict] = []
    supporting_documents: list[dict] = []
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: datetime | None = None
    reviewed_by: str | None = None
    status: str = "pending"
    remarks: str = ""
    history: list[dict] = []
