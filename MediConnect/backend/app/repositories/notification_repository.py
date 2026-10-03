import logging
from datetime import datetime, timezone

from app.models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationRepository:

    @staticmethod
    async def find_by_id(notification_id: str) -> Notification | None:
        return await Notification.find_one(Notification.notification_id == notification_id)

    @staticmethod
    async def create(notification: Notification) -> Notification:
        await notification.insert()
        return notification

    @staticmethod
    async def get_user_notifications(
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Notification]:
        return await Notification.find(
            Notification.recipient_id == user_id,
        ).skip(skip).limit(limit).sort("-created_at").to_list()

    @staticmethod
    async def mark_read(notification_id: str) -> None:
        notification = await Notification.find_one(Notification.notification_id == notification_id)
        if notification:
            notification.is_read = True
            await notification.save()

    @staticmethod
    async def mark_all_read(user_id: str) -> None:
        notifications = await Notification.find(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
        ).to_list()
        for notification in notifications:
            notification.is_read = True
            await notification.save()

    @staticmethod
    async def delete(notification_id: str) -> None:
        notification = await Notification.find_one(Notification.notification_id == notification_id)
        if notification:
            await notification.delete()

    @staticmethod
    async def count_unread(user_id: str) -> int:
        return await Notification.find(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
        ).count()
