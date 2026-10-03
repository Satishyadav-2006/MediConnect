import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError, ValidationAppError
from app.models.connection import ConnectionStatus


def _mock_conn(status="accepted"):
    c = MagicMock()
    c.sender_id = "user-1"
    c.receiver_id = "user-2"
    c.status = status
    c.save = AsyncMock()
    c.delete = AsyncMock()
    return c


class TestSendRequest:
    @pytest.mark.asyncio
    async def test_send_connection_request(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.Connection") as MockConn, \
             patch("app.services.connection_service.UserRepository") as repo, \
             patch("app.services.connection_service.notify_connection_request", new_callable=AsyncMock):
            repo.find_by_user_id = AsyncMock(return_value=MagicMock())
            MockConn.find_one = AsyncMock(return_value=None)
            mock_conn = MagicMock()
            mock_conn.insert = AsyncMock()
            MockConn.side_effect = lambda **kw: mock_conn
            result = await ConnectionService.send_request("user-1", "user-2")
            assert result["message"] == "Connection request sent"

    @pytest.mark.asyncio
    async def test_cannot_connect_to_self(self):
        from app.services.connection_service import ConnectionService
        with pytest.raises(AuthorizationError):
            await ConnectionService.send_request("user-1", "user-1")

    @pytest.mark.asyncio
    async def test_cannot_duplicate_connection(self):
        from app.services.connection_service import ConnectionService
        existing = _mock_conn(status="accepted")
        with patch("app.services.connection_service.Connection") as MockConn, \
             patch("app.services.connection_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=MagicMock())
            MockConn.find_one = AsyncMock(return_value=existing)
            with pytest.raises(ConflictError):
                await ConnectionService.send_request("user-1", "user-2")

    @pytest.mark.asyncio
    async def test_cannot_duplicate_pending(self):
        from app.services.connection_service import ConnectionService
        existing = _mock_conn(status="pending")
        with patch("app.services.connection_service.Connection") as MockConn, \
             patch("app.services.connection_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=MagicMock())
            MockConn.find_one = AsyncMock(return_value=existing)
            with pytest.raises(ConflictError):
                await ConnectionService.send_request("user-1", "user-2")


class TestAcceptReject:
    @pytest.mark.asyncio
    async def test_accept_connection(self):
        from app.services.connection_service import ConnectionService
        conn = _mock_conn(status="pending")
        with patch("app.services.connection_service.Connection") as MockConn, \
             patch("app.services.connection_service.UserRepository") as repo, \
             patch("app.services.connection_service.notify_connection_accepted", new_callable=AsyncMock):
            MockConn.find_one = AsyncMock(return_value=conn)
            user1 = MagicMock()
            user1.connections_count = 0
            user1.save = AsyncMock()
            user2 = MagicMock()
            user2.connections_count = 0
            user2.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(side_effect=[user1, user2])
            result = await ConnectionService.accept_request("user-2", "user-1")
            assert result["message"] == "Connection accepted"

    @pytest.mark.asyncio
    async def test_accept_not_found(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.Connection") as MockConn:
            MockConn.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await ConnectionService.accept_request("user-2", "user-1")

    @pytest.mark.asyncio
    async def test_reject_connection(self):
        from app.services.connection_service import ConnectionService
        conn = _mock_conn(status="pending")
        with patch("app.services.connection_service.Connection") as MockConn:
            MockConn.find_one = AsyncMock(return_value=conn)
            result = await ConnectionService.reject_request("user-2", "user-1")
            assert result["message"] == "Connection rejected"


class TestRemoveConnection:
    @pytest.mark.asyncio
    async def test_remove_connection(self):
        from app.services.connection_service import ConnectionService
        conn = _mock_conn(status="accepted")
        with patch("app.services.connection_service.Connection") as MockConn, \
             patch("app.services.connection_service.UserRepository") as repo:
            MockConn.find_one = AsyncMock(return_value=conn)
            user1 = MagicMock()
            user1.connections_count = 1
            user1.save = AsyncMock()
            user2 = MagicMock()
            user2.connections_count = 1
            user2.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(side_effect=[user1, user2])
            result = await ConnectionService.remove_connection("user-1", "user-2")
            assert result["message"] == "Connection removed"


class TestFollowUnfollow:
    @pytest.mark.asyncio
    async def test_follow_user(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.Follow") as MockFollow, \
             patch("app.services.connection_service.UserRepository") as repo, \
             patch("app.services.connection_service.notify_followed", new_callable=AsyncMock):
            MockFollow.find_one = AsyncMock(return_value=None)
            mock_f = MagicMock()
            mock_f.insert = AsyncMock()
            MockFollow.side_effect = lambda **kw: mock_f
            user = MagicMock()
            user.following_count = 0
            user.save = AsyncMock()
            target = MagicMock()
            target.followers_count = 0
            target.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(side_effect=[user, target])
            result = await ConnectionService.follow_user("user-1", "user-2")
            assert result["message"] == "Now following"

    @pytest.mark.asyncio
    async def test_cannot_follow_self(self):
        from app.services.connection_service import ConnectionService
        with pytest.raises(AuthorizationError):
            await ConnectionService.follow_user("user-1", "user-1")

    @pytest.mark.asyncio
    async def test_unfollow_user(self):
        from app.services.connection_service import ConnectionService
        follow = MagicMock()
        follow.delete = AsyncMock()
        with patch("app.services.connection_service.Follow") as MockFollow, \
             patch("app.services.connection_service.UserRepository") as repo:
            MockFollow.find_one = AsyncMock(return_value=follow)
            user = MagicMock()
            user.following_count = 1
            user.save = AsyncMock()
            target = MagicMock()
            target.followers_count = 1
            target.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(side_effect=[user, target])
            result = await ConnectionService.unfollow_user("user-1", "user-2")
            assert result["message"] == "Unfollowed"


class TestGetConnections:
    @pytest.mark.asyncio
    async def test_get_connections(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.Connection") as MockConn:
            mock_q = MagicMock()
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockConn.find = MagicMock(return_value=mock_q)
            result = await ConnectionService.get_connections("user-1")
            assert "items" in result
            assert result["total"] == 0


class TestBeanieQueryOperators:
    def test_and_or_operators_produce_valid_filters(self):
        from beanie.odm.operators.find.logical import And, Or
        from beanie.odm.operators.find.comparison import Eq
        query = And(
            Or(Eq("sender_id", "user-1"), Eq("receiver_id", "user-2")),
            Eq("status", "accepted"),
        )
        assert query == {
            "$and": [
                {"$or": [{"sender_id": "user-1"}, {"receiver_id": "user-2"}]},
                {"status": "accepted"},
            ]
        }

    def test_pipe_and_amp_operators_are_not_supported(self):
        from beanie.odm.operators.find.comparison import Eq
        with pytest.raises(TypeError):
            Eq("sender_id", "user-1") | Eq("receiver_id", "user-2")
        with pytest.raises(TypeError):
            Eq("sender_id", "user-1") & Eq("receiver_id", "user-2")


class TestBlockUser:
    @pytest.mark.asyncio
    async def test_block_user(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.UserRepository") as repo, \
             patch("app.services.connection_service.Block") as MockBlock:
            repo.find_by_user_id = AsyncMock(return_value=MagicMock())
            MockBlock.find_one = AsyncMock(return_value=None)
            mock_block = MagicMock()
            mock_block.insert = AsyncMock()
            MockBlock.side_effect = lambda **kw: mock_block
            result = await ConnectionService.block_user("user-1", "user-2")
            assert result["message"] == "User blocked successfully"

    @pytest.mark.asyncio
    async def test_cannot_block_self(self):
        from app.services.connection_service import ConnectionService
        with pytest.raises(ValidationAppError):
            await ConnectionService.block_user("user-1", "user-1")

    @pytest.mark.asyncio
    async def test_block_user_not_found(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await ConnectionService.block_user("user-1", "missing")

    @pytest.mark.asyncio
    async def test_block_user_already_blocked(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.UserRepository") as repo, \
             patch("app.services.connection_service.Block") as MockBlock:
            repo.find_by_user_id = AsyncMock(return_value=MagicMock())
            MockBlock.find_one = AsyncMock(return_value=MagicMock())
            with pytest.raises(ConflictError):
                await ConnectionService.block_user("user-1", "user-2")


class TestUnblockUser:
    @pytest.mark.asyncio
    async def test_unblock_user(self):
        from app.services.connection_service import ConnectionService
        block = MagicMock()
        block.delete = AsyncMock()
        with patch("app.services.connection_service.Block") as MockBlock:
            MockBlock.find_one = AsyncMock(return_value=block)
            result = await ConnectionService.unblock_user("user-1", "user-2")
            block.delete.assert_awaited_once()
            assert result["message"] == "User unblocked successfully"

    @pytest.mark.asyncio
    async def test_unblock_not_found(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.Block") as MockBlock:
            MockBlock.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await ConnectionService.unblock_user("user-1", "user-2")


class TestGetBlockedUsers:
    @pytest.mark.asyncio
    async def test_get_blocked_users(self):
        from app.services.connection_service import ConnectionService
        block = MagicMock()
        block.id = "block-1"
        block.blocked_id = "user-2"
        block.created_at = datetime.now(timezone.utc)
        blocked = MagicMock()
        blocked.user_id = "user-2"
        blocked.first_name = "Jane"
        blocked.last_name = "Doe"
        blocked.profile_photo = "http://photo"
        blocked.headline = "Doctor"
        with patch("app.services.connection_service.Block") as MockBlock, \
             patch("app.services.connection_service.UserRepository") as repo, \
             patch("app.services.connection_service.paginate_response", side_effect=lambda *a, **k: {"items": a[0], "total": a[1], "page": a[2], "per_page": a[3]}):
            mock_q = MagicMock()
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[block])
            mock_q.count = AsyncMock(return_value=1)
            MockBlock.find = MagicMock(return_value=mock_q)
            repo.find_by_user_id = AsyncMock(return_value=blocked)
            result = await ConnectionService.get_blocked_users("user-1")
            assert result["total"] == 1
            assert result["items"][0]["user"]["fullName"] == "Jane Doe"
            assert result["items"][0]["user"]["_id"] == "user-2"
            assert result["items"][0]["blockedAt"] == block.created_at

    @pytest.mark.asyncio
    async def test_get_blocked_users_empty(self):
        from app.services.connection_service import ConnectionService
        with patch("app.services.connection_service.Block") as MockBlock, \
             patch("app.services.connection_service.paginate_response", side_effect=lambda *a, **k: {"items": a[0], "total": a[1], "page": a[2], "per_page": a[3]}):
            mock_q = MagicMock()
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockBlock.find = MagicMock(return_value=mock_q)
            result = await ConnectionService.get_blocked_users("user-1")
            assert result["total"] == 0
            assert result["items"] == []
