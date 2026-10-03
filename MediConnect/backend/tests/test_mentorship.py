import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-32chars!!")
os.environ.setdefault("JWT_REFRESH_SECRET_KEY", "test-refresh-secret-key-for-testing-only-32")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "mediconnect_test")

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError, ValidationAppError
from app.models.base import MentorshipRequestStatus


def _request(**overrides):
    r = MagicMock()
    r.request_id = overrides.get("request_id", "req-1")
    r.mentor_id = overrides.get("mentor_id", "mentor-1")
    r.mentee_id = overrides.get("mentee_id", "mentee-1")
    r.status = overrides.get("status", MentorshipRequestStatus.PENDING)
    r.response_message = ""
    r.goal = "career_guidance"
    r.message = "Help me"
    r.insert = AsyncMock()
    r.save = AsyncMock()
    return r


def _mentor(**overrides):
    u = MagicMock()
    u.user_id = overrides.get("user_id", "mentor-1")
    u.mentor_available = overrides.get("mentor_available", True)
    return u


class TestSendMentorshipRequest:
    @pytest.mark.asyncio
    async def test_cannot_mentor_yourself(self):
        from app.services.mentorship_service import MentorshipService

        data = MagicMock(mentor_id="me")
        with pytest.raises(AuthorizationError):
            await MentorshipService.send_request("me", data)

    @pytest.mark.asyncio
    async def test_mentor_not_found(self):
        from app.services.mentorship_service import MentorshipService

        data = MagicMock(mentor_id="mentor-1")
        MockUser = MagicMock()
        MockUser.find_one = AsyncMock(return_value=None)
        with patch("app.models.user.User", MockUser):
            with pytest.raises(NotFoundError):
                await MentorshipService.send_request("mentee-1", data)

    @pytest.mark.asyncio
    async def test_mentor_not_available(self):
        from app.services.mentorship_service import MentorshipService

        data = MagicMock(mentor_id="mentor-1")
        mentor = _mentor(mentor_available=False)
        MockUser = MagicMock()
        MockUser.find_one = AsyncMock(return_value=mentor)
        with patch("app.models.user.User", MockUser):
            with pytest.raises(AuthorizationError):
                await MentorshipService.send_request("mentee-1", data)

    @pytest.mark.asyncio
    async def test_duplicate_pending_request(self):
        from app.services.mentorship_service import MentorshipService

        data = MagicMock(mentor_id="mentor-1")
        mentor = _mentor()
        MockUser = MagicMock()
        MockUser.find_one = AsyncMock(return_value=mentor)
        with patch("app.models.user.User", MockUser), \
             patch.object(MentorshipService, "_is_mentor_eligible", return_value=True), \
             patch("app.services.mentorship_service.MentorshipRepository") as repo:
            repo.find_pending_request = AsyncMock(return_value=_request())
            with pytest.raises(ConflictError):
                await MentorshipService.send_request("mentee-1", data)

    @pytest.mark.asyncio
    async def test_duplicate_active_mentorship(self):
        from app.services.mentorship_service import MentorshipService

        data = MagicMock(mentor_id="mentor-1")
        mentor = _mentor()
        MockUser = MagicMock()
        MockUser.find_one = AsyncMock(return_value=mentor)
        with patch("app.models.user.User", MockUser), \
             patch.object(MentorshipService, "_is_mentor_eligible", return_value=True), \
             patch("app.services.mentorship_service.MentorshipRepository") as repo:
            repo.find_pending_request = AsyncMock(return_value=None)
            repo.find_active_mentorship = AsyncMock(return_value=_request())
            with pytest.raises(ConflictError):
                await MentorshipService.send_request("mentee-1", data)

    @pytest.mark.asyncio
    async def test_send_request_success_notifies_mentor(self):
        from app.services.mentorship_service import MentorshipService

        data = MagicMock(mentor_id="mentor-1", goal="career_guidance", message="Help me")
        mentor = _mentor()
        request = _request()
        MockUser = MagicMock()
        MockUser.find_one = AsyncMock(return_value=mentor)
        with patch("app.models.user.User", MockUser), \
             patch.object(MentorshipService, "_is_mentor_eligible", return_value=True), \
             patch("app.services.mentorship_service.MentorshipRepository") as repo, \
             patch("app.services.mentorship_service.MentorshipRequest", return_value=request), \
             patch("app.services.mentorship_service.notify_mentorship_request", new_callable=AsyncMock) as notify:
            repo.find_pending_request = AsyncMock(return_value=None)
            repo.find_active_mentorship = AsyncMock(return_value=None)
            result = await MentorshipService.send_request("mentee-1", data)

        assert result["message"] == "Mentorship request sent"
        assert "request_id" in result
        request.insert.assert_awaited_once()
        notify.assert_awaited_once()


