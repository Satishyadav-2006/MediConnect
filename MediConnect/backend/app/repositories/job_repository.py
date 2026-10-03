from typing import Any
from beanie.odm.operators.find.comparison import In
from app.models.job import Job, JobApplication
from app.models.base import JobStatus


class JobRepository:

    @staticmethod
    async def find_by_job_id(job_id: str) -> Job | None:
        return await Job.find_one(Job.job_id == job_id, Job.is_deleted == False)

    @staticmethod
    async def find_active_jobs(skip: int = 0, limit: int = 20) -> list[Job]:
        return await Job.find(
            Job.status == JobStatus.PUBLISHED, Job.is_deleted == False
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_active() -> int:
        return await Job.find(Job.status == JobStatus.PUBLISHED, Job.is_deleted == False).count()

    @staticmethod
    async def find_by_poster(poster_id: str, skip: int = 0, limit: int = 20) -> list[Job]:
        return await Job.find(
            Job.recruiter_id == poster_id, Job.is_deleted == False
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_by_poster(poster_id: str) -> int:
        return await Job.find(Job.recruiter_id == poster_id, Job.is_deleted == False).count()

    @staticmethod
    async def find_application(job_id: str, applicant_id: str) -> JobApplication | None:
        return await JobApplication.find_one(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id == applicant_id,
        )

    @staticmethod
    async def get_applications(job_id: str, skip: int = 0, limit: int = 20) -> list[JobApplication]:
        return await JobApplication.find(
            JobApplication.job_id == job_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_applications(job_id: str) -> int:
        return await JobApplication.find(JobApplication.job_id == job_id).count()

    @staticmethod
    async def get_user_applications(user_id: str, skip: int = 0, limit: int = 20) -> list[JobApplication]:
        return await JobApplication.find(
            JobApplication.applicant_id == user_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_user_applications(user_id: str) -> int:
        return await JobApplication.find(JobApplication.applicant_id == user_id).count()

    @staticmethod
    async def search_jobs(query: str, skip: int = 0, limit: int = 20) -> list[Job]:
        return await Job.find(
            In(Job.search_keywords, [query.lower()]),
            Job.is_deleted == False,
            Job.status == JobStatus.PUBLISHED,
        ).skip(skip).limit(limit).to_list()
