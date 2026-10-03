import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError, AuthenticationError, ConflictError, ValidationAppError
from app.schemas.settings import (
    PrivacySettingsUpdate,
    NotificationSettingsUpdate,
    PasswordChangeRequest,
    EmailUpdateRequest,
    AccountDeactivateRequest,
    AppearanceUpdateRequest,
)


def _make_user(**overrides):
    user = MagicMock()
    user.user_id = "user-1"
    user.email = "test@test.com"
    user.username = "testuser"
    user.password_hash = "hashedpw"
    user.account_status.value = "verified"
    user.email_verified = True
    user.created_at = datetime.now(timezone.utc)
    user.theme = "light"
    user.language = "en"
    user.sessions = []
    user.password_history = []
    user.refresh_tokens = []
    user.privacy_settings = MagicMock()
    user.privacy_settings.model_dump.return_value = {
        "profile_visibility": "public",
        "email_visibility": "connections_only",
        "phone_visibility": "private",
    }
    user.notification_settings = MagicMock()
    user.notification_settings.model_dump.return_value = {
        "messages": True,
        "connections": True,
        "jobs": True,
        "email_notifications": True,
        "push_notifications": True,
    }
    for k, v in overrides.items():
        setattr(user, k, v)
    return user


class TestPrivacySettings:
    @pytest.mark.asyncio
    async def test_update_privacy_settings(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            result = await SettingsService.update_privacy_settings(
                "user-1",
                PrivacySettingsUpdate(profile_visibility="private"),
            )
            assert result["message"] == "Privacy settings updated successfully"

    @pytest.mark.asyncio
    async def test_update_privacy_not_found(self):
        from app.services.settings_service import SettingsService
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await SettingsService.update_privacy_settings(
                    "missing",
                    PrivacySettingsUpdate(profile_visibility="private"),
                )


class TestNotificationSettings:
    @pytest.mark.asyncio
    async def test_update_notification_settings(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            result = await SettingsService.update_notification_settings(
                "user-1",
                NotificationSettingsUpdate(messages=False, jobs=True),
            )
            assert result["message"] == "Notification settings updated successfully"

    @pytest.mark.asyncio
    async def test_update_notification_not_found(self):
        from app.services.settings_service import SettingsService
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await SettingsService.update_notification_settings(
                    "missing",
                    NotificationSettingsUpdate(messages=False),
                )


class TestGetAllSettings:
    @pytest.mark.asyncio
    async def test_get_all_settings(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await SettingsService.get_all_settings("user-1")
            assert "privacy" in result
            assert "notifications" in result
            assert "theme" in result
            assert "language" in result

    @pytest.mark.asyncio
    async def test_get_all_settings_not_found(self):
        from app.services.settings_service import SettingsService
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await SettingsService.get_all_settings("missing")


class TestChangePassword:
    @pytest.mark.asyncio
    async def test_change_password_success(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo, \
             patch("app.services.settings_service.verify_password", return_value=True), \
             patch("app.services.settings_service.validate_password_strength", return_value=(True, "Password is strong")), \
             patch("app.services.settings_service.hash_password", return_value="newhash"):
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            result = await SettingsService.change_password(
                "user-1",
                PasswordChangeRequest(current_password="OldPass1!", new_password="NewStr0ng!Pass"),
            )
            assert result["message"] == "Password changed successfully"

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo, \
             patch("app.services.settings_service.verify_password", return_value=False):
            repo.find_by_user_id = AsyncMock(return_value=user)
            with pytest.raises(AuthenticationError):
                await SettingsService.change_password(
                    "user-1",
                    PasswordChangeRequest(current_password="Wrong1!", new_password="NewStr0ng!Pass"),
                )

    @pytest.mark.asyncio
    async def test_change_password_common_reject(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo, \
             patch("app.services.settings_service.verify_password", return_value=True), \
             patch("app.services.settings_service.validate_password_strength", return_value=(False, "Password is too common")):
            repo.find_by_user_id = AsyncMock(return_value=user)
            with pytest.raises(ValidationAppError):
                await SettingsService.change_password(
                    "user-1",
                    PasswordChangeRequest(current_password="OldPass1!", new_password="password123"),
                )


class TestUpdateEmail:
    @pytest.mark.asyncio
    async def test_update_email_success(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo, \
             patch("app.services.settings_service.verify_password", return_value=True):
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.find_by_email = AsyncMock(return_value=None)
            repo.update_user = AsyncMock()
            result = await SettingsService.update_email(
                "user-1",
                EmailUpdateRequest(new_email="new@test.com", password="Pass1!"),
            )
            assert "verify" in result["message"].lower()


class TestDeactivateAccount:
    @pytest.mark.asyncio
    async def test_deactivate_account_success(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo, \
             patch("app.services.settings_service.verify_password", return_value=True):
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            result = await SettingsService.deactivate_account(
                "user-1",
                AccountDeactivateRequest(password="Pass1!"),
            )
            assert result["message"] == "Account deactivated successfully"


class TestAppearance:
    @pytest.mark.asyncio
    async def test_update_appearance(self):
        from app.services.settings_service import SettingsService
        user = _make_user()
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            repo.update_user = AsyncMock()
            result = await SettingsService.update_appearance(
                "user-1",
                AppearanceUpdateRequest(theme="dark"),
            )
            assert result["message"] == "Appearance updated successfully"


class TestSessions:
    @pytest.mark.asyncio
    async def test_get_sessions_empty(self):
        from app.services.settings_service import SettingsService
        user = _make_user(sessions=[])
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await SettingsService.get_sessions("user-1")
            assert result == []

    @pytest.mark.asyncio
    async def test_get_sessions_not_found(self):
        from app.services.settings_service import SettingsService
        with patch("app.services.settings_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await SettingsService.get_sessions("missing")


class TestBlockedUsers:
    @pytest.mark.asyncio
    async def test_get_blocked_users_forwards_pagination(self):
        from app.services.settings_service import SettingsService
        expected = {
            "items": [],
            "total": 0,
            "page": 1,
            "per_page": 20,
            "total_pages": 0,
            "has_more": False,
            "next_cursor": None,
            "prev_cursor": None,
        }
        with patch("app.services.settings_service.ConnectionService.get_blocked_users", new_callable=AsyncMock, return_value=expected) as m:
            result = await SettingsService.get_blocked_users("user-1", 1, 20)
            m.assert_awaited_once_with("user-1", 1, 20)
            assert result == expected


class TestSettingsDefaults:
    @pytest.mark.asyncio
    async def test_settings_default_values(self):
        from app.schemas.settings import (
            PrivacySettingsResponse,
            NotificationSettingsResponse,
            AllSettingsResponse,
        )
        ps = PrivacySettingsResponse()
        assert ps.profile_visibility == "public"
        assert ps.email_visibility == "connections_only"
        assert ps.phone_visibility == "private"

        ns = NotificationSettingsResponse()
        assert ns.messages is True
        assert ns.jobs is True
        assert ns.push_notifications is True

        all_s = AllSettingsResponse(privacy=ps, notifications=ns)
        assert all_s.theme == "light"
        assert all_s.language == "en"
