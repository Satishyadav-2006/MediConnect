import logging
import secrets
from datetime import datetime, timezone
from typing import Any
from app.models.mentorship import MentorshipRequest, MentorshipSession, MentorProfile, AvailabilitySlot
from app.repositories.mentorship_repository import MentorshipRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError, ValidationAppError
from app.schemas.mentorship import (
    MentorshipRequestCreate, MentorshipRequestUpdate,
    MentorshipSessionRequest, MentorshipSessionUpdate,
    MentorProfileUpdate,
)
from app.models.base import MentorshipRequestStatus, MentorshipGoal, PROFESSIONAL_MENTOR_ROLES, MIN_MENTOR_EXPERIENCE_YEARS
from app.utils.validators import sanitize_string
from app.services.notification_helper import notify_mentorship_request, notify_mentorship_accepted
from app.utils.pagination import paginate_response

logger = logging.getLogger(__name__)


def _safe_enum(value, enum_cls, default):
    if value and value in [e.value for e in enum_cls]:
        return enum_cls(value)
    return default


class MentorshipService:

    @staticmethod
    async def send_request(mentee_id: str, data: MentorshipRequestCreate) -> dict[str, Any]:
        if mentee_id == data.mentor_id:
            raise AuthorizationError("You cannot mentor yourself")
        from app.models.user import User
        mentor = await User.find_one(User.user_id == data.mentor_id)
        if not mentor:
            raise NotFoundError("Mentor not found")
        if not mentor.mentor_available or not MentorshipService._is_mentor_eligible(mentor):
            raise AuthorizationError("This user is not available as a mentor")
        existing = await MentorshipRepository.find_pending_request(data.mentor_id, mentee_id)
        if existing:
            raise ConflictError("You already have a pending request with this mentor")
        active = await MentorshipRepository.find_active_mentorship(data.mentor_id, mentee_id)
        if active:
            raise ConflictError("You already have an active mentorship with this mentor")
        request_id = secrets.token_hex(16)
        request = MentorshipRequest(
            request_id=request_id,
            mentor_id=data.mentor_id,
            mentee_id=mentee_id,
            goal=_safe_enum(data.goal, MentorshipGoal, MentorshipGoal.CAREER_GUIDANCE),
            message=sanitize_string(data.message),
        )
        await request.insert()
        await notify_mentorship_request(data.mentor_id, mentee_id, request_id)
        return {"request_id": request_id, "message": "Mentorship request sent"}

    @staticmethod
    async def respond_to_request(request_id: str, mentor_id: str, data: MentorshipRequestUpdate) -> dict[str, str]:
        request = await MentorshipRepository.find_request(request_id)
        if not request:
            raise NotFoundError("Request not found")
        if request.mentor_id != mentor_id:
            raise AuthorizationError("Only the mentor can respond to this request")
        if request.status != MentorshipRequestStatus.PENDING:
            raise AuthorizationError("This request has already been processed")
        request.status = _safe_enum(data.status, MentorshipRequestStatus, MentorshipRequestStatus.PENDING)
        request.response_message = data.response_message
        await request.save()
        if request.status == MentorshipRequestStatus.ACCEPTED:
            await notify_mentorship_accepted(request.mentee_id, request.mentor_id)
        return {"message": f"Request {request.status.value}"}

    @staticmethod
    async def get_mentor_requests(mentor_id: str, status: str = "pending", page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        requests = await MentorshipRepository.get_mentor_requests(mentor_id, status, skip, per_page)
        total = len(requests)
        items = [await MentorshipService._request_dict(r) for r in requests]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_mentee_requests(mentee_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        requests = await MentorshipRepository.get_mentee_requests(mentee_id, skip, per_page)
        total = len(requests)
        items = [await MentorshipService._request_dict(r) for r in requests]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_user_mentorships(user_id: str, role: str = "mentee", page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        if role == "mentor":
            mentorships = await MentorshipRequest.find(
                MentorshipRequest.mentor_id == user_id,
            ).sort("-created_at").skip(skip).limit(per_page).to_list()
            total = await MentorshipRequest.find(MentorshipRequest.mentor_id == user_id).count()
        else:
            mentorships = await MentorshipRequest.find(
                MentorshipRequest.mentee_id == user_id,
            ).sort("-created_at").skip(skip).limit(per_page).to_list()
            total = await MentorshipRequest.find(MentorshipRequest.mentee_id == user_id).count()
        items = [await MentorshipService._request_dict(r) for r in mentorships]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_mentorship(mentorship_id: str, user_id: str) -> dict[str, Any]:
        request = await MentorshipRequest.find_one(MentorshipRequest.request_id == mentorship_id)
        if not request:
            raise NotFoundError("Mentorship not found")
        if request.mentor_id != user_id and request.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        return await MentorshipService._to_dict(request)

    @staticmethod
    async def update_mentorship(mentorship_id: str, user_id: str, data: MentorshipRequestUpdate) -> dict[str, str]:
        request = await MentorshipRequest.find_one(MentorshipRequest.request_id == mentorship_id)
        if not request:
            raise NotFoundError("Mentorship not found")
        if request.mentor_id != user_id and request.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        if data.status is not None:
            request.status = _safe_enum(data.status, MentorshipRequestStatus, request.status)
        if data.response_message is not None:
            request.response_message = data.response_message
        request.updated_at = datetime.now(timezone.utc)
        await request.save()
        return {"message": "Mentorship updated"}

    @staticmethod
    async def add_session(mentorship_id: str, user_id: str, data: MentorshipSessionRequest) -> dict[str, Any]:
        request = await MentorshipRequest.find_one(MentorshipRequest.request_id == mentorship_id)
        if not request:
            raise NotFoundError("Mentorship not found")
        if request.mentor_id != user_id and request.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        if request.status != MentorshipRequestStatus.ACCEPTED:
            raise ValidationAppError("Sessions can only be scheduled for accepted mentorships")
        session_id = secrets.token_hex(8)
        session = MentorshipSession(
            session_id=session_id,
            request_id=mentorship_id,
            mentor_id=request.mentor_id,
            mentee_id=request.mentee_id,
            scheduled_at=data.scheduled_at,
            duration=max(10, min(int(data.duration_minutes or 30), 240)),
            topic=sanitize_string(data.topic),
        )
        await session.insert()
        return {"session_id": session_id, "message": "Session scheduled"}

    @staticmethod
    async def update_session(mentorship_id: str, session_id: str, user_id: str, data: MentorshipSessionUpdate) -> dict[str, str]:
        session = await MentorshipSession.find_one(
            MentorshipSession.session_id == session_id,
            MentorshipSession.request_id == mentorship_id,
        )
        if not session:
            raise NotFoundError("Session not found")
        if session.mentor_id != user_id and session.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        if data.scheduled_at is not None:
            session.scheduled_at = data.scheduled_at
        if data.duration_minutes is not None:
            session.duration = max(10, min(int(data.duration_minutes), 240))
        if data.topic is not None:
            session.topic = sanitize_string(data.topic)
        if data.meeting_link is not None:
            session.meeting_link = sanitize_string(data.meeting_link)
        if data.notes is not None:
            session.notes = sanitize_string(data.notes)
        if data.status is not None:
            status_val = data.status.strip().lower()
            if status_val in ("cancelled", "canceled"):
                session.status = "cancelled"
            elif status_val in ("completed", "complete"):
                session.status = "completed"
                session.completed_at = datetime.now(timezone.utc)
            elif status_val == "scheduled":
                session.status = "scheduled"
                session.completed_at = None
            else:
                raise ValidationAppError("Invalid session status")
        if data.completed:
            session.status = "completed"
            session.completed_at = datetime.now(timezone.utc)
        if data.rating is not None:
            session.rating = max(0, min(int(data.rating), 5))
        if data.feedback is not None:
            session.feedback = sanitize_string(data.feedback)
        session.updated_at = datetime.now(timezone.utc)
        await session.save()
        return {"message": "Session updated"}

    @staticmethod
    def _role_value(user) -> str:
        return user.role.value if hasattr(user.role, "value") else str(user.role)

    @staticmethod
    def _string(value) -> str:
        return (value or "").strip()

    @staticmethod
    def _mentor_criteria(user) -> list[dict[str, Any]]:
        role = MentorshipService._role_value(user)
        verification = user.verification_status.value if hasattr(user.verification_status, "value") else str(user.verification_status)
        return [
            {"key": "role", "label": "Professional role", "met": role in [r.value for r in PROFESSIONAL_MENTOR_ROLES]},
            {"key": "verification", "label": "Verified profile", "met": verification == "approved"},
            {"key": "license", "label": "License number on profile", "met": bool(MentorshipService._string(user.license_number))},
            {"key": "specialization", "label": "Specialization on profile", "met": bool(MentorshipService._string(user.specialization))},
            {"key": "experience", "label": f"{MIN_MENTOR_EXPERIENCE_YEARS}+ years of experience", "met": (user.experience_years or 0) >= MIN_MENTOR_EXPERIENCE_YEARS},
        ]

    @staticmethod
    def _is_mentor_eligible(user) -> bool:
        return all(c["met"] for c in MentorshipService._mentor_criteria(user))

    @staticmethod
    async def get_mentor_status(user_id: str) -> dict[str, Any]:
        from app.models.user import User
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        criteria = MentorshipService._mentor_criteria(user)
        return {
            "isMentor": bool(user.mentor_available),
            "eligible": all(c["met"] for c in criteria),
            "criteria": criteria,
        }

    @staticmethod
    async def _ensure_profile(user_id: str) -> MentorProfile:
        profile = await MentorProfile.find_one(MentorProfile.mentor_id == user_id)
        if profile:
            if not profile.is_active:
                profile.is_active = True
                await profile.save()
            return profile
        profile = MentorProfile(
            profile_id=secrets.token_hex(16),
            mentor_id=user_id,
            is_active=True,
        )
        await profile.insert()
        return profile

    @staticmethod
    async def become_mentor(user_id: str) -> dict[str, Any]:
        from app.models.user import User
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        criteria = MentorshipService._mentor_criteria(user)
        unmet = [c for c in criteria if not c["met"]]
        if unmet:
            raise ValidationAppError(
                "You do not meet the requirements to become a mentor yet",
                errors={"criteria": criteria},
            )
        if user.mentor_available:
            return {"message": "You are already available as a mentor"}
        user.mentor_available = True
        await user.save()
        await MentorshipService._ensure_profile(user_id)
        return {"message": "You are now available as a mentor"}

    @staticmethod
    async def opt_out(user_id: str) -> dict[str, Any]:
        from app.models.user import User
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        user.mentor_available = False
        await user.save()
        await MentorProfile.find_one(MentorProfile.mentor_id == user_id).update({"$set": {"is_active": False}})
        return {"message": "You are no longer available as a mentor"}

    @staticmethod
    async def get_available_mentors(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        users = await MentorshipRepository.find_available_mentors(skip, per_page)
        total = await MentorshipRepository.count_available_mentors()
        mentors = [await MentorshipService._build_mentor(u) for u in users]
        return paginate_response(mentors, total, page, per_page, "_id")

    @staticmethod
    async def get_mentor(mentor_id: str) -> dict[str, Any]:
        from app.models.user import User
        user = await User.find_one(User.user_id == mentor_id)
        if not user or not user.mentor_available:
            raise NotFoundError("Mentor not found")
        return await MentorshipService._build_mentor(user)

    @staticmethod
    async def update_mentor(mentor_id: str, user_id: str, data: MentorProfileUpdate) -> dict[str, str]:
        if mentor_id != user_id:
            raise AuthorizationError("You can only update your own mentor profile")
        from app.models.user import User
        user = await User.find_one(User.user_id == user_id)
        if not user or not user.mentor_available:
            raise NotFoundError("Mentor not found")
        profile = await MentorshipService._ensure_profile(user_id)
        if data.bio is not None:
            profile.bio = sanitize_string(data.bio)
        if data.specializations is not None:
            profile.specializations = [MentorshipService._string(s) for s in data.specializations if MentorshipService._string(s)]
        if data.max_mentees is not None:
            profile.max_mentees = max(1, min(data.max_mentees, 20))
        if data.availability is not None:
            profile.availability = [
                AvailabilitySlot(day=s.day, start_time=MentorshipService._string(s.startTime), end_time=MentorshipService._string(s.endTime))
                for s in data.availability
            ]
        await profile.save()
        return {"message": "Mentor profile updated"}

    @staticmethod
    async def delete_mentor(mentor_id: str, user_id: str) -> dict[str, str]:
        if mentor_id != user_id:
            raise AuthorizationError("You can only remove yourself as a mentor")
        return await MentorshipService.opt_out(user_id)

    @staticmethod
    async def _build_mentor(user) -> dict[str, Any]:
        profile = await MentorProfile.find_one(MentorProfile.mentor_id == user.user_id)
        active_mentees = await MentorshipRequest.find(
            MentorshipRequest.mentor_id == user.user_id,
            MentorshipRequest.status == MentorshipRequestStatus.ACCEPTED,
        ).count()
        rated_sessions = await MentorshipSession.find(
            MentorshipSession.mentor_id == user.user_id,
            MentorshipSession.rating > 0,
        ).to_list()
        ratings = [s.rating for s in rated_sessions]
        rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
        specializations = list(profile.specializations) if (profile and profile.specializations) else ([user.specialization] if user.specialization else [])
        availability = [
            {"day": s.day, "startTime": s.start_time, "endTime": s.end_time}
            for s in (profile.availability if profile else [])
        ]
        return {
            "_id": user.user_id,
            "user": MentorshipService._user_dict(user),
            "specializations": specializations,
            "bio": (profile.bio if profile and profile.bio else (user.bio or "")),
            "yearsOfExperience": user.experience_years or 0,
            "menteesCount": active_mentees,
            "maxMentees": profile.max_mentees if profile else 5,
            "availability": availability,
            "rating": rating,
            "reviewsCount": len(ratings),
            "isAvailable": bool(user.mentor_available) and (profile.is_active if profile else True),
        }

    @staticmethod
    async def get_mentor_dashboard(mentor_id: str) -> dict[str, Any]:
        from app.models.user import User
        active_mentees = await MentorshipRequest.find(
            MentorshipRequest.mentor_id == mentor_id,
            MentorshipRequest.status == MentorshipRequestStatus.ACCEPTED,
        ).count()
        completed_sessions = await MentorshipSession.find(
            MentorshipSession.mentor_id == mentor_id,
            MentorshipSession.status == "completed",
        ).count()
        pending_requests = await MentorshipRequest.find(
            MentorshipRequest.mentor_id == mentor_id,
            MentorshipRequest.status == MentorshipRequestStatus.PENDING,
        ).count()
        upcoming_sessions = await MentorshipSession.find(
            MentorshipSession.mentor_id == mentor_id,
            MentorshipSession.status == "scheduled",
            MentorshipSession.scheduled_at >= datetime.now(timezone.utc),
        ).sort("scheduled_at").limit(5).to_list()
        upcoming = []
        for s in upcoming_sessions:
            mentee = await User.find_one(User.user_id == s.mentee_id)
            upcoming.append({
                "_id": s.session_id,
                "mentee": MentorshipService._user_dict(mentee) if mentee else {"_id": s.mentee_id},
                "scheduledAt": s.scheduled_at,
                "topic": s.topic,
            })
        recent_requests = await MentorshipRequest.find(
            MentorshipRequest.mentor_id == mentor_id,
        ).sort("-created_at").limit(10).to_list()
        recent_sessions = await MentorshipSession.find(
            MentorshipSession.mentor_id == mentor_id,
        ).sort("-created_at").limit(10).to_list()
        request_actions = {
            MentorshipRequestStatus.PENDING: "sent a mentorship request",
            MentorshipRequestStatus.ACCEPTED: "started a mentorship with you",
            MentorshipRequestStatus.REJECTED: "request was rejected",
            MentorshipRequestStatus.COMPLETED: "completed a mentorship",
        }
        activities = []
        for r in recent_requests:
            mentee = await User.find_one(User.user_id == r.mentee_id)
            activities.append({
                "_id": r.request_id,
                "mentee": MentorshipService._user_dict(mentee) if mentee else {"_id": r.mentee_id},
                "action": request_actions.get(r.status, "updated their mentorship request"),
                "createdAt": r.created_at,
            })
        for s in recent_sessions:
            mentee = await User.find_one(User.user_id == s.mentee_id)
            activities.append({
                "_id": s.session_id,
                "mentee": MentorshipService._user_dict(mentee) if mentee else {"_id": s.mentee_id},
                "action": "session scheduled" if s.status == "scheduled" else "session completed",
                "createdAt": s.created_at,
            })
        activities.sort(key=lambda a: (a["createdAt"] or datetime(1970, 1, 1, tzinfo=timezone.utc)), reverse=True)
        return {
            "activeMentees": active_mentees,
            "completedSessions": completed_sessions,
            "pendingRequests": pending_requests,
            "upcomingSessions": upcoming,
            "recentActivity": activities[:10],
        }

    @staticmethod
    async def get_session(session_id: str, user_id: str) -> dict[str, Any]:
        session = await MentorshipSession.find_one(MentorshipSession.session_id == session_id)
        if not session:
            raise NotFoundError("Session not found")
        if session.mentor_id != user_id and session.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        return MentorshipService._session_dict(session)

    @staticmethod
    async def get_mentorship_sessions(mentorship_id: str, user_id: str) -> dict[str, Any]:
        request = await MentorshipRequest.find_one(MentorshipRequest.request_id == mentorship_id)
        if not request:
            raise NotFoundError("Mentorship not found")
        if request.mentor_id != user_id and request.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        sessions = await MentorshipSession.find(
            MentorshipSession.request_id == mentorship_id,
        ).sort("-scheduled_at").to_list()
        items = [MentorshipService._session_dict(s) for s in sessions]
        return {"items": items, "total": len(items)}

    @staticmethod
    async def delete_session(session_id: str, user_id: str) -> dict[str, str]:
        session = await MentorshipSession.find_one(MentorshipSession.session_id == session_id)
        if not session:
            raise NotFoundError("Session not found")
        if session.mentor_id != user_id and session.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        await session.delete()
        return {"message": "Session deleted"}

    @staticmethod
    async def session_feedback(session_id: str, user_id: str, data) -> dict[str, str]:
        session = await MentorshipSession.find_one(MentorshipSession.session_id == session_id)
        if not session:
            raise NotFoundError("Session not found")
        if session.mentor_id != user_id and session.mentee_id != user_id:
            raise AuthorizationError("Access denied")
        session.rating = data.rating
        session.feedback = sanitize_string(data.feedback)
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        session.updated_at = datetime.now(timezone.utc)
        await session.save()
        return {"message": "Feedback submitted"}

    @staticmethod
    def _session_dict(session: MentorshipSession) -> dict[str, Any]:
        return {
            "_id": session.session_id,
            "session_id": session.session_id,
            "request_id": session.request_id,
            "mentor_id": session.mentor_id,
            "mentee_id": session.mentee_id,
            "scheduledAt": session.scheduled_at,
            "scheduled_at": session.scheduled_at,
            "duration": session.duration,
            "duration_minutes": session.duration,
            "topic": session.topic,
            "meeting_link": session.meeting_link,
            "meetingLink": session.meeting_link,
            "notes": session.notes,
            "status": session.status,
            "completed_at": session.completed_at,
            "completedAt": session.completed_at,
            "rating": session.rating,
            "feedback": session.feedback,
            "createdAt": session.created_at,
            "created_at": session.created_at,
            "updatedAt": session.updated_at,
            "updated_at": session.updated_at,
        }

    @staticmethod
    def _user_dict(user) -> dict[str, Any]:
        role = user.role.value if hasattr(user.role, 'value') else user.role
        account_status = user.account_status.value if hasattr(user.account_status, 'value') else user.account_status
        verification_status = user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status
        return {
            "_id": user.user_id,
            "user_id": user.user_id,
            "username": user.username,
            "fullName": f"{user.first_name} {user.last_name}".strip(),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profilePhoto": user.profile_photo,
            "profile_photo": user.profile_photo,
            "headline": user.headline,
            "specialization": user.specialization,
            "bio": user.bio,
            "role": role,
            "accountStatus": account_status,
            "account_status": account_status,
            "verificationStatus": verification_status,
            "verification_status": verification_status,
        }

    @staticmethod
    async def _request_dict(request: MentorshipRequest) -> dict[str, Any]:
        from app.models.user import User
        mentor = await User.find_one(User.user_id == request.mentor_id)
        mentee = await User.find_one(User.user_id == request.mentee_id)
        status = request.status.value if hasattr(request.status, 'value') else request.status
        return {
            "_id": request.request_id,
            "request_id": request.request_id,
            "mentor": MentorshipService._user_dict(mentor) if mentor else {"_id": request.mentor_id},
            "mentee": MentorshipService._user_dict(mentee) if mentee else {"_id": request.mentee_id},
            "mentor_id": request.mentor_id,
            "mentee_id": request.mentee_id,
            "message": request.message,
            "response_message": request.response_message,
            "status": status,
            "createdAt": request.created_at,
            "created_at": request.created_at,
            "updatedAt": request.updated_at,
            "updated_at": request.updated_at,
        }

    @staticmethod
    async def _to_dict(request: MentorshipRequest) -> dict[str, Any]:
        return await MentorshipService._request_dict(request)
