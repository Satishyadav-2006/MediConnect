import logging
import secrets
from datetime import datetime, timezone
from typing import Any
from beanie.odm.operators.find.comparison import In
from app.models.event import Event, EventRegistration
from app.repositories.event_repository import EventRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.event import EventCreateRequest, EventUpdateRequest
from app.models.base import EventStatus, EventType, EventMode, AttendanceStatus, EventRegistrationStatus
from app.utils.validators import sanitize_string
from app.services.notification_helper import notify_event_registration
from app.utils.pagination import paginate_response
from app.services.applicant_helper import enrich
from app.services.notification_helper import (
    resolve_posting_recipients,
    notify_event_registration_received,
    _applicant_name,
)

logger = logging.getLogger(__name__)

_EVENT_MODE_MAP = {
    "offline": "in_person",
    "online": "online",
    "hybrid": "hybrid",
}


def _safe_enum(value, enum_cls, default):
    if value and value in [e.value for e in enum_cls]:
        return enum_cls(value)
    return default


def _safe_list(value):
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return []


class EventService:

    @staticmethod
    async def create_event(host_id: str, data: EventCreateRequest) -> dict[str, Any]:
        event_id = secrets.token_hex(16)
        event = Event(
            event_id=event_id,
            host_id=host_id,
            title=sanitize_string(data.title),
            description=sanitize_string(data.description),
            event_type=_safe_enum(data.event_type, EventType, EventType.CONFERENCE),
            location=data.location,
            venue=data.venue,
            mode=_safe_enum(data.mode, EventMode, EventMode.OFFLINE),
            meeting_link=data.meeting_link,
            banner_image=data.banner_image,
            start_datetime=data.start_date,
            end_datetime=data.end_date,
            registration_deadline=data.registration_deadline,
            capacity=data.max_participants,
            is_free=data.is_free,
            ticket_price=data.ticket_price,
            currency=data.currency,
            cme_credits=data.cme_credits,
            certificate_available=data.certificate_available,
            tags=data.tags,
            speakers=data.speakers,
            agenda=data.agenda,
            status=EventStatus.PUBLISHED,
            search_keywords=[data.title.lower(), data.event_type.lower(), data.location.lower()],
        )
        await event.insert()
        return {"event_id": event.event_id, "message": "Event created successfully"}

    @staticmethod
    async def get_events(page: int = 1, per_page: int = 20, user_id: str | None = None, status: str | None = None) -> dict[str, Any]:
        skip = (page - 1) * per_page
        if status == "live":
            events = await EventRepository.find_live(skip, per_page)
            total = await EventRepository.count_live()
        elif status == "upcoming":
            events = await EventRepository.find_upcoming(skip, per_page)
            total = await EventRepository.count_upcoming()
        elif status == "completed":
            events = await EventRepository.find_completed(skip, per_page)
            total = await EventRepository.count_completed()
        elif status == "cancelled":
            events = await EventRepository.find_by_status(EventStatus.CANCELLED, skip, per_page)
            total = await EventRepository.count_by_status(EventStatus.CANCELLED)
        else:
            events = await EventRepository.find_visible(skip, per_page)
            total = await EventRepository.count_visible()
        registered_ids, saved_ids = await EventService._user_event_context(user_id)
        items = [EventService._to_dict(e, registered_ids, saved_ids) for e in events]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_event(event_id: str, user_id: str | None = None) -> dict[str, Any]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")
        event.views_count += 1
        await event.save()
        registered_ids, saved_ids = await EventService._user_event_context(user_id)
        return EventService._to_dict(event, registered_ids, saved_ids)

    @staticmethod
    async def update_event(event_id: str, host_id: str, data: EventUpdateRequest) -> dict[str, str]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")
        if event.host_id != host_id:
            raise AuthorizationError("Only the organizer can edit this event")
        if data.title is not None:
            event.title = sanitize_string(data.title)
        if data.description is not None:
            event.description = sanitize_string(data.description)
        if data.event_type is not None:
            event.event_type = _safe_enum(data.event_type, EventType, event.event_type)
        if data.location is not None:
            event.location = data.location
        if data.venue is not None:
            event.venue = data.venue
        if data.mode is not None:
            event.mode = _safe_enum(data.mode, EventMode, event.mode)
        if data.meeting_link is not None:
            event.meeting_link = data.meeting_link
        if data.banner_image is not None:
            event.banner_image = data.banner_image
        if data.start_date is not None:
            event.start_datetime = data.start_date
        if data.end_date is not None:
            event.end_datetime = data.end_date
        if data.registration_deadline is not None:
            event.registration_deadline = data.registration_deadline
        if data.max_participants is not None:
            event.capacity = data.max_participants
        if data.status is not None:
            event.status = _safe_enum(data.status, EventStatus, event.status)
        if data.is_free is not None:
            event.is_free = data.is_free
        if data.ticket_price is not None:
            event.ticket_price = data.ticket_price
        if data.cme_credits is not None:
            event.cme_credits = data.cme_credits
        if data.certificate_available is not None:
            event.certificate_available = data.certificate_available
        if data.tags is not None:
            event.tags = data.tags
        if data.speakers is not None:
            event.speakers = data.speakers
        if data.agenda is not None:
            event.agenda = data.agenda
        event.updated_at = datetime.now(timezone.utc)
        await event.save()
        return {"message": "Event updated successfully"}

    @staticmethod
    async def delete_event(event_id: str, host_id: str) -> dict[str, str]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")
        if event.host_id != host_id:
            raise AuthorizationError("Only the organizer can delete this event")
        event.is_deleted = True
        event.updated_at = datetime.now(timezone.utc)
        await event.save()
        return {"message": "Event deleted successfully"}

    @staticmethod
    async def register_for_event(event_id: str, user_id: str) -> dict[str, Any]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")
        if event.status != EventStatus.PUBLISHED:
            raise AuthorizationError("This event is not accepting registrations")
        existing = await EventRepository.find_registration(event_id, user_id)
        if existing:
            raise ConflictError("You are already registered for this event")
        if event.capacity > 0 and event.registered_count >= event.capacity:
            raise AuthorizationError("This event is fully booked")
        registration_id = secrets.token_hex(16)
        registration = EventRegistration(
            registration_id=registration_id,
            event_id=event_id,
            user_id=user_id,
            registered_at=datetime.now(timezone.utc),
        )
        await registration.insert()
        event.registered_count += 1
        await event.save()
        await notify_event_registration(user_id, event_id, event.title)

        attendee_name = await _applicant_name(user_id)
        for recipient in await resolve_posting_recipients(event.host_id, event.organization_id, user_id):
            await notify_event_registration_received(
                recipient, event.event_id, event.title, user_id, attendee_name
            )

        return {"registration_id": registration_id, "message": "Registration confirmed"}

    @staticmethod
    async def cancel_registration(event_id: str, user_id: str) -> dict[str, str]:
        registration = await EventRepository.find_registration(event_id, user_id)
        if not registration:
            raise NotFoundError("Registration not found")
        await registration.delete()
        event = await EventRepository.find_by_id(event_id)
        if event:
            event.registered_count = max(0, event.registered_count - 1)
            await event.save()
        return {"message": "Registration cancelled"}

    @staticmethod
    async def mark_attendance(
        event_id: str,
        user_id: str,
        attendance_status: str = "present",
        target_user_id: str | None = None,
    ) -> dict[str, Any]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")

        target_id = target_user_id or user_id
        is_organizer = event.host_id == user_id
        if target_id != user_id and not is_organizer:
            raise AuthorizationError("Only the organizer can mark attendance for others")

        registration = await EventRepository.find_registration(event_id, target_id)
        if not registration:
            raise NotFoundError("Registration not found")
        if registration.registration_status == EventRegistrationStatus.CANCELLED:
            raise ConflictError("Cannot mark attendance for a cancelled registration")

        status = _safe_enum(attendance_status, AttendanceStatus, AttendanceStatus.PRESENT)
        registration.attendance_status = status
        registration.attendance_marked_at = datetime.now(timezone.utc)
        await registration.save()

        target = await UserRepository.find_by_user_id(target_id)
        return {
            "message": f"Attendance marked as {status.value}",
            "event_id": event_id,
            "user_id": target_id,
            "attendance_status": status.value,
            "attendance_marked_at": registration.attendance_marked_at,
            "user": {
                "user_id": target_id,
                "full_name": getattr(target, "full_name", None),
                "email": getattr(target, "email", None),
                "profile_image": getattr(target, "profile_image", None),
            } if target else None,
        }

    @staticmethod
    def _registration_dict(r: EventRegistration) -> dict[str, Any]:
        return {
            "event_id": r.event_id,
            "user_id": r.user_id,
            "registration_status": r.registration_status,
            "attendance_status": r.attendance_status,
            "attendance_marked_at": r.attendance_marked_at,
            "certificate_issued": r.certificate_issued,
            "registered_at": r.registered_at,
            "created_at": r.created_at,
        }

    @staticmethod
    async def get_event_registrations(event_id: str, host_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")
        if event.host_id != host_id:
            raise AuthorizationError("Only the organizer can view registrations")
        skip = (page - 1) * per_page
        registrations = await EventRepository.get_registrations(event_id, skip, per_page)
        total = await EventRepository.count_registrations(event_id)
        rows = await enrich(
            [EventService._registration_dict(r) for r in registrations], user_key="user_id"
        )
        for row in rows:
            row["event"] = {"event_id": event.event_id, "title": event.title}
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def get_organized_registrations(host_id: str, page: int = 1, per_page: int = 20, attendance_status: str | None = None) -> dict[str, Any]:
        """Every registration across all events the user organizes."""
        events = await EventRepository.find_by_organizer(host_id, 0, 10**6)
        event_map = {e.event_id: e for e in events}
        if not event_map:
            return paginate_response([], 0, page, per_page, "created_at")

        query = [In(EventRegistration.event_id, list(event_map)), EventRegistration.is_deleted == False]
        if attendance_status:
            query.append(EventRegistration.attendance_status == attendance_status)

        total = await EventRegistration.find(*query).count()
        regs = await EventRegistration.find(*query).sort("-created_at").skip((page - 1) * per_page).limit(per_page).to_list()
        rows = await enrich(
            [EventService._registration_dict(r) for r in regs], user_key="user_id"
        )
        for row in rows:
            ev = event_map.get(row["event_id"])
            row["event"] = {"event_id": ev.event_id, "title": ev.title} if ev else None
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def get_user_registrations(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        registrations = await EventRepository.get_user_registrations(user_id, 0, 10**6)
        total = len(registrations)
        event_ids = [r.event_id for r in registrations]
        events = []
        if event_ids:
            from beanie.odm.operators.find.comparison import In
            all_events = {
                e.event_id: e
                for e in await Event.find(In(Event.event_id, event_ids)).to_list()
            }
            registered_ids, saved_ids = await EventService._user_event_context(user_id)
            ordered = [all_events[eid] for eid in event_ids if eid in all_events]
            page_items = ordered[skip:skip + per_page]
            events = [EventService._to_dict(e, registered_ids, saved_ids) for e in page_items]
        return paginate_response(events, total, page, per_page, "created_at")

    @staticmethod
    async def get_user_organized_events(host_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        events = await EventRepository.find_by_organizer(host_id, skip, per_page)
        total = await EventRepository.count_by_organizer(host_id)
        registered_ids, saved_ids = await EventService._user_event_context(host_id)
        items = [EventService._to_dict(e, registered_ids, saved_ids) for e in events]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def save_event(event_id: str, user_id: str) -> dict[str, str]:
        event = await EventRepository.find_by_id(event_id)
        if not event:
            raise NotFoundError("Event not found")
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved = list(user.saved_events or [])
        if event_id not in saved:
            saved.append(event_id)
            user.saved_events = saved
            await user.save()
        return {"message": "Event saved"}

    @staticmethod
    async def unsave_event(event_id: str, user_id: str) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved = list(user.saved_events or [])
        if event_id in saved:
            user.saved_events = [e for e in saved if e != event_id]
            await user.save()
        return {"message": "Event removed from saved"}

    @staticmethod
    async def get_saved_events(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from beanie.odm.operators.find.comparison import In
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved_ids = list(user.saved_events or [])
        events = await Event.find(In(Event.event_id, saved_ids), Event.is_deleted == False).to_list() if saved_ids else []
        total = len(events)
        skip = (page - 1) * per_page
        page_items = events[skip:skip + per_page]
        registered_ids, _ = await EventService._user_event_context(user_id)
        return paginate_response([EventService._to_dict(e, registered_ids, saved_ids) for e in page_items], total, page, per_page, "created_at")

    @staticmethod
    async def _user_event_context(user_id: str | None) -> tuple[set[str], set[str]]:
        if not user_id:
            return set(), set()
        registered_ids: set[str] = set()
        saved_ids: set[str] = set()
        try:
            ids = await EventRepository.get_user_registration_ids(user_id)
            if isinstance(ids, list):
                registered_ids = set(ids)
        except Exception:
            logger.exception("Failed to load registration ids for %s", user_id)
        try:
            user = await UserRepository.find_by_user_id(user_id)
            if user:
                saved_ids = set(user.saved_events or [])
        except Exception:
            logger.exception("Failed to load saved events for %s", user_id)
        return registered_ids, saved_ids

    @staticmethod
    def _to_dict(event: Event, registered_ids: set[str] | None = None, saved_ids: set[str] | None = None) -> dict[str, Any]:
        registered_ids = registered_ids or set()
        saved_ids = saved_ids or set()

        status_raw = event.status.value if hasattr(event.status, "value") else event.status
        if status_raw in ("cancelled",):
            status = "cancelled"
        elif status_raw in ("draft",):
            status = "upcoming"
        else:
            now = datetime.now(timezone.utc)
            start = event.start_datetime
            end = event.end_datetime or start
            if start is not None and start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if end is not None and end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            if start is not None and now < start:
                status = "upcoming"
            elif start is not None and end is not None and start <= now <= end:
                status = "live"
            else:
                status = "completed"

        mode_raw = event.mode.value if hasattr(event.mode, "value") else event.mode
        mode = _EVENT_MODE_MAP.get(mode_raw, mode_raw)

        tags = _safe_list(getattr(event, "tags", None))
        speakers_raw = _safe_list(getattr(event, "speakers", None))
        speakers = [
            {
                "_id": str(i),
                "name": s if isinstance(s, str) else (s.get("name") if isinstance(s, dict) else ""),
                "title": s.get("title") if isinstance(s, dict) else "",
                "organization": s.get("organization") if isinstance(s, dict) else "",
            }
            for i, s in enumerate(speakers_raw)
        ]
        agenda_raw = _safe_list(getattr(event, "agenda", None))
        agenda = [
            {**a, "_id": a.get("_id") or str(i)}
            for i, a in enumerate(agenda_raw)
            if isinstance(a, dict)
        ]

        event_type_raw = event.event_type.value if hasattr(event.event_type, "value") else getattr(event, "event_type", None)
        location = getattr(event, "location", None) or getattr(event, "venue", "") or ""

        return {
            "_id": event.event_id,
            "event_id": event.event_id,
            "host_id": event.host_id,
            "organization_id": event.organization_id,
            "organizer": None,
            "organizerType": "User",
            "title": event.title,
            "description": event.description,
            "mode": mode,
            "status": status,
            "startDate": event.start_datetime,
            "endDate": event.end_datetime,
            "registrationDeadline": getattr(event, "registration_deadline", None),
            "location": location,
            "onlineLink": getattr(event, "meeting_link", "") or "",
            "maxAttendees": getattr(event, "capacity", 0) or 0,
            "attendeesCount": getattr(event, "registered_count", 0) or 0,
            "banner": getattr(event, "banner_image", "") or "",
            "tags": tags,
            "speakers": speakers,
            "agenda": agenda,
            "certificateInfo": {
                "enabled": bool(getattr(event, "certificate_available", False)),
                "requirements": "",
            },
            "isRegistered": event.event_id in registered_ids,
            "isSaved": event.event_id in saved_ids,
            "event_type": event_type_raw,
            "createdAt": event.created_at,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "meeting_link": getattr(event, "meeting_link", "") or "",
            "capacity": getattr(event, "capacity", 0) or 0,
            "registered_count": getattr(event, "registered_count", 0) or 0,
        }
