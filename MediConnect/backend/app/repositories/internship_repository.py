from typing import Any
from app.models.internship import Internship, InternshipApplication
from app.models.base import InternshipStatus


class InternshipRepository:

    @staticmethod
    async def find_by_id(internship_id: str) -> Internship | None:
        return await Internship.find_one(
            Internship.internship_id == internship_id, Internship.is_deleted == False
        )

    @staticmethod
    async def find_active(skip: int = 0, limit: int = 20) -> list[Internship]:
        return await Internship.find(
            Internship.status == InternshipStatus.PUBLISHED, Internship.is_deleted == False
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_active() -> int:
        return await Internship.find(Internship.status == InternshipStatus.PUBLISHED, Internship.is_deleted == False).count()

    @staticmethod
    async def find_by_poster(poster_id: str, skip: int = 0, limit: int = 20) -> list[Internship]:
        return await Internship.find(
            Internship.mentor_id == poster_id, Internship.is_deleted == False
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_by_poster(poster_id: str) -> int:
        return await Internship.find(Internship.mentor_id == poster_id, Internship.is_deleted == False).count()

    @staticmethod
    async def find_application(internship_id: str, applicant_id: str) -> InternshipApplication | None:
        return await InternshipApplication.find_one(
            InternshipApplication.internship_id == internship_id,
            InternshipApplication.applicant_id == applicant_id,
        )

    @staticmethod
    async def get_applications(internship_id: str, skip: int = 0, limit: int = 20) -> list[InternshipApplication]:
        return await InternshipApplication.find(
            InternshipApplication.internship_id == internship_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def count_applications(internship_id: str) -> int:
        return await InternshipApplication.find(InternshipApplication.internship_id == internship_id).count()

    @staticmethod
    async def get_user_applications(user_id: str, skip: int = 0, limit: int = 20) -> list[InternshipApplication]:
        return await InternshipApplication.find(
            InternshipApplication.applicant_id == user_id
        ).sort("-created_at").skip(skip).limit(limit).to_list()
