import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone

from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.event import EventCreateRequest, EventUpdateRequest
from app.models.base import EventStatus


def _make_event(**overrides):
    e = MagicMock()
    e.event_id = overrides.get("event_id", "event-1")
    e.host_id = overrides.get("host_id", "user-1")
    e.organization_id = overrides.get("organization_id", "org-1")
    e.title = "Medical Conference"
    e.description = "A great event"
    e.category = "conference"
    e.venue = "Convention Center"
    e.mode = MagicMock(value="offline")
    e.meeting_link = ""
    e.start_datetime = datetime.now(timezone.utc)
    e.end_datetime = datetime.now(timezone.utc)
    e.registration_deadline = None
    e.capacity = 100
    e.registered_count = 0
    e.status = EventStatus.PUBLISHED
    e.certificate_available = False
    e.organization_id = None
    e.search_keywords = []
    e.deleted = False
    e.created_at = datetime.now(timezone.utc)
    e.updated_at = datetime.now(timezone.utc)
    e.save = AsyncMock()
    e.insert = AsyncMock()
    return e


class TestCreateEvent:
    @pytest.mark.asyncio
    async def test_create_event(self):
        from app.services.event_service import EventService
        data = EventCreateRequest(
            title="Cardiology Summit",
            description="A cardiology event",
            event_type="conference",
            location="Boston",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
        )
        with patch("app.services.event_service.Event") as MockEvent, \
             patch("app.services.event_service.UserRepository") as repo, \
             patch("app.services.event_service.sanitize_string", side_effect=lambda x: x):
            mock_e = MagicMock()
            mock_e.insert = AsyncMock()
            mock_e.event_id = "new-event"
            MockEvent.side_effect = lambda **kw: mock_e
            user = MagicMock()
            user.posts_count = 0
            user.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await EventService.create_event("user-1", data)
            assert "event_id" in result
            assert result["message"] == "Event created successfully"


class TestGetEvent:
    @pytest.mark.asyncio
    async def test_get_event(self):
        from app.services.event_service import EventService
        event = _make_event()
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=event)
            result = await EventService.get_event("event-1")
            assert event.save.called

    @pytest.mark.asyncio
    async def test_get_event_not_found(self):
        from app.services.event_service import EventService
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await EventService.get_event("missing")


class TestUpdateEvent:
    @pytest.mark.asyncio
    async def test_update_event(self):
        from app.services.event_service import EventService
        event = _make_event(host_id="user-1")
        data = EventUpdateRequest(title="Updated Title")
        with patch("app.services.event_service.EventRepository") as repo, \
             patch("app.services.event_service.sanitize_string", side_effect=lambda x: x):
            repo.find_by_id = AsyncMock(return_value=event)
            result = await EventService.update_event("event-1", "user-1", data)
            assert result["message"] == "Event updated successfully"

    @pytest.mark.asyncio
    async def test_update_event_wrong_organizer(self):
        from app.services.event_service import EventService
        event = _make_event(host_id="user-1")
        data = EventUpdateRequest(title="Hacked")
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=event)
            with pytest.raises(AuthorizationError):
                await EventService.update_event("event-1", "user-2", data)


class TestDeleteEvent:
    @pytest.mark.asyncio
    async def test_delete_event(self):
        from app.services.event_service import EventService
        event = _make_event(host_id="user-1")
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=event)
            result = await EventService.delete_event("event-1", "user-1")
            assert result["message"] == "Event deleted successfully"


