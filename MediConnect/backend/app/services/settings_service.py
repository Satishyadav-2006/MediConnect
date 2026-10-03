import logging
import secrets
from datetime import datetime, timezone
from typing import Any

from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError, AuthenticationError, ValidationAppError
from app.core.security import verify_password, hash_password, validate_password_strength
from app.services.connection_service import ConnectionService

from app.schemas.settings import (
    PrivacySettingsUpdate,
    NotificationSettingsUpdate,
    PasswordChangeRequest,
    EmailUpdateRequest,
    AccountDeactivateRequest,
    AppearanceUpdateRequest,
    LanguageUpdateRequest,
)

logger = logging.getLogger(__name__)


class SettingsService:

    @staticmethod
    async def get_all_settings(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return {
            "privacy": user.privacy_settings.model_dump(),
            "notifications": user.notification_settings.model_dump(),
            "theme": getattr(user, "theme", "light"),
            "language": getattr(user, "language", "en"),
        }

    @staticmethod
    async def get_privacy_settings(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user.privacy_settings.model_dump()

    @staticmethod
    async def update_privacy_settings(user_id: str, data: PrivacySettingsUpdate) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        privacy_data = data.model_dump(exclude_unset=True)
        for key, value in privacy_data.items():
            if value is not None:
                setattr(user.privacy_settings, key, value)
        await UserRepository.update_user(user)
        return {"message": "Privacy settings updated successfully"}

    @staticmethod
    async def get_notification_settings(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user.notification_settings.model_dump()

    @staticmethod
    async def update_notification_settings(user_id: str, data: NotificationSettingsUpdate) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        notif_data = data.model_dump(exclude_unset=True)
        for key, value in notif_data.items():
            if value is not None:
                setattr(user.notification_settings, key, value)
        await UserRepository.update_user(user)
        return {"message": "Notification settings updated successfully"}

    @staticmethod
    async def change_password(user_id: str, data: PasswordChangeRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not verify_password(data.current_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")
        valid, msg = validate_password_strength(data.new_password)
        if not valid:
            raise ValidationAppError(msg)
        user.password_hash = hash_password(data.new_password)
        if not user.password_history:
            user.password_history = []
        user.password_history.append(user.password_hash)
        if len(user.password_history) > 10:
            user.password_history = user.password_history[-10:]
        await UserRepository.update_user(user)
        return {"message": "Password changed successfully"}

    @staticmethod
    async def update_email(user_id: str, data: EmailUpdateRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Password is incorrect")
        existing = await UserRepository.find_by_email(data.new_email)
        if existing and existing.user_id != user_id:
            raise ConflictError("Email already in use")
        user.email = data.new_email.lower().strip()
        user.email_verified = False
        await UserRepository.update_user(user)
        return {"message": "Email updated. Please verify your new email."}

    @staticmethod
    async def deactivate_account(user_id: str, data: AccountDeactivateRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Password is incorrect")
        user.account_status = "deactivated"
        user.refresh_tokens = []
        await UserRepository.update_user(user)
        return {"message": "Account deactivated successfully"}

    @staticmethod
    async def update_appearance(user_id: str, data: AppearanceUpdateRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        user.theme = data.theme
        await UserRepository.update_user(user)
        return {"message": "Appearance updated successfully"}

    @staticmethod
    async def get_sessions(user_id: str) -> list[dict[str, Any]]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        sessions = user.sessions or []
        return [
            {
                "session_id": s.get("session_id") if isinstance(s, dict) else getattr(s, "session_id", None),
                "device_name": s.get("device_name") if isinstance(s, dict) else getattr(s, "device_name", None),
                "browser": s.get("browser") if isinstance(s, dict) else getattr(s, "browser", None),
                "os": s.get("os") if isinstance(s, dict) else getattr(s, "os", None),
                "ip_address": s.get("ip_address") if isinstance(s, dict) else getattr(s, "ip_address", None),
                "login_at": s.get("login_at") if isinstance(s, dict) else getattr(s, "login_at", None),
                "last_activity": s.get("last_activity") if isinstance(s, dict) else getattr(s, "last_activity", None),
            }
            for s in sessions
        ]

    @staticmethod
    async def get_account_settings(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return {
            "user_id": user.user_id,
            "email": user.email,
            "username": user.username,
            "account_status": user.account_status.value if hasattr(user.account_status, "value") else user.account_status,
            "email_verified": user.email_verified,
            "created_at": user.created_at,
        }

    @staticmethod
    async def get_blocked_users(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        return await ConnectionService.get_blocked_users(user_id, page, per_page)

    @staticmethod
    async def unblock_user(user_id: str, target_user_id: str) -> dict[str, str]:
        return await ConnectionService.unblock_user(user_id, target_user_id)
