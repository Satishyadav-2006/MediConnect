import logging
from typing import Any
import firebase_admin
from firebase_admin import credentials, messaging
from app.core.config import settings

logger = logging.getLogger(__name__)

_firebase_initialized = False


def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase initialized successfully")
    except Exception as e:
        logger.warning("Firebase initialization failed: %s (push notifications disabled)", e)


class PushNotificationService:

    @staticmethod
    async def send_to_token(token: str, title: str, body: str, data: dict[str, str] | None = None) -> bool:
        init_firebase()
        if not _firebase_initialized:
            return False
        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=token,
                data=data or {},
            )
            messaging.send(message)
            return True
        except Exception as e:
            logger.error("Push notification failed: %s", e)
            return False

    @staticmethod
    async def send_to_tokens(tokens: list[str], title: str, body: str, data: dict[str, str] | None = None) -> dict[str, Any]:
        init_firebase()
        if not _firebase_initialized or not tokens:
            return {"success": 0, "failure": len(tokens)}
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            tokens=tokens,
            data=data or {},
        )
        response = messaging.send_each(message)
        return {"success": response.success_count, "failure": response.failure_count}

    @staticmethod
    async def send_to_user(user_id: str, title: str, body: str, data: dict[str, str] | None = None) -> dict[str, Any]:
        from app.models.notification import Device
        devices = await Device.find(Device.user_id == user_id, Device.push_enabled == True).to_list()
        if not devices:
            return {"success": 0, "failure": 0}
        tokens = [d.fcm_token for d in devices if d.fcm_token]
        return await PushNotificationService.send_to_tokens(tokens, title, body, data)
