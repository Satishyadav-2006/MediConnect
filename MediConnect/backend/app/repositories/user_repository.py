import logging
from datetime import datetime, timezone
from typing import Any

from app.models.user import User

logger = logging.getLogger(__name__)


class UserRepository:

    @staticmethod
    async def find_by_user_id(user_id: str) -> User | None:
        return await User.find_one(User.user_id == user_id)

    @staticmethod
    async def find_by_email(email: str) -> User | None:
        return await User.find_one(User.email == email.lower().strip())

    @staticmethod
    async def find_by_username(username: str) -> User | None:
        return await User.find_one(User.username == username.lower().strip())

    @staticmethod
    async def update_user(user: User) -> User:
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        return user

    @staticmethod
    async def search_users(
        query: str | None = None,
        role: str | None = None,
        country: str | None = None,
        city: str | None = None,
        specialization: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[User], int]:
        filters: dict[str, Any] = {"account_status": {"$ne": "deleted"}}

        if role:
            filters["role"] = role
        if country:
            filters["country"] = country.lower().strip()
        if city:
            filters["city"] = city.lower().strip()
        if specialization:
            filters["specialization"] = {"$regex": specialization, "$options": "i"}

        if query:
            query_lower = query.lower().strip()
            filters["$or"] = [
                {"first_name": {"$regex": query_lower, "$options": "i"}},
                {"last_name": {"$regex": query_lower, "$options": "i"}},
                {"username": {"$regex": query_lower, "$options": "i"}},
                {"headline": {"$regex": query_lower, "$options": "i"}},
                {"specialization": {"$regex": query_lower, "$options": "i"}},
                {"search_keywords": {"$in": [query_lower]}},
            ]

        total = await User.find(filters).count()
        skip = (page - 1) * per_page
        users = await User.find(filters).skip(skip).limit(per_page).sort("-created_at").to_list()

        return users, total

    @staticmethod
    async def count_all() -> int:
        return await User.find({"account_status": {"$ne": "deleted"}}).count()

    @staticmethod
    async def count_verified() -> int:
        return await User.find({"email_verified": True, "account_status": "verified"}).count()

    @staticmethod
    async def count_by_role(role: str) -> int:
        return await User.find({"role": role, "account_status": {"$ne": "deleted"}}).count()

    @staticmethod
    async def update_profile_completion(user: User) -> int:
        score = 0
        checks = [
            bool(user.profile_photo),
            bool(user.bio),
            bool(user.headline),
            bool(user.country),
            bool(user.specialization),
            bool(user.experience_years and user.experience_years > 0),
            bool(user.education),
            bool(user.skills),
            bool(user.certifications),
            bool(user.social_links.linkedin or user.social_links.website),
            user.email_verified,
            user.verification_status.value == "approved" if hasattr(user.verification_status, 'value') else user.verification_status == "approved",
        ]
        score = sum(1 for c in checks if c)
        user.profile_completion = round((score / len(checks)) * 100)
        return user.profile_completion
