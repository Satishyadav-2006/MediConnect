import logging
import secrets
from datetime import datetime, timezone
from typing import Any

from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import (
    NotFoundError,
    AuthorizationError,
    ConflictError,
    ValidationAppError,
)
from app.schemas.organization import (
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
    EmployeeAddRequest,
    DepartmentRequest,
)
from app.models.organization import Organization, OrganizationAddress
from app.models.organization_members import (
    OrganizationMember,
    Department,
    OrganizationVerification,
    OrganizationRole,
)
from app.models.connection import Follow
from app.models.organization_gallery import OrganizationGalleryItem
from app.storage.cloudinary_service import CloudinaryService
from app.utils.pagination import paginate_response

logger = logging.getLogger(__name__)

_MEMBER_ROLE_ALIASES = {
    "admin": "org_admin",
    "org_admin": "org_admin",
    "hr": "hr",
    "recruiter": "recruiter",
    "faculty": "faculty",
    "department_head": "faculty",
    "head": "faculty",
    "staff": "employee",
    "employee": "employee",
    "volunteer": "employee",
    "doctor": "healthcare_professional",
    "nurse": "healthcare_professional",
    "physiotherapist": "healthcare_professional",
    "student": "healthcare_student",
}


def _coerce_member_role(raw: str | None):
    key = (raw or "employee").strip().lower()
    value = _MEMBER_ROLE_ALIASES.get(key, "employee")
    try:
        return OrganizationRole(value)
    except ValueError:
        return OrganizationRole.EMPLOYEE