class TestRespondToRequest:
    @pytest.mark.asyncio
    async def test_request_not_found(self):
        from app.services.mentorship_service import MentorshipService

        with patch("app.services.mentorship_service.MentorshipRepository") as repo:
            repo.find_request = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await MentorshipService.respond_to_request("req-1", "mentor-1", MagicMock())

    @pytest.mark.asyncio
    async def test_only_mentor_can_respond(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(mentor_id="mentor-1")
        with patch("app.services.mentorship_service.MentorshipRepository") as repo:
            repo.find_request = AsyncMock(return_value=request)
            with pytest.raises(AuthorizationError):
                await MentorshipService.respond_to_request("req-1", "stranger", MagicMock())

    @pytest.mark.asyncio
    async def test_already_processed(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.ACCEPTED)
        with patch("app.services.mentorship_service.MentorshipRepository") as repo:
            repo.find_request = AsyncMock(return_value=request)
            with pytest.raises(AuthorizationError):
                await MentorshipService.respond_to_request("req-1", "mentor-1", MagicMock())

    @pytest.mark.asyncio
    async def test_accept_notifies_mentee(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.PENDING)
        data = MagicMock(status="accepted", response_message="Happy to help")
        with patch("app.services.mentorship_service.MentorshipRepository") as repo, \
             patch("app.services.mentorship_service.notify_mentorship_accepted", new_callable=AsyncMock) as notify:
            repo.find_request = AsyncMock(return_value=request)
            result = await MentorshipService.respond_to_request("req-1", "mentor-1", data)

        assert request.status == MentorshipRequestStatus.ACCEPTED
        assert "accepted" in result["message"]
        request.save.assert_awaited_once()
        notify.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_reject_does_not_notify(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.PENDING)
        data = MagicMock(status="rejected", response_message="No capacity")
        with patch("app.services.mentorship_service.MentorshipRepository") as repo, \
             patch("app.services.mentorship_service.notify_mentorship_accepted", new_callable=AsyncMock) as notify:
            repo.find_request = AsyncMock(return_value=request)
            result = await MentorshipService.respond_to_request("req-1", "mentor-1", data)

        assert request.status == MentorshipRequestStatus.REJECTED
        assert "rejected" in result["message"]
        notify.assert_not_awaited()


class TestGetMentorship:
    @pytest.mark.asyncio
    async def test_not_found(self):
        from app.services.mentorship_service import MentorshipService

        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq:
            MockReq.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await MentorshipService.get_mentorship("req-1", "user-1")

    @pytest.mark.asyncio
    async def test_access_denied_for_outsider(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(mentor_id="mentor-1", mentee_id="mentee-1")
        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq:
            MockReq.find_one = AsyncMock(return_value=request)
            with pytest.raises(AuthorizationError):
                await MentorshipService.get_mentorship("req-1", "outsider")

    @pytest.mark.asyncio
    async def test_participant_can_view(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(mentor_id="mentor-1", mentee_id="mentee-1")
        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq, \
             patch("app.services.mentorship_service.MentorshipService._to_dict", new_callable=AsyncMock, return_value={"request_id": "req-1"}):
            MockReq.find_one = AsyncMock(return_value=request)
            result = await MentorshipService.get_mentorship("req-1", "mentee-1")

        assert result["request_id"] == "req-1"


class TestSessions:
    @pytest.mark.asyncio
    async def test_add_session_requires_accepted(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.PENDING)
        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq:
            MockReq.find_one = AsyncMock(return_value=request)
            with pytest.raises(ValidationAppError):
                await MentorshipService.add_session("req-1", "mentor-1", MagicMock())

    @pytest.mark.asyncio
    async def test_add_session_success(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.ACCEPTED)
        session = MagicMock()
        session.insert = AsyncMock()
        data = MagicMock(scheduled_at=None, duration_minutes=45, topic="Guidance")

        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq, \
             patch("app.services.mentorship_service.MentorshipSession", return_value=session) as MockSession, \
             patch("app.services.mentorship_service.sanitize_string", side_effect=lambda x: x):
            MockReq.find_one = AsyncMock(return_value=request)
            result = await MentorshipService.add_session("req-1", "mentor-1", data)

        assert result["message"] == "Session scheduled"
        assert "session_id" in result
        session.insert.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_add_session_clamps_duration(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.ACCEPTED)
        session = MagicMock()
        session.insert = AsyncMock()
        data = MagicMock(scheduled_at=None, duration_minutes=9999, topic="Long")

        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq, \
             patch("app.services.mentorship_service.MentorshipSession", return_value=session) as MockSession, \
             patch("app.services.mentorship_service.sanitize_string", side_effect=lambda x: x):
            MockReq.find_one = AsyncMock(return_value=request)
            await MentorshipService.add_session("req-1", "mentor-1", data)

        assert MockSession.call_args.kwargs["duration"] == 240

    @pytest.mark.asyncio
    async def test_add_session_outsider_denied(self):
        from app.services.mentorship_service import MentorshipService

        request = _request(status=MentorshipRequestStatus.ACCEPTED)
        with patch("app.services.mentorship_service.MentorshipRequest") as MockReq:
            MockReq.find_one = AsyncMock(return_value=request)
            with pytest.raises(AuthorizationError):
                await MentorshipService.add_session("req-1", "outsider", MagicMock())
