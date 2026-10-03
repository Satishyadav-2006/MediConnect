from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response
from app.schemas.settings import (
    PrivacySettingsUpdate,
    NotificationSettingsUpdate,
    PasswordChangeRequest,
    EmailUpdateRequest,
    AccountDeactivateRequest,
    AppearanceUpdateRequest,
    LanguageUpdateRequest,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
async def get_all_settings(user_id: str = Depends(get_current_user_id)):
    result = await SettingsService.get_all_settings(user_id)
    return success_response("Settings retrieved", result)


@router.get("/privacy")
async def get_privacy_settings(user_id: str = Depends(get_current_user_id)):
    result = await SettingsService.get_privacy_settings(user_id)
    return success_response("Privacy settings retrieved", result)


@router.put("/privacy")
async def update_privacy_settings(
    body: PrivacySettingsUpdate,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.update_privacy_settings(user_id, body)
    return success_response(result["message"])


@router.get("/notifications")
async def get_notification_settings(user_id: str = Depends(get_current_user_id)):
    result = await SettingsService.get_notification_settings(user_id)
    return success_response("Notification settings retrieved", result)


@router.put("/notifications")
async def update_notification_settings(
    body: NotificationSettingsUpdate,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.update_notification_settings(user_id, body)
    return success_response(result["message"])


@router.put("/password")
async def change_password(
    body: PasswordChangeRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.change_password(user_id, body)
    return success_response(result["message"])


@router.put("/email")
async def update_email(
    body: EmailUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.update_email(user_id, body)
    return success_response(result["message"])


@router.delete("/account")
async def deactivate_account(
    body: AccountDeactivateRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.deactivate_account(user_id, body)
    return success_response(result["message"])


@router.get("/account")
async def get_account_settings(user_id: str = Depends(get_current_user_id)):
    result = await SettingsService.get_account_settings(user_id)
    return success_response("Account settings retrieved", result)


@router.get("/blocked")
async def get_blocked_users(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await SettingsService.get_blocked_users(user_id, page, per_page)
    return success_response("Blocked users retrieved", result)


@router.delete("/block/{target_user_id}")
async def unblock_user(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.unblock_user(user_id, target_user_id)
    return success_response(result["message"])


@router.put("/appearance")
async def update_appearance(
    body: AppearanceUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.update_appearance(user_id, body)
    return success_response(result["message"])


@router.put("/language")
async def update_language(
    body: LanguageUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    from app.repositories.user_repository import UserRepository
    from app.core.exceptions import NotFoundError
    user = await UserRepository.find_by_user_id(user_id)
    if not user:
        raise NotFoundError("User not found")
    user.language = body.language
    await UserRepository.update_user(user)
    return success_response("Language updated successfully")


@router.get("/sessions")
async def get_sessions(user_id: str = Depends(get_current_user_id)):
    result = await SettingsService.get_sessions(user_id)
    return success_response("Sessions retrieved", result)


@router.put("/profile")
async def update_profile_settings(
    body: PrivacySettingsUpdate,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.update_privacy_settings(user_id, body)
    return success_response(result["message"])


@router.put("")
async def update_settings(
    body: PrivacySettingsUpdate,
    user_id: str = Depends(get_current_user_id),
):
    result = await SettingsService.update_privacy_settings(user_id, body)
    return success_response(result["message"])
