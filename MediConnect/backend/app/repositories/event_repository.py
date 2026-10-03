from datetime import datetime, timezone
from typing import Any
from app.models.event import Event, EventRegistration
from app.models.base import EventStatus


class EventRepository:

    @staticmethod
    async def find_by_id(event_id: str) -> Event | None:
        return await Event.find_one(Event.event_id == event_id, Event.is_deleted == False)

    @staticmethod
    async def find_upcoming(skip: int = 0, limit: int = 20) -> list[Event]:
        now = datetime.now(timezone.utc)
        return await Event.find(
            Event.status == EventStatus.PUBLISHED,
            Event.start_datetime >= now,
            Event.is_deleted == False,
        ).sort("start_datetime").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_upcoming() -> int:
        now = datetime.now(timezone.utc)
        return await Event.find(
            Event.status == EventStatus.PUBLISHED,
            Event.start_datetime >= now,
            Event.is_deleted == False,
        ).count()

    @staticmethod
    async def find_live(skip: int = 0, limit: int = 20) -> list[Event]:
        now = datetime.now(timezone.utc)
        return await Event.find(
            Event.status == EventStatus.PUBLISHED,
            Event.start_datetime <= now,
            Event.end_datetime >= now,
            Event.is_deleted == False,
        ).sort("start_datetime").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_live() -> int:
        now = datetime.now(timezone.utc)
        return await Event.find(
            Event.status == EventStatus.PUBLISHED,
            Event.start_datetime <= now,
            Event.end_datetime >= now,
            Event.is_deleted == False,
        ).count()

    @staticmethod
    async def find_completed(skip: int = 0, limit: int = 20) -> list[Event]:
        now = datetime.now(timezone.utc)
        return await Event.find(
            Event.status == EventStatus.PUBLISHED,
            Event.end_datetime < now,
            Event.is_deleted == False,
        ).sort("-end_datetime").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_completed() -> int:
        now = datetime.now(timezone.utc)
        return await Event.find(
            Event.status == EventStatus.PUBLISHED,
            Event.end_datetime < now,
            Event.is_deleted == False,
        ).count()

    @staticmethod
    async def find_by_status(status: EventStatus, skip: int = 0, limit: int = 20) -> list[Event]:
        return await Event.find(
            Event.status == status, Event.is_deleted == False
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_by_status(status: EventStatus) -> int:
        return await Event.find(Event.status == status, Event.is_deleted == False).count()

    @staticmethod
    async def find_visible(skip: int = 0, limit: int = 20) -> list[Event]:
        return await Event.find(
            Event.status != EventStatus.DRAFT,
            Event.status != EventStatus.CANCELLED,
            Event.status != EventStatus.ARCHIVED,
            Event.is_deleted == False,
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_visible() -> int:
        return await Event.find(
            Event.status != EventStatus.DRAFT,
            Event.status != EventStatus.CANCELLED,
            Event.status != EventStatus.ARCHIVED,
            Event.is_deleted == False,
        ).count()

    @staticmethod
    async def find_by_organizer(organizer_id: str, skip: int = 0, limit: int = 20) -> list[Event]:
        return await Event.find(
            Event.host_id == organizer_id, Event.is_deleted == False
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_by_organizer(organizer_id: str) -> int:
        return await Event.find(Event.host_id == organizer_id, Event.is_deleted == False).count()

    @staticmethod
    async def find_registration(event_id: str, user_id: str) -> EventRegistration | None:
        return await EventRegistration.find_one(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user_id,
        )

    @staticmethod
    async def get_registrations(event_id: str, skip: int = 0, limit: int = 20) -> list[EventRegistration]:
        return await EventRegistration.find(
            EventRegistration.event_id == event_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_registrations(event_id: str) -> int:
        return await EventRegistration.find(EventRegistration.event_id == event_id).count()

    @staticmethod
    async def get_user_registrations(user_id: str, skip: int = 0, limit: int = 20) -> list[EventRegistration]:
        return await EventRegistration.find(
            EventRegistration.user_id == user_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def get_user_registration_ids(user_id: str) -> list[str]:
        registrations = await EventRegistration.find(
            EventRegistration.user_id == user_id
        ).to_list()
        return [r.event_id for r in registrations]