class TestRegisterEvent:
    @pytest.mark.asyncio
    async def test_register_for_event(self):
        from app.services.event_service import EventService
        event = _make_event()
        with patch("app.services.event_service.EventRepository") as repo, \
             patch("app.services.event_service.EventRegistration") as MockReg, \
             patch("app.services.event_service.notify_event_registration", new_callable=AsyncMock):
            repo.find_by_id = AsyncMock(return_value=event)
            repo.find_registration = AsyncMock(return_value=None)
            mock_reg = MagicMock()
            mock_reg.insert = AsyncMock()
            MockReg.side_effect = lambda **kw: mock_reg
            result = await EventService.register_for_event("event-1", "user-2")
            assert "registration_id" in result

    @pytest.mark.asyncio
    async def test_unregister_from_event(self):
        from app.services.event_service import EventService
        event = _make_event()
        reg = MagicMock()
        reg.delete = AsyncMock()
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_registration = AsyncMock(return_value=reg)
            repo.find_by_id = AsyncMock(return_value=event)
            result = await EventService.cancel_registration("event-1", "user-2")
            assert result["message"] == "Registration cancelled"

    @pytest.mark.asyncio
    async def test_event_registration_prevents_duplicate(self):
        from app.services.event_service import EventService
        event = _make_event()
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=event)
            repo.find_registration = AsyncMock(return_value=MagicMock())
            with pytest.raises(ConflictError):
                await EventService.register_for_event("event-1", "user-2")


class TestEventCapacity:
    @pytest.mark.asyncio
    async def test_event_capacity(self):
        from app.services.event_service import EventService
        event = _make_event()
        event.capacity = 1
        event.registered_count = 1
        with patch("app.services.event_service.EventRepository") as repo, \
             patch("app.services.event_service.EventRegistration") as MockReg:
            repo.find_by_id = AsyncMock(return_value=event)
            repo.find_registration = AsyncMock(return_value=None)
            mock_reg = MagicMock()
            mock_reg.insert = AsyncMock()
            MockReg.side_effect = lambda **kw: mock_reg
            try:
                await EventService.register_for_event("event-1", "user-2")
                assert False, "Expected AuthorizationError"
            except AuthorizationError as e:
                assert "fully booked" in str(e)


class TestGetEvents:
    @pytest.mark.asyncio
    async def test_get_events(self):
        from app.services.event_service import EventService
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_visible = AsyncMock(return_value=[])
            repo.count_visible = AsyncMock(return_value=0)
            result = await EventService.get_events()
            assert "items" in result
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_get_my_events(self):
        from app.services.event_service import EventService
        with patch("app.services.event_service.EventRepository") as repo:
            repo.find_by_organizer = AsyncMock(return_value=[])
            repo.count_by_organizer = AsyncMock(return_value=0)
            result = await EventService.get_user_organized_events("user-1")
            assert "items" in result


class TestToDictStatus:
    def _run(self, start, end, status=EventStatus.PUBLISHED):
        from app.services.event_service import EventService
        e = _make_event()
        e.status = status
        e.start_datetime = start
        e.end_datetime = end
        return EventService._to_dict(e, set(), set())["status"]

    def test_aware_future_is_upcoming(self):
        now = datetime.now(timezone.utc)
        assert self._run(now + timedelta(days=1), now + timedelta(days=2)) == "upcoming"

    def test_aware_now_is_live(self):
        now = datetime.now(timezone.utc)
        assert self._run(now - timedelta(minutes=5), now + timedelta(minutes=5)) == "live"

    def test_aware_past_is_completed(self):
        now = datetime.now(timezone.utc)
        assert self._run(now - timedelta(days=2), now - timedelta(days=1)) == "completed"

    def test_naive_utc_future_is_upcoming(self):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        assert self._run(now + timedelta(days=1), now + timedelta(days=2)) == "upcoming"

    def test_naive_utc_now_is_live(self):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        assert self._run(now - timedelta(minutes=5), now + timedelta(minutes=5)) == "live"

    def test_naive_utc_past_is_completed(self):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        assert self._run(now - timedelta(days=2), now - timedelta(days=1)) == "completed"

    def test_cancelled_stays_cancelled(self):
        now = datetime.now(timezone.utc)
        assert self._run(now + timedelta(days=1), now + timedelta(days=2), status=EventStatus.CANCELLED) == "cancelled"
