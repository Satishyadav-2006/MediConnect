from fastapi import APIRouter, Depends, Query, status
from app.schemas.messaging import DeviceRegisterRequest
from app.services.notification_service import NotificationService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    category: str | None = Query(default=None),
):
    result = await NotificationService.get_notifications(user_id, page, per_page, unread_only, category)
    return success_response("Notifications retrieved", result)


@router.get("/unread-count")
async def get_unread_count(user_id: str = Depends(get_current_user_id)):
    count = await NotificationService.unread_count(user_id)
    return success_response("Unread count retrieved", {"count": count})


@router.get("/settings")
async def get_notification_settings(user_id: str = Depends(get_current_user_id)):
    from app.services.settings_service import SettingsService
    result = await SettingsService.get_notification_settings(user_id)
    return success_response("Notification settings retrieved", result)


@router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str, user_id: str = Depends(get_current_user_id)):
    result = await NotificationService.mark_as_read(notification_id, user_id)
    return success_response(result["message"])


@router.patch("/read-all")
async def mark_all_as_read(user_id: str = Depends(get_current_user_id)):
    result = await NotificationService.mark_all_as_read(user_id)
    return success_response(result["message"])


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, user_id: str = Depends(get_current_user_id)):
    result = await NotificationService.delete_notification(notification_id, user_id)
    return success_response(result["message"])


devices_router = APIRouter(prefix="/devices", tags=["Devices"])


@devices_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_device(body: DeviceRegisterRequest, user_id: str = Depends(get_current_user_id)):
    result = await NotificationService.register_device(user_id, body.device_name, body.platform, body.fcm_token)
    return success_response(result["message"], {"device_id": result["device_id"]})


@devices_router.post("", status_code=status.HTTP_201_CREATED)
async def register_device_v2(body: DeviceRegisterRequest, user_id: str = Depends(get_current_user_id)):
    result = await NotificationService.register_device(user_id, body.device_name, body.platform, body.fcm_token)
    return success_response(result["message"], {"device_id": result["device_id"]})


@devices_router.delete("/{device_id}")
async def remove_device(device_id: str, user_id: str = Depends(get_current_user_id)):
    result = await NotificationService.remove_device(user_id, device_id)
    return success_response(result["message"])
