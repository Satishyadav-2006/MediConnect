import logging
from datetime import datetime, timezone
from typing import Any

from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError
from app.schemas.user import (
    UserUpdateRequest,
    EducationUpdateRequest,
    ExperienceUpdateRequest,
    SkillUpdateRequest,
    CertificationUpdateRequest,
    LanguageUpdateRequest,
    SocialLinksUpdateRequest,
    PrivacyUpdateRequest,
    NotificationSettingsUpdateRequest,
    VerificationSubmitRequest,
)
from app.models.base import VerificationStatus
from app.utils.pagination import paginate_response
from app.models.user import (
    EducationItem, ExperienceItem, SkillItem, CertificationItem,
    LanguageItem,
)

logger = logging.getLogger(__name__)


class UserService:

    @staticmethod
    async def get_profile(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            user = await UserRepository.find_by_username(user_id)
        if not user:
            raise NotFoundError("User not found")
        from app.models.connection import Connection, Follow, ConnectionStatus
        from app.models.post import Post
        from beanie.odm.operators.find.logical import And, Or

        profile_user_id = user.user_id
        followers_count = await Follow.find(Follow.following_id == profile_user_id, Follow.following_type == "user").count()
        following_count = await Follow.find(Follow.follower_id == profile_user_id).count()
        connections_count = await Connection.find(
            And(
                Or(Connection.sender_id == profile_user_id, Connection.receiver_id == profile_user_id),
                Connection.status == ConnectionStatus.ACCEPTED,
            )
        ).count()
        posts_count = await Post.find(Post.author_id == profile_user_id, Post.is_deleted == False).count()

        # Resolve the organization this user is an employee of, so the profile
        # can show "Employee of <org>" with a link to the org page.
        current_org = None
        if user.organization_id:
            from app.models.organization import Organization
            current_org = await Organization.find_one(
                Organization.organization_id == user.organization_id,
                Organization.is_deleted == False,
            )
        current_org_dict = None
        if current_org:
            current_org_dict = {
                "organization_id": current_org.organization_id,
                "name": current_org.organization_name,
                "logo": current_org.logo,
                "type": current_org.organization_type,
                "employee_count": current_org.employee_count,
            }

        return {
            "_id": user.user_id,
            "user_id": user.user_id,
            "email": user.email,
            "fullName": f"{user.first_name} {user.last_name}".strip(),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "accountStatus": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
            "profilePhoto": user.profile_photo,
            "profile_photo": user.profile_photo,
            "coverPhoto": user.cover_photo,
            "cover_photo": user.cover_photo,
            "headline": user.headline,
            "bio": user.bio,
            "location": user.city or user.state or user.country or "",
            "country": user.country,
            "state": user.state,
            "city": user.city,
            "specialization": user.specialization,
            "licenseNumber": user.license_number,
            "yearsOfExperience": user.experience_years,
            "currentOrganization": current_org_dict,
            "currentOrganizationName": current_org_dict["name"] if current_org_dict else None,
            "organizationId": user.organization_id,
            "isEmployee": bool(current_org_dict),
            "department": user.department,
            "designation": user.designation,
            "skills": [s.skill_name for s in (user.skills or []) if s.skill_name],
            "languages": [l.language for l in (user.languages or []) if l.language],
            "certifications": [
                {
                    "_id": str(i),
                    "name": c.certificate_name,
                    "issuer": c.issuing_organization,
                    "issueDate": c.issue_date,
                    "expiryDate": c.expiry_date,
                    "credentialId": c.credential_id,
                    "credentialUrl": c.credential_url,
                }
                for i, c in enumerate(user.certifications or [])
            ],
            "education": [
                {
                    "_id": str(i),
                    "institution": e.institution or e.university,
                    "degree": e.degree,
                    "field": e.course or e.specialization,
                    "startDate": e.start_date,
                    "endDate": e.end_date,
                    "isCurrent": e.currently_studying,
                    "description": e.description,
                }
                for i, e in enumerate(user.education or [])
            ],
            "experience": [
                {
                    "_id": str(i),
                    "organization": e.organization_name,
                    "title": e.designation,
                    "employmentType": e.employment_type,
                    "startDate": e.start_date,
                    "endDate": e.end_date,
                    "isCurrent": e.currently_working,
                    "description": e.description,
                    "location": e.location,
                }
                for i, e in enumerate(user.experience or [])
            ],
            "isEmailVerified": user.email_verified,
            "isProfileComplete": (user.profile_completion or 0) >= 80,
            "verificationStatus": user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status,
            "followersCount": followers_count,
            "followingCount": following_count,
            "connectionsCount": connections_count,
            "postsCount": posts_count,
            "createdAt": user.created_at,
            "updatedAt": user.updated_at,
        }

    @staticmethod
    async def update_profile(user_id: str, data: UserUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        await UserRepository.update_profile_completion(user)
        await UserRepository.update_user(user)
        return await UserService.get_profile(user_id)

    @staticmethod
    async def add_education(user_id: str, data: EducationUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if user.education is None:
            user.education = []
        user.education.append(EducationItem(**data.model_dump()))
        await UserRepository.update_user(user)
        return {"message": "Education added successfully"}

    @staticmethod
    async def update_education(user_id: str, index: int, data: EducationUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.education or index >= len(user.education):
            raise NotFoundError("Education entry not found")
        edu_data = data.model_dump(exclude_unset=True)
        for key, value in edu_data.items():
            setattr(user.education[index], key, value)
        await UserRepository.update_user(user)
        return {"message": "Education updated successfully"}

    @staticmethod
    async def delete_education(user_id: str, index: int) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.education or index >= len(user.education):
            raise NotFoundError("Education entry not found")
        user.education.pop(index)
        await UserRepository.update_user(user)
        return {"message": "Education deleted successfully"}

    @staticmethod
    async def add_experience(user_id: str, data: ExperienceUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if user.experience is None:
            user.experience = []
        user.experience.append(ExperienceItem(**data.model_dump()))
        await UserRepository.update_user(user)
        return {"message": "Experience added successfully"}

    @staticmethod
    async def update_experience(user_id: str, index: int, data: ExperienceUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.experience or index >= len(user.experience):
            raise NotFoundError("Experience entry not found")
        exp_data = data.model_dump(exclude_unset=True)
        for key, value in exp_data.items():
            setattr(user.experience[index], key, value)
        await UserRepository.update_user(user)
        return {"message": "Experience updated successfully"}

    @staticmethod
    async def delete_experience(user_id: str, index: int) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.experience or index >= len(user.experience):
            raise NotFoundError("Experience entry not found")
        user.experience.pop(index)
        await UserRepository.update_user(user)
        return {"message": "Experience deleted successfully"}

    @staticmethod
    async def add_skill(user_id: str, data: SkillUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if user.skills is None:
            user.skills = []
        user.skills.append(SkillItem(**data.model_dump()))
        await UserRepository.update_user(user)
        return {"message": "Skill added successfully"}

    @staticmethod
    async def delete_skill(user_id: str, index: int) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.skills or index >= len(user.skills):
            raise NotFoundError("Skill entry not found")
        user.skills.pop(index)
        await UserRepository.update_user(user)
        return {"message": "Skill deleted successfully"}

    @staticmethod
    async def add_certification(user_id: str, data: CertificationUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if user.certifications is None:
            user.certifications = []
        user.certifications.append(CertificationItem(**data.model_dump()))
        await UserRepository.update_user(user)
        return {"message": "Certification added successfully"}

    @staticmethod
    async def delete_certification(user_id: str, index: int) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.certifications or index >= len(user.certifications):
            raise NotFoundError("Certification entry not found")
        user.certifications.pop(index)
        await UserRepository.update_user(user)
        return {"message": "Certification deleted successfully"}

    @staticmethod
    async def add_language(user_id: str, data: LanguageUpdateRequest) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if user.languages is None:
            user.languages = []
        user.languages.append(LanguageItem(**data.model_dump()))
        await UserRepository.update_user(user)
        return {"message": "Language added successfully"}

    @staticmethod
    async def delete_language(user_id: str, index: int) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not user.languages or index >= len(user.languages):
            raise NotFoundError("Language entry not found")
        user.languages.pop(index)
        await UserRepository.update_user(user)
        return {"message": "Language deleted successfully"}

    @staticmethod
    async def update_social_links(user_id: str, data: SocialLinksUpdateRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        links_data = data.model_dump(exclude_unset=True)
        for key, value in links_data.items():
            setattr(user.social_links, key, value)
        await UserRepository.update_user(user)
        return {"message": "Social links updated successfully"}

    @staticmethod
    async def update_privacy(user_id: str, data: PrivacyUpdateRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        privacy_data = data.model_dump(exclude_unset=True)
        for key, value in privacy_data.items():
            if value is not None:
                setattr(user.privacy_settings, key, value)
        await UserRepository.update_user(user)
        return {"message": "Privacy settings updated successfully"}

    @staticmethod
    async def update_notifications(user_id: str, data: NotificationSettingsUpdateRequest) -> dict[str, str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        notif_data = data.model_dump(exclude_unset=True)
        for key, value in notif_data.items():
            if value is not None:
                setattr(user.notification_settings, key, value)
        await UserRepository.update_user(user)
        return {"message": "Notification settings updated successfully"}

    @staticmethod
    async def submit_verification(user_id: str, data: VerificationSubmitRequest) -> dict[str, str]:
        import logging
        logger = logging.getLogger(__name__)
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        logger.info("submit_verification: found user %s, current status: %s", user_id, user.verification_status)
        user.verification_status = VerificationStatus.UNDER_REVIEW
        if data.registration_number:
            user.registration_number = data.registration_number
        if data.issuing_authority:
            user.medical_council = data.issuing_authority
        if data.document_urls:
            from app.models.verification import VerificationDocument
            docs = [VerificationDocument(cloudinary_url=url) for url in data.document_urls]
            if not hasattr(user, 'verification_documents'):
                user.verification_documents = []
            user.verification_documents.extend(docs)
        if not hasattr(user, 'verification_history') or user.verification_history is None:
            user.verification_history = []
        user.verification_history.append({
            "submitted_date": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": None,
            "decision": "pending",
            "reason": "",
            "remarks": data.registration_number or "",
        })
        logger.info("submit_verification: saving user with verification_status=%s", user.verification_status)
        await UserRepository.update_user(user)
        logger.info("submit_verification: save completed for user %s", user_id)

        from app.models.verification import VerificationRequest, VerificationDocument
        import secrets
        await VerificationRequest.find(VerificationRequest.user_id == user_id).delete()
        req_docs = [VerificationDocument(cloudinary_url=url) for url in (data.document_urls or [])]
        request = VerificationRequest(
            verification_id=secrets.token_hex(16),
            user_id=user_id,
            registration_number=user.registration_number,
            license_number=getattr(user, "license_number", None) or None,
            verification_type="professional",
            supporting_documents=req_docs,
            status=VerificationStatus.PENDING,
        )
        await request.insert()
        logger.info("submit_verification: verification request queued for user %s", user_id)
        return {"message": "Verification submitted. Under review."}

    @staticmethod
    async def get_verification_status(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return {
            "status": user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status,
            "registration_number": user.registration_number,
        }

    @staticmethod
    async def search_users(query: str | None, role: str | None, country: str | None, city: str | None, specialization: str | None, page: int, per_page: int) -> dict[str, Any]:
        users, total = await UserRepository.search_users(query, role, country, city, specialization, page, per_page)
        return paginate_response(users, total, page, per_page, "created_at")

    @staticmethod
    async def record_profile_view(profile_user_id: str, viewer_id: str) -> None:
        try:
            from datetime import timedelta
            from app.models.profile_view import ProfileView
            from app.models.user import User as UserModel

            recent = datetime.now(timezone.utc) - timedelta(days=1)
            existing = await ProfileView.find_one(
                ProfileView.profile_user_id == profile_user_id,
                ProfileView.viewer_id == viewer_id,
                ProfileView.viewed_at >= recent,
            )
            if existing:
                return

            viewer = await UserModel.find_one(UserModel.user_id == viewer_id)
            country = viewer.country if viewer and viewer.country else "Unknown"
            await ProfileView(
                profile_user_id=profile_user_id,
                viewer_id=viewer_id,
                viewer_country=country,
            ).insert()
        except Exception:
            logger.exception("Failed to record profile view")

    @staticmethod
    async def calculate_profile_completion(user_id: str) -> dict[str, Any]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        fields = {
            "first_name": bool(user.first_name),
            "last_name": bool(user.last_name),
            "profile_photo": bool(user.profile_photo),
            "headline": bool(user.headline),
            "bio": bool(user.bio),
            "country": bool(user.country),
            "city": bool(user.city),
            "phone": bool(user.phone),
            "organization": bool(user.organization_id),
            "specialization": bool(user.specialization),
            "education": len(user.education) > 0,
            "experience": len(user.experience) > 0,
            "skills": len(user.skills) > 0,
            "certifications": len(user.certifications) > 0,
            "registration_number": bool(user.registration_number),
        }
        filled = sum(1 for v in fields.values() if v)
        total_fields = len(fields)
        completion = int((filled / total_fields) * 100) if total_fields > 0 else 0

        missing = [k for k, v in fields.items() if not v]

        user.profile_completion = completion
        await user.save()

        return {
            "profile_completion": completion,
            "filled_fields": filled,
            "total_fields": total_fields,
            "missing_fields": missing,
        }
