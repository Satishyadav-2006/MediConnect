import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-32chars!!")
os.environ.setdefault("JWT_REFRESH_SECRET_KEY", "test-refresh-secret-key-for-testing-only-32")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "mediconnect_test")

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import NotFoundError
from app.models.base import VerificationStatus
from app.models.verification import VerificationRequest, VerificationDocument
from app.schemas.user import VerificationSubmitRequest


def _verification_user(**overrides):
    user = MagicMock()
    user.user_id = overrides.get("user_id", "user-1")
    user.registration_number = overrides.get("registration_number", None)
    user.medical_council = overrides.get("medical_council", None)
    user.license_number = overrides.get("license_number", None)
    user.verification_status = overrides.get("verification_status", VerificationStatus.PENDING)
    user.verification_documents = []
    user.verification_history = []
    return user


class TestVerificationStatusEnum:
    def test_expected_states_exist(self):
        values = {s.value for s in VerificationStatus}
        assert {"pending", "under_review", "approved", "rejected"} <= values

    def test_default_request_status_is_pending(self):
        assert VerificationRequest.model_fields["status"].default == VerificationStatus.PENDING
        assert VerificationRequest.model_fields["verification_type"].default == ""

    def test_supporting_document_defaults(self):
        doc = VerificationDocument(cloudinary_url="https://x/y.pdf")
        assert doc.cloudinary_url == "https://x/y.pdf"
        assert doc.file_size == 0
        assert doc.mime_type == ""


class TestSubmitVerification:
    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from app.services.user_service import UserService

        with patch("app.services.user_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await UserService.submit_verification("ghost", VerificationSubmitRequest(method="license"))

    @pytest.mark.asyncio
    async def test_submit_sets_under_review_and_creates_request(self):
        from app.services.user_service import UserService

        user = _verification_user()
        data = VerificationSubmitRequest(
            method="license",
            registration_number="REG-123",
            issuing_authority="State Medical Council",
            document_urls=["https://x/a.pdf", "https://x/b.pdf"],
        )

        inserted = MagicMock()
        inserted.insert = AsyncMock()
        MockRequest = MagicMock(return_value=inserted)
        MockRequest.find.return_value.delete = AsyncMock()

        with patch("app.services.user_service.UserRepository") as repo, \
             patch("app.models.verification.VerificationRequest", MockRequest):
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            result = await UserService.submit_verification("user-1", data)

        assert result["message"] == "Verification submitted. Under review."
        assert user.verification_status == VerificationStatus.UNDER_REVIEW
        assert user.registration_number == "REG-123"
        assert user.medical_council == "State Medical Council"
        assert len(user.verification_documents) == 2
        assert len(user.verification_history) == 1
        assert user.verification_history[0]["decision"] == "pending"
        repo.update_user.assert_awaited_once_with(user)
        inserted.insert.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_resubmit_replaces_previous_request(self):
        from app.services.user_service import UserService

        user = _verification_user(verification_status=VerificationStatus.REJECTED)
        data = VerificationSubmitRequest(method="license", registration_number="REG-9")

        inserted = MagicMock()
        inserted.insert = AsyncMock()
        MockRequest = MagicMock(return_value=inserted)
        delete_mock = AsyncMock()
        MockRequest.find.return_value.delete = delete_mock

        with patch("app.services.user_service.UserRepository") as repo, \
             patch("app.models.verification.VerificationRequest", MockRequest):
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            await UserService.submit_verification("user-1", data)

        # The old request is deleted before the new one is inserted.
        delete_mock.assert_awaited_once()
        inserted.insert.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_submit_without_optional_fields(self):
        from app.services.user_service import UserService

        user = _verification_user()
        data = VerificationSubmitRequest(method="license")

        inserted = MagicMock()
        inserted.insert = AsyncMock()
        MockRequest = MagicMock(return_value=inserted)
        MockRequest.find.return_value.delete = AsyncMock()

        with patch("app.services.user_service.UserRepository") as repo, \
             patch("app.models.verification.VerificationRequest", MockRequest):
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            await UserService.submit_verification("user-1", data)

        assert user.registration_number is None
        assert user.verification_documents == []
        assert user.verification_history[0]["remarks"] == ""


class TestGetVerificationStatus:
    @pytest.mark.asyncio
    async def test_status_not_found(self):
        from app.services.user_service import UserService

        with patch("app.services.user_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await UserService.get_verification_status("ghost")

    @pytest.mark.asyncio
    async def test_status_returns_value_and_registration(self):
        from app.services.user_service import UserService

        user = _verification_user(verification_status=VerificationStatus.APPROVED, registration_number="REG-77")
        with patch("app.services.user_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await UserService.get_verification_status("user-1")

        assert result["status"] == "approved"
        assert result["registration_number"] == "REG-77"

    @pytest.mark.asyncio
    async def test_status_pending_default(self):
        from app.services.user_service import UserService

        user = _verification_user()
        with patch("app.services.user_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await UserService.get_verification_status("user-1")

        assert result["status"] == "pending"
