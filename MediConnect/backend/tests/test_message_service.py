import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError, AuthorizationError
from app.schemas.messaging import MessageCreateRequest, MessageUpdateRequest
from app.models.message import MessageStatus


def _make_conversation(**overrides):
    c = MagicMock()
    c.conversation_id = overrides.get("conversation_id", "conv-1")
    c.conversation_type = "private"
    c.participant_ids = overrides.get("participant_ids", ["user-1", "user-2"])
    c.last_message_preview = ""
    c.last_activity = None
    c.unread_count = 0
    c.is_deleted = False
    c.is_archived = False
    c.save = AsyncMock()
    c.insert = AsyncMock()
    return c


def _make_message(**overrides):
    m = MagicMock()
    m.message_id = overrides.get("message_id", "msg-1")
    m.conversation_id = overrides.get("conversation_id", "conv-1")
    m.sender_id = overrides.get("sender_id", "user-1")
    m.message_type = "text"
    m.content = "Hello"
    m.attachments = []
    m.reply_to = None
    m.mentions = []
    m.status = MagicMock(value="sent")
    m.is_edited = False
    m.is_deleted = False
    m.deleted_for = []
    m.created_at = datetime.now(timezone.utc)
    m.save = AsyncMock()
    m.delete = AsyncMock()
    m.insert = AsyncMock()
    return m


class TestCreateConversation:
    @pytest.mark.asyncio
    async def test_create_conversation_new(self):
        from app.services.message_service import MessageService
        with patch("app.services.message_service.Conversation") as MockConv:
            MockConv.find_one = AsyncMock(return_value=None)
            mock_c = _make_conversation()
            MockConv.side_effect = lambda **kw: mock_c
            result = await MessageService.get_or_create_conversation("user-1", "user-2")
            assert result.conversation_id == "conv-1"

    @pytest.mark.asyncio
    async def test_create_conversation_existing(self):
        from app.services.message_service import MessageService
        existing = _make_conversation()
        with patch("app.services.message_service.Conversation") as MockConv:
            MockConv.find_one = AsyncMock(return_value=existing)
            result = await MessageService.get_or_create_conversation("user-1", "user-2")
            assert result.conversation_id == "conv-1"


class TestSendMessage:
    @pytest.mark.asyncio
    async def test_send_message(self):
        from app.services.message_service import MessageService
        conv = _make_conversation()
        data = MessageCreateRequest(recipient_id="user-2", content="Hello there")
        with patch("app.services.message_service.Conversation") as MockConv, \
             patch("app.services.message_service.Message") as MockMsg, \
             patch("app.services.message_service.MessageService._create_notification", new_callable=AsyncMock):
            MockConv.find_one = AsyncMock(return_value=conv)
            mock_m = MagicMock()
            mock_m.insert = AsyncMock()
            mock_m.message_id = "msg-new"
            mock_m.created_at = datetime.now(timezone.utc)
            mock_m.content = "Hello there"
            MockMsg.side_effect = lambda **kw: mock_m
            result = await MessageService.send_message("user-1", data)
            assert "message_id" in result
            assert result["content"] == "Hello there"

    @pytest.mark.asyncio
    async def test_send_message_no_conversation_or_recipient(self):
        from app.services.message_service import MessageService
        data = MessageCreateRequest(content="Hello")
        with pytest.raises(NotFoundError):
            await MessageService.send_message("user-1", data)


class TestGetMessages:
    @pytest.mark.asyncio
    async def test_get_messages(self):
        from app.services.message_service import MessageService
        conv = _make_conversation()
        with patch("app.services.message_service.Conversation") as MockConv, \
             patch("app.services.message_service.Message") as MockMsg:
            MockConv.find_one = AsyncMock(return_value=conv)
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockMsg.find = MagicMock(return_value=mock_q)
            result = await MessageService.get_messages("conv-1", "user-1")
            assert "items" in result
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_messages_not_participant(self):
        from app.services.message_service import MessageService
        conv = _make_conversation(participant_ids=["user-1", "user-2"])
        with patch("app.services.message_service.Conversation") as MockConv:
            MockConv.find_one = AsyncMock(return_value=conv)
            with pytest.raises(AuthorizationError):
                await MessageService.get_messages("conv-1", "user-3")


class TestEditMessage:
    @pytest.mark.asyncio
    async def test_edit_message(self):
        from app.services.message_service import MessageService
        msg = _make_message(sender_id="user-1")
        data = MessageUpdateRequest(content="Updated content")
        with patch("app.services.message_service.Message") as MockMsg:
            MockMsg.find_one = AsyncMock(return_value=msg)
            result = await MessageService.edit_message("msg-1", "user-1", data)
            assert result["message"] == "Message edited"

    @pytest.mark.asyncio
    async def test_edit_message_not_sender(self):
        from app.services.message_service import MessageService
        msg = _make_message(sender_id="user-1")
        data = MessageUpdateRequest(content="Hacked")
        with patch("app.services.message_service.Message") as MockMsg:
            MockMsg.find_one = AsyncMock(return_value=msg)
            with pytest.raises(AuthorizationError):
                await MessageService.edit_message("msg-1", "user-2", data)


class TestDeleteMessage:
    @pytest.mark.asyncio
    async def test_delete_message(self):
        from app.services.message_service import MessageService
        msg = _make_message(sender_id="user-1")
        with patch("app.services.message_service.Message") as MockMsg:
            MockMsg.find_one = AsyncMock(return_value=msg)
            result = await MessageService.delete_message("msg-1", "user-1")
            assert result["message"] == "Message deleted"

    @pytest.mark.asyncio
    async def test_delete_message_not_sender(self):
        from app.services.message_service import MessageService
        msg = _make_message(sender_id="user-1")
        with patch("app.services.message_service.Message") as MockMsg:
            MockMsg.find_one = AsyncMock(return_value=msg)
            with pytest.raises(AuthorizationError):
                await MessageService.delete_message("msg-1", "user-2")


class TestMarkAsRead:
    @pytest.mark.asyncio
    async def test_mark_as_read(self):
        from app.services.message_service import MessageService
        conv = _make_conversation()
        with patch("app.services.message_service.Conversation") as MockConv, \
             patch("app.services.message_service.Message") as MockMsg:
            MockConv.find_one = AsyncMock(return_value=conv)
            MockMsg.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))
            result = await MessageService.mark_as_read("conv-1", "user-1")
            assert result["message"] == "Marked as read"


class TestSearchMessages:
    @pytest.mark.asyncio
    async def test_search_messages(self):
        from app.services.message_service import MessageService
        with patch("app.services.message_service.Message") as MockMsg:
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockMsg.find = MagicMock(return_value=mock_q)
            result = await MessageService.search_messages("user-1", "hello")
            assert "items" in result
            assert result["total"] == 0
