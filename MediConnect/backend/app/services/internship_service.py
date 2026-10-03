import logging
import secrets
from datetime import datetime, timezone
from beanie.odm.operators.find.comparison import In
from typing import Any
from app.models.internship import Internship, InternshipApplication, Stipend
from app.models.organization import Organization
from app.repositories.internship_repository import InternshipRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.internship import InternshipCreateRequest, InternshipUpdateRequest, InternshipApplicationRequest
from app.models.base import InternshipStatus, InternshipType, WorkMode, ApplicationStatus
from app.utils.validators import sanitize_string
from app.utils.pagination import paginate_response
from app.services.applicant_helper import enrich
from app.services.notification_helper import (
    notify_internship_application_received,
    notify_internship_application_update,
    resolve_posting_recipients,
    _applicant_name,
)

logger = logging.getLogger(__name__)


def _safe_enum(value, enum_cls, default):
    if value and value in [e.value for e in enum_cls]:
        return enum_cls(value)
    return default


async def _resolve_organization_id(poster_id: str, organization_id: str | None) -> str | None:
    if organization_id:
        return organization_id
    org = await Organization.find_one(Organization.owner_id == poster_id, Organization.is_deleted == False)
    if org:
        return org.organization_id
    user = await UserRepository.find_by_user_id(poster_id)
    if user and user.organization_id:
        return user.organization_id
    return None


