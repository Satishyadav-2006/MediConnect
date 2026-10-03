from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    notification_id: str
    recipient_id: str
    sender_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    read: bool = False
    created_at: datetime

class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
    total: int

class DeviceRegisterRequest(BaseModel):
    device_name: str
    platform: str
    fcm_token: str
