import logging
from datetime import datetime, timezone
from typing import Any

from app.models.organization import Organization
from app.models.organization_members import OrganizationMember

logger = logging.getLogger(__name__)


class OrganizationRepository:

    @staticmethod
    async def find_by_id(org_id: str) -> Organization | None:
        if not org_id:
            return None
        org = await Organization.find_one(Organization.organization_id == org_id)
        if org:
            return org
        try:
            return await Organization.get(org_id)
        except Exception:
            return None

    @staticmethod
    async def find_by_owner(owner_id: str) -> list[Organization]:
        return await Organization.find(Organization.owner_id == owner_id).to_list()

    @staticmethod
    async def create(org: Organization) -> Organization:
        await org.insert()
        logger.info("Organization created: %s (%s)", org.organization_name, org.organization_id)
        return org

    @staticmethod
    async def update(org: Organization) -> Organization:
        org.updated_at = datetime.now(timezone.utc)
        await org.save()
        return org

    @staticmethod
    async def search(
        query: str | None = None,
        org_type: str | None = None,
        country: str | None = None,
        city: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Organization], int]:
        filters: dict[str, Any] = {"organization_status": "active"}

        if org_type:
            filters["organization_type"] = org_type
        if country:
            filters["country"] = country.lower().strip()
        if city:
            filters["city"] = city.lower().strip()

        if query:
            query_lower = query.lower().strip()
            filters["$or"] = [
                {"organization_name": {"$regex": query_lower, "$options": "i"}},
                {"description": {"$regex": query_lower, "$options": "i"}},
                {"search_keywords": {"$in": [query_lower]}},
            ]

        total = await Organization.find(filters).count()
        skip = (page - 1) * per_page
        orgs = await Organization.find(filters).skip(skip).limit(per_page).sort("-created_at").to_list()

        return orgs, total

    @staticmethod
    async def count_all() -> int:
        return await Organization.find({"organization_status": "active"}).count()

    @staticmethod
    async def add_employee(org: Organization, member: OrganizationMember) -> None:
        org.employee_count += 1
        await org.save()

    @staticmethod
    async def remove_employee(org: Organization, user_id: str) -> None:
        org.employee_count = max(0, org.employee_count - 1)
        await org.save()