class InternshipService:

    @staticmethod
    async def create_internship(poster_id: str, data: InternshipCreateRequest) -> dict[str, Any]:
        internship_id = secrets.token_hex(16)
        org_id = await _resolve_organization_id(poster_id, data.organization_id)
        internship = Internship(
            internship_id=internship_id,
            mentor_id=poster_id,
            organization_id=org_id,
            title=sanitize_string(data.title),
            description=sanitize_string(data.description),
            department=data.department,
            location=data.location,
            work_mode=_safe_enum(data.work_mode, WorkMode, WorkMode.ONSITE),
            internship_type=_safe_enum(data.internship_type, InternshipType, InternshipType.CLINICAL),
            duration=data.duration_weeks,
            stipend=Stipend(minimum_stipend=data.stipend, currency=data.currency),
            skills=data.skills_required,
            eligibility=data.eligibility,
            vacancies=data.max_participants,
            is_paid=data.is_paid,
            start_date=data.start_date,
            end_date=data.end_date,
            deadline=data.application_deadline,
            status=InternshipStatus.PUBLISHED,
            search_keywords=[data.title.lower(), data.department.lower(), data.location.lower()],
        )
        await internship.insert()
        return {"internship_id": internship.internship_id, "message": "Internship posted successfully"}

    @staticmethod
    async def get_internships(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        internships = await InternshipRepository.find_active(skip, per_page)
        total = await InternshipRepository.count_active()
        return paginate_response([await InternshipService._to_dict(i) for i in internships], total, page, per_page, "created_at")

    @staticmethod
    async def get_organization_internships(org_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from app.services.search_service import _internship_dict
        skip = (page - 1) * per_page
        internships = await Internship.find(Internship.organization_id == org_id, Internship.is_deleted == False).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Internship.find(Internship.organization_id == org_id, Internship.is_deleted == False).count()
        org = await Organization.find_one(Organization.organization_id == org_id, Organization.is_deleted == False)
        items = [_internship_dict(i, org) for i in internships]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_recommended(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        internships = await InternshipRepository.find_active(skip, per_page)
        total = await InternshipRepository.count_active()
        return paginate_response([await InternshipService._to_dict(i) for i in internships], total, page, per_page, "created_at")

    @staticmethod
    async def save_internship(internship_id: str, user_id: str) -> dict[str, str]:
        internship = await InternshipRepository.find_by_id(internship_id)
        if not internship:
            raise NotFoundError("Internship not found")
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved = list(user.saved_internships or [])
        if internship_id not in saved:
            saved.append(internship_id)
            user.saved_internships = saved
            await user.save()
        return {"message": "Internship saved"}

    @staticmethod
    async def unsave_internship(internship_id: str, user_id: str) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved = list(user.saved_internships or [])
        if internship_id in saved:
            user.saved_internships = [i for i in saved if i != internship_id]
            await user.save()
        return {"message": "Internship removed from saved"}

    @staticmethod
    async def get_saved_internships(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from beanie.odm.operators.find.comparison import In
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved_ids = list(user.saved_internships or [])
        internships = await Internship.find(
            In(Internship.internship_id, saved_ids), Internship.is_deleted == False
        ).to_list() if saved_ids else []
        total = len(internships)
        skip = (page - 1) * per_page
        page_items = internships[skip:skip + per_page]
        return paginate_response([await InternshipService._to_dict(i) for i in page_items], total, page, per_page, "created_at")

    @staticmethod
    async def get_internship(internship_id: str) -> dict[str, Any]:
        internship = await InternshipRepository.find_by_id(internship_id)
        if not internship:
            raise NotFoundError("Internship not found")
        internship._removed_views = getattr(internship, '_removed_views', 0) + 1
        await internship.save()
        return await InternshipService._to_dict(internship)

    @staticmethod
    async def update_internship(internship_id: str, poster_id: str, data: InternshipUpdateRequest) -> dict[str, str]:
        internship = await InternshipRepository.find_by_id(internship_id)
        if not internship:
            raise NotFoundError("Internship not found")
        if internship.mentor_id != poster_id:
            raise AuthorizationError("Only the poster can edit this internship")
        if data.title is not None:
            internship.title = sanitize_string(data.title)
        if data.description is not None:
            internship.description = sanitize_string(data.description)
        if data.department is not None:
            internship.department = data.department
        if data.location is not None:
            internship.location = data.location
        if data.work_mode is not None:
            internship.work_mode = _safe_enum(data.work_mode, WorkMode, internship.work_mode)
        if data.internship_type is not None:
            internship.internship_type = _safe_enum(data.internship_type, InternshipType, internship.internship_type)
        if data.duration_weeks is not None:
            internship.duration = data.duration_weeks
        if data.stipend is not None:
            internship.stipend = Stipend(
                minimum_stipend=data.stipend,
                maximum_stipend=internship.stipend.maximum_stipend if internship.stipend else 0,
                currency=internship.stipend.currency if internship.stipend else "INR",
            )
        if data.skills_required is not None:
            internship.skills = data.skills_required
        if data.eligibility is not None:
            internship.eligibility = data.eligibility
        if data.max_participants is not None:
            internship.vacancies = data.max_participants
        if data.status is not None:
            internship.status = _safe_enum(data.status, InternshipStatus, internship.status)
        if data.start_date is not None:
            internship.start_date = data.start_date
        if data.end_date is not None:
            internship.end_date = data.end_date
        if data.application_deadline is not None:
            internship.deadline = data.application_deadline
        internship.updated_at = datetime.now(timezone.utc)
        await internship.save()
        return {"message": "Internship updated successfully"}

    @staticmethod
    async def delete_internship(internship_id: str, poster_id: str) -> dict[str, str]:
        internship = await InternshipRepository.find_by_id(internship_id)
        if not internship:
            raise NotFoundError("Internship not found")
        if internship.mentor_id != poster_id:
            raise AuthorizationError("Only the poster can delete this internship")
        internship.is_deleted = True
        internship.updated_at = datetime.now(timezone.utc)
        await internship.save()
        return {"message": "Internship deleted successfully"}

    @staticmethod
    async def apply_to_internship(internship_id: str, applicant_id: str, data: InternshipApplicationRequest) -> dict[str, Any]:
        internship = await InternshipRepository.find_by_id(internship_id)
        if not internship:
            raise NotFoundError("Internship not found")
        if internship.status != InternshipStatus.PUBLISHED:
            raise AuthorizationError("This internship is no longer accepting applications")
        existing = await InternshipRepository.find_application(internship_id, applicant_id)
        if existing:
            raise ConflictError("You have already applied to this internship")
        application_id = secrets.token_hex(16)
        application = InternshipApplication(
            application_id=application_id,
            internship_id=internship_id,
            applicant_id=applicant_id,
            cover_letter=data.cover_letter,
            resume_url=data.resume_url,
            applied_at=datetime.now(timezone.utc),
        )
        await application.insert()
        internship.application_count += 1
        await internship.save()

        applicant_name = await _applicant_name(applicant_id)
        for recipient in await resolve_posting_recipients(internship.mentor_id, internship.organization_id, applicant_id):
            await notify_internship_application_received(
                recipient, internship.internship_id, internship.title, applicant_id, applicant_name
            )

        return {"application_id": application_id, "message": "Application submitted successfully"}

    @staticmethod
    async def _sync_application_count(internship: Internship) -> int:
        actual = await InternshipApplication.find(
            InternshipApplication.internship_id == internship.internship_id,
            InternshipApplication.is_deleted == False,
            InternshipApplication.status != ApplicationStatus.WITHDRAWN,
        ).count()
        if internship.application_count != actual:
            internship.application_count = actual
            await internship.save()
        return actual

    @staticmethod
    async def get_internship_applications(internship_id: str, poster_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        internship = await InternshipRepository.find_by_id(internship_id)
        if not internship:
            raise NotFoundError("Internship not found")
        if internship.mentor_id != poster_id:
            raise AuthorizationError("Only the poster can view applications")
        skip = (page - 1) * per_page
        applications = await InternshipRepository.get_applications(internship_id, skip, per_page)
        total = await InternshipService._sync_application_count(internship)
        rows = await enrich([InternshipService._application_dict(a) for a in applications])
        for row in rows:
            row["internship"] = {"internship_id": internship.internship_id, "title": internship.title}
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    def _application_dict(a) -> dict[str, Any]:
        return {
            "application_id": a.application_id,
            "internship_id": a.internship_id,
            "applicant_id": a.applicant_id,
            "cover_letter": a.cover_letter,
            "resume_url": a.resume_url,
            "status": a.status,
            "answers": a.answers,
            "reviewed_by": a.reviewed_by,
            "reviewed_at": a.reviewed_at,
            "applied_at": a.applied_at,
            "created_at": a.created_at,
        }

    @staticmethod
    async def get_posted_applications(poster_id: str, page: int = 1, per_page: int = 20, status: str | None = None) -> dict[str, Any]:
        """Every application across all internships the poster owns."""
        internships = await InternshipRepository.find_by_poster(poster_id, 0, 10**6)
        intern_map = {i.internship_id: i for i in internships}
        if not intern_map:
            return paginate_response([], 0, page, per_page, "created_at")

        query = [In(InternshipApplication.internship_id, list(intern_map)), InternshipApplication.is_deleted == False]
        if status:
            query.append(InternshipApplication.status == status)

        total = await InternshipApplication.find(*query).count()
        apps = await InternshipApplication.find(*query).sort("-created_at").skip((page - 1) * per_page).limit(per_page).to_list()
        rows = await enrich([InternshipService._application_dict(a) for a in apps])
        for row in rows:
            it = intern_map.get(row["internship_id"])
            row["internship"] = {"internship_id": it.internship_id, "title": it.title} if it else None
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def update_application_status(application_id: str, poster_id: str, new_status: str) -> dict[str, str]:
        application = await InternshipApplication.find_one(InternshipApplication.application_id == application_id)
        if not application:
            raise NotFoundError("Application not found")
        internship = await InternshipRepository.find_by_id(application.internship_id)
        if not internship or internship.mentor_id != poster_id:
            raise AuthorizationError("Only the poster can update application status")
        application.status = new_status
        application.reviewed_by = poster_id
        application.reviewed_at = datetime.now(timezone.utc)
        await application.save()
        await notify_internship_application_update(application.applicant_id, application.internship_id, new_status)
        return {"message": f"Application status updated to {new_status}"}

    @staticmethod
    async def get_user_applications(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        """The applicant's own internship applications, with internship details."""
        applications = await InternshipRepository.get_user_applications(user_id, 0, 10**6)
        ids = list(dict.fromkeys(a.internship_id for a in applications))
        intern_map = (
            {i.internship_id: i for i in await Internship.find(In(Internship.internship_id, ids)).to_list()}
            if ids else {}
        )

        org_ids = list(dict.fromkeys(i.organization_id for i in intern_map.values() if i.organization_id))
        orgs = {}
        if org_ids:
            from app.models.organization import Organization
            orgs = {
                o.organization_id: o
                for o in await Organization.find(In(Organization.organization_id, org_ids)).to_list()
            }

        total = len(applications)
        rows = []
        for a in applications[(page - 1) * per_page: page * per_page]:
            it = intern_map.get(a.internship_id)
            org = orgs.get(it.organization_id) if it else None
            rows.append({
                **InternshipService._application_dict(a),
                "applicant_id": a.applicant_id,
                "updated_at": a.updated_at,
                "internship": {
                    "internship_id": it.internship_id,
                    "_id": it.internship_id,
                    "title": it.title,
                    "location": it.location,
                    "internship_type": it.internship_type,
                    "status": it.status,
                    "application_count": it.application_count,
                    "organization": {
                        "organization_id": org.organization_id,
                        "name": org.organization_name,
                        "logo": org.logo,
                    } if org else None,
                } if it else None,
            })
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def get_user_posted_internships(poster_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        internships = await InternshipRepository.find_by_poster(poster_id, skip, per_page)
        total = await InternshipRepository.count_by_poster(poster_id)
        return paginate_response(internships, total, page, per_page, "created_at")

    @staticmethod
    async def _to_dict(internship: Internship) -> dict[str, Any]:
        from app.services.search_service import _internship_dict
        return _internship_dict(internship, None)