class OrganizationService:

    @staticmethod
    async def _live_counts(org: Organization) -> tuple[int, int, int]:
        employee_count = await OrganizationMember.find(
            OrganizationMember.organization_id == org.organization_id
        ).count()
        followers_count = await Follow.find(
            Follow.following_id == org.organization_id,
            Follow.following_type == "organization",
        ).count()
        department_count = await Department.find(
            Department.organization_id == org.organization_id
        ).count()
        if (
            org.employee_count != employee_count
            or org.followers_count != followers_count
            or org.department_count != department_count
        ):
            org.employee_count = employee_count
            org.followers_count = followers_count
            org.department_count = department_count
            await org.save()
        return employee_count, followers_count, department_count

    @staticmethod
    async def create(owner_id: str, data: OrganizationCreateRequest) -> dict[str, Any]:
        org_id = secrets.token_hex(16)
        org = Organization(
            organization_id=org_id,
            owner_id=owner_id,
            organization_name=data.name.strip(),
            organization_type=data.organization_type,
            registration_number=data.registration_number or "",
            description=data.description or "",
            website=data.website or "",
            email=data.email or "",
            phone=data.phone or "",
            country=data.country.strip(),
            state=data.state.strip(),
            city=data.city.strip(),
            address=OrganizationAddress(address_line_1=data.address or ""),
        )
        org = await OrganizationRepository.create(org)
        org_verification = OrganizationVerification(
            organization_id=org.organization_id,
            submitted_by=owner_id,
            verification_type="registration",
            status="pending",
        )
        await org_verification.insert()
        return {
            "organization_id": org.organization_id,
            "name": org.organization_name,
            "message": "Organization created successfully",
        }

    @staticmethod
    async def get_organization(org_id: str) -> dict[str, Any]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        verification_status = org.verification_status.value if hasattr(org.verification_status, 'value') else org.verification_status
        employee_count, followers_count, department_count = await OrganizationService._live_counts(org)
        return {
            "_id": org.organization_id,
            "name": org.organization_name,
            "slug": org.organization_id,
            "type": org.organization_type or "other",
            "owner": org.owner_id,
            "owner_id": org.owner_id,
            "logo": org.logo,
            "coverPhoto": org.banner,
            "description": org.description,
            "website": org.website,
            "email": org.email,
            "phone": org.phone,
            "location": f"{org.city}, {org.country}".strip(", "),
            "country": org.country,
            "state": org.state,
            "city": org.city,
            "employeesCount": employee_count,
            "followersCount": followers_count,
            "isVerified": verification_status == "approved",
            "foundedYear": org.founded_year,
            "specializations": [],
            "createdAt": org.created_at.isoformat() if org.created_at else None,
            "organization_id": org.organization_id,
            "organization_type": org.organization_type or "other",
            "registration_number": org.registration_number,
            "banner": org.banner,
            "address": org.address.address_line_1 if org.address else "",
            "verification_status": verification_status,
            "employee_count": employee_count,
            "followers_count": followers_count,
            "department_count": department_count,
            "organization_status": org.organization_status,
            "created_at": org.created_at,
        }

    @staticmethod
    async def update_organization(org_id: str, owner_id: str, data: OrganizationUpdateRequest) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != owner_id:
            raise AuthorizationError("Only the owner can update this organization")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "name":
                org.organization_name = value
            elif hasattr(org, key) and value is not None:
                setattr(org, key, value)

        await OrganizationRepository.update(org)
        return {"message": "Organization updated successfully"}

    @staticmethod
    async def list_organizations(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        orgs, total = await OrganizationRepository.search(page=page, per_page=per_page)
        return paginate_response(orgs, total, page, per_page, "created_at")

    @staticmethod
    async def search_organizations(query: str | None, org_type: str | None, country: str | None, city: str | None, page: int, per_page: int) -> dict[str, Any]:
        orgs, total = await OrganizationRepository.search(query, org_type, country, city, page, per_page)
        return paginate_response(orgs, total, page, per_page, "created_at")

    @staticmethod
    async def list_employees(org_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        members = await OrganizationMember.find(
            OrganizationMember.organization_id == org.organization_id
        ).skip((page - 1) * per_page).limit(per_page).to_list()
        total = await OrganizationMember.find(
            OrganizationMember.organization_id == org.organization_id
        ).count()
        items = []
        for m in members:
            user = await UserRepository.find_by_user_id(m.user_id)
            items.append({
                "user_id": m.user_id,
                "full_name": (
                    f"{user.first_name} {user.last_name}".strip()
                    if user else m.user_id
                ),
                "profile_photo": user.profile_photo if user else "",
                "role": m.organization_role.value if hasattr(m.organization_role, "value") else str(m.organization_role),
                "designation": m.designation,
                "department": m.department,
                "status": m.status,
                "joined_at": m.joined_at,
            })
        return paginate_response(items, total, page, per_page)

    @staticmethod
    async def list_departments(org_id: str) -> dict[str, Any]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        depts = await Department.find(
            Department.organization_id == org.organization_id
        ).sort("department_name").to_list()
        return {
            "departments": [
                {
                    "id": str(d.id),
                    "name": d.department_name,
                    "head": d.head_of_department,
                    "description": d.description,
                }
                for d in depts
            ],
            "total": len(depts),
        }

    @staticmethod
    async def delete_department(org_id: str, owner_id: str, department_id: str) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != owner_id:
            raise AuthorizationError("Only the owner can manage departments")

        dept = None
        try:
            dept = await Department.get(department_id)
        except Exception:
            dept = None
        if not dept or dept.organization_id != org.organization_id:
            raise NotFoundError("Department not found")

        await dept.delete()
        await OrganizationService._live_counts(org)
        return {"message": f"Department '{dept.department_name}' removed"}

    @staticmethod
    async def list_followers(org_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        query = Follow.find(
            Follow.following_id == org.organization_id,
            Follow.following_type == "organization",
        )
        total = await query.count()
        follows = await query.skip((page - 1) * per_page).limit(per_page).to_list()
        items = []
        for f in follows:
            user = await UserRepository.find_by_user_id(f.follower_id)
            if not user:
                continue
            items.append({
                "user_id": user.user_id,
                "full_name": f"{user.first_name} {user.last_name}".strip(),
                "role": user.role,
                "profile_photo": user.profile_photo,
                "followed_at": f.created_at,
            })
        return paginate_response(items, total, page, per_page)

    @staticmethod
    async def list_gallery(
        org_id: str, page: int = 1, per_page: int = 20, media_type: str | None = None
    ) -> dict[str, Any]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")

        filters: dict[str, Any] = {
            "organization_id": org.organization_id,
            "status": "active",
        }
        if media_type and media_type != "all":
            filters["media_type"] = media_type

        total = await OrganizationGalleryItem.find(filters).count()
        items = (
            await OrganizationGalleryItem.find(filters)
            .sort("-created_at")
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return paginate_response(
            [
                {
                    "_id": str(it.id),
                    "id": it.gallery_item_id,
                    "url": it.url,
                    "type": it.media_type,
                    "category": it.media_type,
                    "caption": it.caption,
                    "file_name": it.file_name,
                    "uploaded_by": it.uploaded_by,
                    "created_at": it.created_at,
                }
                for it in items
            ],
            total,
            page,
            per_page,
            "_id",
        )

    @staticmethod
    async def add_gallery_item(
        org_id: str, user_id: str, file, media_type: str, caption: str = ""
    ) -> dict[str, Any]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != user_id:
            raise AuthorizationError("Only the owner can upload to the gallery")

        media_type = (media_type or "image").strip().lower()
        if media_type not in {"image", "video", "certificate", "document"}:
            raise ValidationAppError("Unsupported gallery type")

        content_type = file.content_type or ""
        if media_type == "image":
            if not content_type.startswith("image/"):
                raise ValidationAppError("Gallery image must be an image file")
            url = await CloudinaryService.upload_image(
                file, folder=f"organizations/{org.organization_id}/gallery"
            )
        elif media_type == "video":
            if not content_type.startswith("video/"):
                raise ValidationAppError("Gallery video must be a video file")
            url = await CloudinaryService.upload_video(
                file, folder=f"organizations/{org.organization_id}/gallery"
            )
        elif media_type == "certificate":
            if not (
                content_type.startswith("image/")
                or content_type in {"application/pdf"}
            ):
                raise ValidationAppError("Certificate must be an image or PDF")
            url = await CloudinaryService.upload_image(
                file, folder=f"organizations/{org.organization_id}/gallery/certificates"
            )
        else:
            url = await CloudinaryService.upload_document(
                file, folder=f"organizations/{org.organization_id}/gallery/documents"
            )

        item = OrganizationGalleryItem(
            gallery_item_id=secrets.token_hex(16),
            organization_id=org.organization_id,
            uploaded_by=user_id,
            url=url,
            media_type=media_type,
            caption=caption.strip(),
            file_name=getattr(file, "filename", "") or "",
            content_type=content_type,
        )
        await item.insert()
        return {
            "_id": str(item.id),
            "id": item.gallery_item_id,
            "url": item.url,
            "type": item.media_type,
            "category": item.media_type,
            "caption": item.caption,
        }

    @staticmethod
    async def delete_gallery_item(org_id: str, user_id: str, item_id: str) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != user_id:
            raise AuthorizationError("Only the owner can delete gallery items")

        item = await OrganizationGalleryItem.find_one(
            OrganizationGalleryItem.organization_id == org.organization_id,
            OrganizationGalleryItem.gallery_item_id == item_id,
        )
        if not item:
            try:
                candidate = await OrganizationGalleryItem.get(item_id)
            except Exception:
                candidate = None
            if candidate and candidate.organization_id == org.organization_id:
                item = candidate
        if not item:
            raise NotFoundError("Gallery item not found")

        await item.delete()
        return {"message": "Gallery item removed"}

    @staticmethod
    async def add_employee(org_id: str, owner_id: str, data: EmployeeAddRequest) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != owner_id:
            raise AuthorizationError("Only the owner can manage employees")

        user = await UserRepository.find_by_user_id(data.user_id)
        if not user:
            raise NotFoundError("User not found")

        existing = await OrganizationMember.find_one(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == data.user_id,
        )
        if existing:
            raise ConflictError("User is already a member of this organization")

        role = _coerce_member_role(data.role)
        member = OrganizationMember(
            organization_id=org.organization_id,
            user_id=data.user_id,
            organization_role=role,
            designation=data.designation or "",
            department=data.department or "",
        )
        await member.insert()

        # Reflect the employment on the user record so it shows on their profile.
        user.organization_id = org.organization_id
        user.designation = data.designation or user.designation
        user.department = data.department or user.department
        await user.save()

        org.employee_count += 1
        await OrganizationRepository.update(org)

        target = f" in {data.department}" if data.department else ""
        return {"message": f"Employee added{target}"}

    @staticmethod
    async def remove_employee(org_id: str, owner_id: str, employee_user_id: str) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != owner_id:
            raise AuthorizationError("Only the owner can manage employees")

        member = await OrganizationMember.find_one(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == employee_user_id,
        )
        if member:
            await member.delete()

        # Clear the employment from the user profile so it stops showing.
        user = await UserRepository.find_by_user_id(employee_user_id)
        if user and user.organization_id == org.organization_id:
            user.organization_id = None
            user.designation = ""
            user.department = ""
            await user.save()

        await OrganizationRepository.remove_employee(org, employee_user_id)
        return {"message": "Employee removed successfully"}

    @staticmethod
    async def add_department(org_id: str, owner_id: str, data: DepartmentRequest) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != owner_id:
            raise AuthorizationError("Only the owner can manage departments")

        existing = await Department.find_one(
            Department.organization_id == org_id,
            {"department_name": {"$regex": f"^{data.name.strip()}$", "$options": "i"}},
        )
        if existing:
            raise ConflictError("Department already exists")

        dept = Department(
            organization_id=org_id,
            department_name=data.name,
            head_of_department=data.head or "",
        )
        await dept.insert()

        org.department_count += 1
        await OrganizationRepository.update(org)
        return {"message": f"Department '{data.name}' added"}

    @staticmethod
    async def follow_organization(org_id: str, user_id: str) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id == user_id:
            raise ValidationAppError("You cannot follow your own organization")

        existing = await Follow.find_one(
            Follow.follower_id == user_id,
            Follow.following_id == org.organization_id,
            Follow.following_type == "organization",
        )
        if not existing:
            await Follow(
                follower_id=user_id,
                following_id=org.organization_id,
                following_type="organization",
            ).insert()

        await OrganizationService._live_counts(org)
        return {"message": "Now following organization"}

    @staticmethod
    async def unfollow_organization(org_id: str, user_id: str) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")

        follow = await Follow.find_one(
            Follow.follower_id == user_id,
            Follow.following_id == org.organization_id,
            Follow.following_type == "organization",
        )
        if not follow:
            raise NotFoundError("You are not following this organization")
        await follow.delete()

        await OrganizationService._live_counts(org)
        return {"message": "Unfollowed organization"}

    @staticmethod
    async def is_following(org_id: str, user_id: str) -> bool:
        follow = await Follow.find_one(
            Follow.follower_id == user_id,
            Follow.following_id == org_id,
            Follow.following_type == "organization",
        )
        return follow is not None

    @staticmethod
    async def delete_organization(org_id: str, owner_id: str) -> dict[str, str]:
        org = await OrganizationRepository.find_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        if org.owner_id != owner_id:
            raise AuthorizationError("Only the owner can delete this organization")
        org.organization_status = "inactive"
        org.updated_at = datetime.now(timezone.utc)
        await OrganizationRepository.update(org)
        return {"message": "Organization deleted"}
