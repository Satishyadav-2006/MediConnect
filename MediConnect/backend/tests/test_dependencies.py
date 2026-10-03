import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from types import SimpleNamespace

from app.core.exceptions import AuthorizationError
from app.core.dependencies import (
    get_current_recruiter_or_organization,
    require_role,
)

ALLOWED_RECRUITER_ROLES = [
    "hospital", "clinic", "medical_college", "nursing_college", "pharmacy_college", "allied_health_college",
    "hr", "recruiter", "placement_officer",
    "moderator", "admin", "super_admin", "owner",
]

INDIVIDUAL_ROLES = [
    "doctor", "nurse", "dentist", "pharmacist", "physiotherapist", "radiologist",
    "lab_technician", "allied_health", "medical_student", "nursing_student",
    "pharmacy_student", "physiotherapy_student", "faculty", "professor", "researcher",
]


def _make_request(role: str):
    return SimpleNamespace(state=SimpleNamespace(token_payload={"role": role}))


class TestGetCurrentRecruiterOrOrganization:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("role", ALLOWED_RECRUITER_ROLES)
    async def test_allows_recruiter_and_org_roles(self, role):
        request = _make_request(role)
        result = await get_current_recruiter_or_organization(request, user_id="user-1")
        assert result == "user-1"

    @pytest.mark.asyncio
    @pytest.mark.parametrize("role", INDIVIDUAL_ROLES)
    async def test_rejects_individual_professional_roles(self, role):
        request = _make_request(role)
        with pytest.raises(AuthorizationError):
            await get_current_recruiter_or_organization(request, user_id="user-1")


class TestRequireRole:
    @pytest.mark.asyncio
    async def test_allows_listed_role(self):
        request = _make_request("hospital")
        result = await require_role("hospital", "clinic")(request, user_id="user-1")
        assert result == "hospital"

    @pytest.mark.asyncio
    async def test_rejects_unlisted_role(self):
        request = _make_request("doctor")
        with pytest.raises(AuthorizationError):
            await require_role("hospital", "clinic")(request, user_id="user-1")
