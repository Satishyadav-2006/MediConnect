import logging
import secrets
from datetime import datetime, timezone
from beanie.odm.operators.find.comparison import In
from typing import Any
from app.models.job import Job, JobApplication, SalaryRange
from app.models.organization import Organization
from app.repositories.job_repository import JobRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.job import JobCreateRequest, JobUpdateRequest, JobApplicationRequest
from app.models.base import JobStatus, JobType, ExperienceLevel, WorkMode, ApplicationStatus, JobVisibility
from app.utils.validators import sanitize_string
from app.services.applicant_helper import enrich
from app.services.notification_helper import (
    notify_job_posted,
    notify_application_update,
    notify_application_received,
    resolve_posting_recipients,
    _applicant_name,
)
from app.utils.pagination import paginate_response
from app.core.cache import cache_get, cache_set, cache_delete, cache_delete_pattern

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


class JobService:

    @staticmethod
    async def create_job(poster_id: str, data: JobCreateRequest) -> dict[str, Any]:
        job_id = secrets.token_hex(16)
        org_id = await _resolve_organization_id(poster_id, data.organization_id)
        salary = {k: data.salary_range.get(k) for k in ("minimum_salary", "maximum_salary", "currency") if data.salary_range.get(k) is not None}
        job = Job(
            job_id=job_id,
            recruiter_id=poster_id,
            organization_id=org_id,
            title=sanitize_string(data.title),
            description=sanitize_string(data.description),
            responsibilities=data.responsibilities,
            requirements=data.requirements,
            education=data.education,
            department=data.department,
            specialization_required=data.specialization_required,
            location=data.location,
            work_mode=_safe_enum(data.work_mode, WorkMode, WorkMode.ONSITE),
            job_type=_safe_enum(data.job_type, JobType, JobType.FULL_TIME),
            experience_level=_safe_enum(data.experience_level, ExperienceLevel, ExperienceLevel.MID),
            qualification_required=data.qualification_required,
            skills=data.skills_required,
            benefits=data.benefits,
            salary=SalaryRange(**salary) if salary else SalaryRange(),
            vacancies=data.vacancies,
            deadline=data.application_deadline,
            is_urgent=data.is_urgent,
            visibility=_safe_enum(data.visibility, JobVisibility, JobVisibility.PUBLIC),
            status=JobStatus.PUBLISHED,
            search_keywords=[data.title.lower(), data.department.lower(), data.location.lower()],
        )
        await job.insert()
        await notify_job_posted(job.job_id, job.title)
        await cache_delete_pattern("jobs:list:*")
        return {"job_id": job.job_id, "message": "Job posted successfully"}

    @staticmethod
    async def get_jobs(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        cache_key = f"jobs:list:{page}:{per_page}"
        cached = await cache_get(cache_key)
        if cached:
            return cached
        skip = (page - 1) * per_page
        jobs = await JobRepository.find_active_jobs(skip, per_page)
        total = await JobRepository.count_active()
        result = paginate_response([await JobService._to_dict(j) for j in jobs], total, page, per_page, "created_at")
        await cache_set(cache_key, result, ttl=120)
        return result

    @staticmethod
    async def get_organization_jobs(org_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from app.services.search_service import _job_dict
        skip = (page - 1) * per_page
        jobs = await Job.find(Job.organization_id == org_id, Job.is_deleted == False).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Job.find(Job.organization_id == org_id, Job.is_deleted == False).count()
        org = await Organization.find_one(Organization.organization_id == org_id, Organization.is_deleted == False)
        items = [_job_dict(j, org) for j in jobs]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_recommended(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        cache_key = f"jobs:recommended:{page}:{per_page}"
        cached = await cache_get(cache_key)
        if cached:
            return cached
        skip = (page - 1) * per_page
        jobs = await Job.find(
            Job.is_deleted == False,
            Job.status == JobStatus.PUBLISHED,
        ).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Job.find(
            Job.is_deleted == False,
            Job.status == JobStatus.PUBLISHED,
        ).count()
        result = paginate_response([await JobService._to_dict(j) for j in jobs], total, page, per_page, "created_at")
        await cache_set(cache_key, result, ttl=120)
        return result

    @staticmethod
    async def get_job(job_id: str) -> dict[str, Any]:
        cache_key = f"job:{job_id}"
        cached = await cache_get(cache_key)
        if cached:
            return cached
        job = await JobRepository.find_by_job_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        job._removed_views = getattr(job, '_removed_views', 0) + 1
        await job.save()
        result = await JobService._to_dict(job)
        await cache_set(cache_key, result, ttl=300)
        return result

    @staticmethod
    async def update_job(job_id: str, poster_id: str, data: JobUpdateRequest) -> dict[str, str]:
        job = await JobRepository.find_by_job_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        if job.recruiter_id != poster_id:
            raise AuthorizationError("Only the poster can edit this job")
        if data.title is not None:
            job.title = sanitize_string(data.title)
        if data.description is not None:
            job.description = sanitize_string(data.description)
        if data.department is not None:
            job.department = data.department
        if data.location is not None:
            job.location = data.location
        if data.work_mode is not None:
            job.work_mode = _safe_enum(data.work_mode, WorkMode, job.work_mode)
        if data.job_type is not None:
            job.job_type = _safe_enum(data.job_type, JobType, job.job_type)
        if data.experience_level is not None:
            job.experience_level = _safe_enum(data.experience_level, ExperienceLevel, job.experience_level)
        if data.skills_required is not None:
            job.skills = data.skills_required
        if data.salary_range is not None:
            salary = {k: data.salary_range.get(k) for k in ("minimum_salary", "maximum_salary", "currency") if data.salary_range.get(k) is not None}
            job.salary = SalaryRange(**salary) if salary else SalaryRange()
        if data.vacancies is not None:
            job.vacancies = data.vacancies
        if data.status is not None:
            job.status = _safe_enum(data.status, JobStatus, job.status)
        if data.visibility is not None:
            job.visibility = _safe_enum(data.visibility, JobVisibility, job.visibility)
        if data.application_deadline is not None:
            job.deadline = data.application_deadline
        if data.is_urgent is not None:
            job.is_urgent = data.is_urgent
        if data.responsibilities is not None:
            job.responsibilities = data.responsibilities
        if data.requirements is not None:
            job.requirements = data.requirements
        if data.education is not None:
            job.education = data.education
        job.updated_at = datetime.now(timezone.utc)
        await job.save()
        await cache_delete(f"job:{job_id}")
        await cache_delete_pattern("jobs:list:*")
        return {"message": "Job updated successfully"}

    @staticmethod
    async def delete_job(job_id: str, poster_id: str) -> dict[str, str]:
        job = await JobRepository.find_by_job_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        if job.recruiter_id != poster_id:
            raise AuthorizationError("Only the poster can delete this job")
        job.is_deleted = True
        job.updated_at = datetime.now(timezone.utc)
        await job.save()
        await cache_delete(f"job:{job_id}")
        await cache_delete_pattern("jobs:list:*")
        return {"message": "Job deleted successfully"}

    @staticmethod
    async def apply_to_job(job_id: str, applicant_id: str, data: JobApplicationRequest) -> dict[str, Any]:
        job = await JobRepository.find_by_job_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        if job.status != JobStatus.PUBLISHED:
            raise AuthorizationError("This job is no longer accepting applications")
        existing = await JobRepository.find_application(job_id, applicant_id)
        if existing:
            raise ConflictError("You have already applied to this job")
        application_id = secrets.token_hex(16)
        application = JobApplication(
            application_id=application_id,
            job_id=job_id,
            applicant_id=applicant_id,
            cover_letter=data.cover_letter,
            resume_url=data.resume_url,
            applied_at=datetime.now(timezone.utc),
        )
        await application.insert()
        job.application_count += 1
        await job.save()

        applicant_name = await _applicant_name(applicant_id)
        for recipient in await resolve_posting_recipients(job.recruiter_id, job.organization_id, applicant_id):
            await notify_application_received(
                recipient, job.job_id, job.title, applicant_id, applicant_name
            )

        return {"application_id": application_id, "message": "Application submitted successfully"}

    @staticmethod
    async def withdraw_application(job_id: str, applicant_id: str) -> dict[str, str]:
        application = await JobRepository.find_application(job_id, applicant_id)
        if not application:
            raise NotFoundError("Application not found")
        if application.status not in (
            ApplicationStatus.APPLIED,
            ApplicationStatus.UNDER_REVIEW,
        ):
            raise ConflictError("This application can no longer be withdrawn")
        application.status = ApplicationStatus.WITHDRAWN
        await application.save()

        job = await JobRepository.find_by_job_id(job_id)
        if job:
            job.application_count = max(0, job.application_count - 1)
            await job.save()
        return {"message": "Application withdrawn"}

    @staticmethod
    async def _sync_application_count(job: Job) -> int:
        actual = await JobApplication.find(
            JobApplication.job_id == job.job_id,
            JobApplication.is_deleted == False,
            JobApplication.status != ApplicationStatus.WITHDRAWN,
        ).count()
        if job.application_count != actual:
            job.application_count = actual
            await job.save()
        return actual

    @staticmethod
    async def get_job_applications(job_id: str, poster_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        job = await JobRepository.find_by_job_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        if job.recruiter_id != poster_id:
            raise AuthorizationError("Only the poster can view applications")
        skip = (page - 1) * per_page
        applications = await JobRepository.get_applications(job_id, skip, per_page)
        total = await JobService._sync_application_count(job)
        rows = await enrich([
                {
                    "application_id": a.application_id,
                    "job_id": a.job_id,
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
                for a in applications
            ])
        for row in rows:
            row["job"] = {"job_id": job.job_id, "title": job.title}
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def get_posted_applications(poster_id: str, page: int = 1, per_page: int = 20, status: str | None = None) -> dict[str, Any]:
        """Every application across all jobs the poster owns."""
        jobs = await JobRepository.find_by_poster(poster_id, 0, 10**6)
        job_map = {j.job_id: j for j in jobs}
        if not job_map:
            return paginate_response([], 0, page, per_page, "created_at")

        query = [In(JobApplication.job_id, list(job_map)), JobApplication.is_deleted == False]
        if status:
            query.append(JobApplication.status == status)

        total = await JobApplication.find(*query).count()
        apps = await JobApplication.find(*query).sort("-created_at").skip((page - 1) * per_page).limit(per_page).to_list()
        rows = await enrich([
            {
                "application_id": a.application_id,
                "job_id": a.job_id,
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
            for a in apps
        ])
        for row in rows:
            job = job_map.get(row["job_id"])
            row["job"] = {"job_id": job.job_id, "title": job.title} if job else None
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def get_user_applications(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        """The applicant's own applications, with job details for status tracking."""
        applications = await JobRepository.get_user_applications(user_id, 0, 10**6)
        job_ids = list(dict.fromkeys(a.job_id for a in applications))
        jobs = {j.job_id: j for j in await Job.find(In(Job.job_id, job_ids)).to_list()} if job_ids else {}

        org_ids = list(dict.fromkeys(j.organization_id for j in jobs.values() if j.organization_id))
        orgs = {}
        if org_ids:
            from beanie.odm.operators.find.comparison import In as _In
            from app.models.organization import Organization
            orgs = {
                o.organization_id: o
                for o in await Organization.find(_In(Organization.organization_id, org_ids)).to_list()
            }

        total = len(applications)
        window = applications[(page - 1) * per_page: page * per_page]
        rows = []
        for a in window:
            job = jobs.get(a.job_id)
            org = orgs.get(job.organization_id) if job else None
            rows.append({
                "application_id": a.application_id,
                "job_id": a.job_id,
                "applicant_id": a.applicant_id,
                "status": a.status,
                "cover_letter": a.cover_letter,
                "resume_url": a.resume_url,
                "applied_at": a.applied_at,
                "reviewed_at": a.reviewed_at,
                "reviewed_by": a.reviewed_by,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
                "job": {
                    "job_id": job.job_id,
                    "_id": job.job_id,
                    "title": job.title,
                    "location": job.location,
                    "work_mode": job.work_mode,
                    "job_type": job.job_type,
                    "status": job.status,
                    "application_count": job.application_count,
                    "organization": {
                        "organization_id": org.organization_id,
                        "name": org.organization_name,
                        "logo": org.logo,
                    } if org else None,
                } if job else None,
            })
        return paginate_response(rows, total, page, per_page, "created_at")

    @staticmethod
    async def update_application_status(application_id: str, poster_id: str, new_status: str) -> dict[str, str]:
        application = await JobApplication.find_one(JobApplication.application_id == application_id)
        if not application:
            raise NotFoundError("Application not found")
        job = await JobRepository.find_by_job_id(application.job_id)
        if not job or job.recruiter_id != poster_id:
            raise AuthorizationError("Only the job poster can update application status")
        application.status = new_status
        application.reviewed_by = poster_id
        application.reviewed_at = datetime.now(timezone.utc)
        await application.save()
        await notify_application_update(application.applicant_id, application.job_id, new_status)
        return {"message": f"Application status updated to {new_status}"}

    @staticmethod
    async def get_user_posted_jobs(poster_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        jobs = await JobRepository.find_by_poster(poster_id, skip, per_page)
        total = await JobRepository.count_by_poster(poster_id)
        return paginate_response([await JobService._to_dict(j) for j in jobs], total, page, per_page, "created_at")

    @staticmethod
    async def bookmark_job(job_id: str, user_id: str) -> dict[str, str]:
        job = await JobRepository.find_by_job_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved = list(user.saved_jobs or [])
        if job_id not in saved:
            saved.append(job_id)
            user.saved_jobs = saved
            await user.save()
        return {"message": "Job saved"}

    @staticmethod
    async def unbookmark_job(job_id: str, user_id: str) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved = list(user.saved_jobs or [])
        if job_id in saved:
            user.saved_jobs = [j for j in saved if j != job_id]
            await user.save()
        return {"message": "Job removed from saved"}

    @staticmethod
    async def get_saved_jobs(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from beanie.odm.operators.find.comparison import In
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        saved_ids = list(user.saved_jobs or [])
        jobs = await Job.find(In(Job.job_id, saved_ids), Job.is_deleted == False).to_list() if saved_ids else []
        total = len(jobs)
        skip = (page - 1) * per_page
        page_items = jobs[skip:skip + per_page]
        return paginate_response([await JobService._to_dict(j) for j in page_items], total, page, per_page, "created_at")

    @staticmethod
    async def get_applied_jobs(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        return await JobService.get_user_applications(user_id, page, per_page)

    @staticmethod
    async def _to_dict(job: Job) -> dict[str, Any]:
        from app.services.search_service import _job_dict
        return _job_dict(job, None)
