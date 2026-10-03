import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.models.base import NotificationType


def _make_notification(**overrides):
    n = MagicMock()
    n.notification_id = overrides.get("notification_id", "notif-1")
    n.recipient_id = overrides.get("recipient_id", "user-1")
    n.sender_id = overrides.get("sender_id", "user-2")
    n.notification_type = overrides.get("notification_type", MagicMock(value="new_message"))
    n.title = "New Message"
    n.message = "You have a new message"
    n.reference_id = None
    n.reference_type = None
    n.is_read = overrides.get("is_read", False)
    n.priority = "normal"
    n.created_at = datetime.now(timezone.utc)
    n.save = AsyncMock()
    n.delete = AsyncMock()
    n.insert = AsyncMock()
    return n


class TestCreateNotification:
    @pytest.mark.asyncio
    async def test_create_notification(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            mock_n = MagicMock()
            mock_n.insert = AsyncMock()
            mock_n.notification_id = "notif-new"
            MockNotif.side_effect = lambda **kw: mock_n
            result = await NotificationService.create_notification(
                recipient_id="user-1",
                sender_id="user-2",
                notification_type=NotificationType.NEW_MESSAGE,
                title="Test",
                message="Test message",
            )
            assert result.notification_id == "notif-new"


class TestGetNotifications:
    @pytest.mark.asyncio
    async def test_get_notifications(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            mock_q = MagicMock()
            mock_q.count = AsyncMock(return_value=0)
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            MockNotif.find = MagicMock(return_value=mock_q)
            result = await NotificationService.get_notifications("user-1")
            assert "items" in result
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_notifications_unread_only(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            mock_q = MagicMock()
            mock_q.count = AsyncMock(return_value=0)
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            MockNotif.find = MagicMock(return_value=mock_q)
            result = await NotificationService.get_notifications("user-1", unread_only=True)
            assert "items" in result


class TestMarkRead:
    @pytest.mark.asyncio
    async def test_mark_read(self):
        from app.services.notification_service import NotificationService
        notif = _make_notification()
        with patch("app.services.notification_service.Notification") as MockNotif:
            MockNotif.find_one = AsyncMock(return_value=notif)
            result = await NotificationService.mark_as_read("notif-1", "user-1")
            assert result["message"] == "Notification marked as read"

    @pytest.mark.asyncio
    async def test_mark_read_not_found(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            MockNotif.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await NotificationService.mark_as_read("missing", "user-1")

    @pytest.mark.asyncio
    async def test_mark_all_read(self):
        from app.services.notification_service import NotificationService
        notifs = [_make_notification(notification_id=f"n-{i}") for i in range(3)]
        with patch("app.services.notification_service.Notification") as MockNotif:
            mock_q = MagicMock()
            mock_q.to_list = AsyncMock(return_value=notifs)
            MockNotif.find = MagicMock(return_value=mock_q)
            result = await NotificationService.mark_all_as_read("user-1")
            assert "3" in result["message"]


class TestDeleteNotification:
    @pytest.mark.asyncio
    async def test_delete_notification(self):
        from app.services.notification_service import NotificationService
        notif = _make_notification()
        with patch("app.services.notification_service.Notification") as MockNotif:
            MockNotif.find_one = AsyncMock(return_value=notif)
            result = await NotificationService.delete_notification("notif-1", "user-1")
            assert result["message"] == "Notification deleted"

    @pytest.mark.asyncio
    async def test_delete_notification_not_found(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            MockNotif.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await NotificationService.delete_notification("missing", "user-1")


class TestCountUnread:
    @pytest.mark.asyncio
    async def test_count_unread(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            mock_q = MagicMock()
            mock_q.count = AsyncMock(return_value=5)
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            MockNotif.find = MagicMock(return_value=mock_q)
            result = await NotificationService.get_notifications("user-1")
            assert result["total"] == 5


class TestUnreadCount:
    @pytest.mark.asyncio
    async def test_unread_count(self):
        from app.services.notification_service import NotificationService
        with patch("app.services.notification_service.Notification") as MockNotif:
            mock_q = MagicMock()
            mock_q.count = AsyncMock(return_value=5)
            MockNotif.find = MagicMock(return_value=mock_q)
            result = await NotificationService.unread_count("user-1")
            assert result == 5
            MockNotif.find.assert_called_once()


class TestNotificationTypes:
    def test_notification_types(self):
        assert NotificationType.CONNECTION_REQUEST.value == "connection_request"
        assert NotificationType.NEW_MESSAGE.value == "new_message"
        assert NotificationType.MENTORSHIP_REQUEST.value == "mentorship_request"
        assert NotificationType.ADMIN_ANNOUNCEMENT.value == "admin_announcement"
