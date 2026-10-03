from typing import Any
from app.models.mentorship import MentorshipRequest
from app.models.base import UserRole, PROFESSIONAL_MENTOR_ROLES, MIN_MENTOR_EXPERIENCE_YEARS


def _available_mentor_query() -> dict[str, Any]:
    return {
        "account_status": "active",
        "mentor_available": True,
        "role": {"$in": [r.value for r in PROFESSIONAL_MENTOR_ROLES]},
        "verification_status": "approved",
        "license_number": {"$type": "string", "$nin": [""]},
        "specialization": {"$type": "string", "$nin": [""]},
        "experience_years": {"$gte": MIN_MENTOR_EXPERIENCE_YEARS},
    }


class MentorshipRepository:

    @staticmethod
    async def find_request(request_id: str) -> MentorshipRequest | None:
        return await MentorshipRequest.find_one(MentorshipRequest.request_id == request_id)

    @staticmethod
    async def find_pending_request(mentor_id: str, mentee_id: str) -> MentorshipRequest | None:
        return await MentorshipRequest.find_one(
            MentorshipRequest.mentor_id == mentor_id,
            MentorshipRequest.mentee_id == mentee_id,
            MentorshipRequest.status == "pending",
        )

    @staticmethod
    async def get_mentor_requests(mentor_id: str, status: str = "pending", skip: int = 0, limit: int = 20) -> list[MentorshipRequest]:
        return await MentorshipRequest.find(
            MentorshipRequest.mentor_id == mentor_id,
            MentorshipRequest.status == status,
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def get_mentee_requests(mentee_id: str, skip: int = 0, limit: int = 20) -> list[MentorshipRequest]:
        return await MentorshipRequest.find(
            MentorshipRequest.mentee_id == mentee_id,
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def find_active_mentorship(mentor_id: str, mentee_id: str) -> MentorshipRequest | None:
        return await MentorshipRequest.find_one(
            MentorshipRequest.mentor_id == mentor_id,
            MentorshipRequest.mentee_id == mentee_id,
            MentorshipRequest.status == "accepted",
        )

    @staticmethod
    async def find_by_id(mentorship_id: str) -> MentorshipRequest | None:
        return await MentorshipRequest.find_one(MentorshipRequest.request_id == mentorship_id)

    @staticmethod
    async def get_user_mentorships(user_id: str, role: str = "mentee", skip: int = 0, limit: int = 20) -> list[MentorshipRequest]:
        if role == "mentor":
            return await MentorshipRequest.find(
                MentorshipRequest.mentor_id == user_id,
            ).sort("-created_at").skip(skip).limit(limit).to_list()
        return await MentorshipRequest.find(
            MentorshipRequest.mentee_id == user_id,
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_user_mentorships(user_id: str, role: str = "mentee") -> int:
        if role == "mentor":
            return await MentorshipRequest.find(MentorshipRequest.mentor_id == user_id).count()
        return await MentorshipRequest.find(MentorshipRequest.mentee_id == user_id).count()

    @staticmethod
    async def find_available_mentors(skip: int = 0, limit: int = 20) -> list:
        from app.models.user import User
        return await User.find(_available_mentor_query()).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_available_mentors() -> int:
        from app.models.user import User
        return await User.find(_available_mentor_query()).count()
