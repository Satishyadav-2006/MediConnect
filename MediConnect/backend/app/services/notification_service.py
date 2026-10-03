import secrets
import logging
from datetime import datetime, timezone
from typing import Any
from app.models.notification import Notification, Device
from app.core.exceptions import NotFoundError
from app.models.base import NotificationType
from app.utils.pagination import paginate_response

logger = logging.getLogger(__name__)

CATEGORY_TYPES: dict[str, list[NotificationType]] = {
    "connection_request": [NotificationType.CONNECTION_REQUEST, NotificationType.CONNECTION_ACCEPTED, NotificationType.FOLLOWER],
    "post_like": [NotificationType.POST_REACTION, NotificationType.COMMENT, NotificationType.REPLY, NotificationType.MENTION],
    "job": [NotificationType.JOB_RECOMMENDATION, NotificationType.INTERNSHIP_RECOMMENDATION],
    "event": [NotificationType.EVENT_REMINDER],
    "message": [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_REACTION],
    "mentorship": [NotificationType.MENTORSHIP_REQUEST],
    "system": [NotificationType.SYSTEM_NOTIFICATION, NotificationType.ORGANIZATION_INVITE, NotificationType.VERIFICATION_UPDATE, NotificationType.ADMIN_ANNOUNCEMENT],
}

TYPE_MAP = {
    "connection_request": "connection_request",
    "connection_accepted": "connection_accepted",
    "new_message": "message",
    "message_reaction": "message",
    "mention": "mention",
    "comment": "post_comment",
    "reply": "post_comment",
    "post_reaction": "post_like",
    "follower": "follower",
    "organization_invite": "system",
    "verification_update": "verification",
    "job_recommendation": "job",
    "internship_recommendation": "internship",
    "event_reminder": "event",
    "mentorship_request": "mentorship",
    "admin_announcement": "admin",
    "system_notification": "system",
}


class NotificationService:

    @staticmethod
    async def get_notifications(user_id: str, page: int = 1, per_page: int = 20, unread_only: bool = False, category: str | None = None) -> dict[str, Any]:
        filters: dict[str, Any] = {"recipient_id": user_id}
        if unread_only:
            filters["is_read"] = False
        if category and category != "all":
            type_values = CATEGORY_TYPES.get(category)
            if type_values:
                filters["notification_type"] = {"$in": type_values}
        total = await Notification.find(filters).count()
        skip = (page - 1) * per_page
        notifications = await Notification.find(filters).sort("-created_at").skip(skip).limit(per_page).to_list()
        items = [await NotificationService._to_dict(n) for n in notifications]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def _to_dict(notif: Notification) -> dict[str, Any]:
        from app.models.user import User
        sender = None
        if notif.sender_id:
            s = await User.find_one(User.user_id == notif.sender_id)
            if s:
                sender = {
                    "_id": s.user_id,
                    "user_id": s.user_id,
                    "username": s.username,
                    "fullName": f"{s.first_name} {s.last_name}".strip(),
                    "profilePhoto": s.profile_photo,
                    "profile_photo": s.profile_photo,
                    "headline": s.headline,
                    "specialization": s.specialization,
                }
        ntype = notif.notification_type.value if hasattr(notif.notification_type, 'value') else notif.notification_type
        return {
            "_id": notif.notification_id,
            "notification_id": notif.notification_id,
            "recipient": notif.recipient_id,
            "recipient_id": notif.recipient_id,
            "sender": sender,
            "sender_id": notif.sender_id,
            "type": TYPE_MAP.get(ntype, "system"),
            "notification_type": ntype,
            "title": notif.title,
            "message": notif.message,
            "referenceId": notif.reference_id,
            "reference_id": notif.reference_id,
            "referenceModel": notif.reference_type,
            "reference_type": notif.reference_type,
            "isRead": notif.is_read,
            "is_read": notif.is_read,
            "createdAt": notif.created_at,
            "created_at": notif.created_at,
            "updatedAt": notif.updated_at,
            "updated_at": notif.updated_at,
        }

    @staticmethod
    async def unread_count(user_id: str) -> int:
        return await Notification.find(Notification.recipient_id == user_id, Notification.is_read == False).count()

    @staticmethod
    async def mark_as_read(notification_id: str, user_id: str) -> dict[str, str]:
        notif = await Notification.find_one(Notification.notification_id == notification_id, Notification.recipient_id == user_id)
        if not notif:
            raise NotFoundError("Notification not found")
        notif.is_read = True
        await notif.save()
        return {"message": "Notification marked as read"}

    @staticmethod
    async def mark_all_as_read(user_id: str) -> dict[str, str]:
        notifications = await Notification.find(Notification.recipient_id == user_id, Notification.is_read == False).to_list()
        for n in notifications:
            n.is_read = True
            await n.save()
        return {"message": f"Marked {len(notifications)} notifications as read"}

    @staticmethod
    async def delete_notification(notification_id: str, user_id: str) -> dict[str, str]:
        notif = await Notification.find_one(Notification.notification_id == notification_id, Notification.recipient_id == user_id)
        if not notif:
            raise NotFoundError("Notification not found")
        await notif.delete()
        return {"message": "Notification deleted"}

    @staticmethod
    async def create_notification(
        recipient_id: str,
        sender_id: str | None,
        notification_type: NotificationType,
        title: str,
        message: str,
        reference_id: str | None = None,
        reference_type: str | None = None,
    ) -> Notification:
        notif = Notification(
            notification_id=secrets.token_hex(16),
            recipient_id=recipient_id,
            sender_id=sender_id,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        await notif.insert()
        return notif

    @staticmethod
    async def register_device(user_id: str, device_name: str, platform: str, fcm_token: str) -> dict[str, str]:
        existing = await Device.find_one(Device.fcm_token == fcm_token)
        if existing:
            existing.user_id = user_id
            existing.device_name = device_name
            existing.platform = platform
            existing.last_active = datetime.now(timezone.utc)
            await existing.save()
            return {"message": "Device updated", "device_id": existing.device_id}
        device = Device(
            device_id=secrets.token_hex(16),
            user_id=user_id,
            device_name=device_name,
            platform=platform,
            fcm_token=fcm_token,
        )
        await device.insert()
        return {"message": "Device registered", "device_id": device.device_id}

    @staticmethod
    async def remove_device(user_id: str, device_id: str) -> dict[str, str]:
        device = await Device.find_one(Device.device_id == device_id, Device.user_id == user_id)
        if not device:
            raise NotFoundError("Device not found")
        await device.delete()
        return {"message": "Device removed"}
