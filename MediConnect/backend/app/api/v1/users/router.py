from fastapi import APIRouter, Depends, Query, UploadFile, File, status

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
from app.services.user_service import UserService
from app.services.connection_service import ConnectionService
from app.core.dependencies import get_current_user_id, get_optional_user_id
from app.core.exceptions import success_response, ValidationAppError, NotFoundError

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    result = await UserService.get_profile(user_id)
    return success_response("Profile retrieved", result)


@router.patch("/me")
async def update_me_patch(body: UserUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_profile(user_id, body)
    return success_response("Profile updated", {"user": result})


@router.put("/me")
async def update_me(body: UserUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_profile(user_id, body)
    return success_response("Profile updated", {"user": result})


@router.get("/search")
async def search_users(
    q: str | None = Query(default=None),
    role: str | None = Query(default=None),
    country: str | None = Query(default=None),
    city: str | None = Query(default=None),
    specialization: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await UserService.search_users(q, role, country, city, specialization, page, per_page)
    return success_response("Search results", result)


@router.post("/education")
async def add_education(body: EducationUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.add_education(user_id, body)
    return success_response(result["message"])


@router.put("/education/{index}")
async def update_education(index: int, body: EducationUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_education(user_id, index, body)
    return success_response(result["message"])


@router.delete("/education/{index}")
async def delete_education(index: int, user_id: str = Depends(get_current_user_id)):
    result = await UserService.delete_education(user_id, index)
    return success_response(result["message"])


@router.post("/experience")
async def add_experience(body: ExperienceUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.add_experience(user_id, body)
    return success_response(result["message"])


@router.put("/experience/{index}")
async def update_experience(index: int, body: ExperienceUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_experience(user_id, index, body)
    return success_response(result["message"])


@router.delete("/experience/{index}")
async def delete_experience(index: int, user_id: str = Depends(get_current_user_id)):
    result = await UserService.delete_experience(user_id, index)
    return success_response(result["message"])


@router.post("/skills")
async def add_skill(body: SkillUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.add_skill(user_id, body)
    return success_response(result["message"])


@router.delete("/skills/{index}")
async def delete_skill(index: int, user_id: str = Depends(get_current_user_id)):
    result = await UserService.delete_skill(user_id, index)
    return success_response(result["message"])


@router.post("/certifications")
async def add_certification(body: CertificationUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.add_certification(user_id, body)
    return success_response(result["message"])


@router.delete("/certifications/{index}")
async def delete_certification(index: int, user_id: str = Depends(get_current_user_id)):
    result = await UserService.delete_certification(user_id, index)
    return success_response(result["message"])


@router.post("/languages")
async def add_language(body: LanguageUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.add_language(user_id, body)
    return success_response(result["message"])


@router.delete("/languages/{index}")
async def delete_language(index: int, user_id: str = Depends(get_current_user_id)):
    result = await UserService.delete_language(user_id, index)
    return success_response(result["message"])


@router.patch("/social-links")
async def update_social_links(body: SocialLinksUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_social_links(user_id, body)
    return success_response(result["message"])


@router.patch("/privacy")
async def update_privacy(body: PrivacyUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_privacy(user_id, body)
    return success_response(result["message"])


@router.patch("/notifications")
async def update_notifications(body: NotificationSettingsUpdateRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.update_notifications(user_id, body)
    return success_response(result["message"])


@router.post("/verification")
async def submit_verification(body: VerificationSubmitRequest, user_id: str = Depends(get_current_user_id)):
    result = await UserService.submit_verification(user_id, body)
    return success_response(result["message"])


@router.get("/verification-status")
async def get_verification_status(user_id: str = Depends(get_current_user_id)):
    result = await UserService.get_verification_status(user_id)
    return success_response("Verification status retrieved", result)


@router.get("/{user_id}")
async def get_user_profile(user_id: str, viewer_id: str | None = Depends(get_optional_user_id)):
    result = await UserService.get_profile(user_id)
    if viewer_id and viewer_id != user_id and result:
        await UserService.record_profile_view(user_id, viewer_id)
    return success_response("Profile retrieved", result)


@router.get("/{user_id}/posts")
async def get_user_posts(user_id: str, page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100), viewer_id: str | None = Depends(get_optional_user_id)):
    from app.services.post_service import PostService
    result = await PostService.get_user_posts(user_id, page, per_page, viewer_id)
    return success_response("User posts retrieved", result)


@router.post("/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    from app.storage.cloudinary_service import CloudinaryService
    from app.repositories.user_repository import UserRepository
    if not file.content_type or not file.content_type.startswith("image/"):
        raise ValidationAppError("Profile photo must be an image (JPEG, PNG, WebP)")
    user = await UserRepository.find_by_user_id(user_id)
    if not user:
        raise NotFoundError("User not found")
    url = await CloudinaryService.upload_image(file, folder="profiles")
    user.profile_photo = url
    await UserRepository.update_profile_completion(user)
    await UserRepository.update_user(user)
    return success_response("Profile photo updated", {"url": url, "profilePhoto": url, "profile_photo": url})


@router.post("/cover-photo")
async def upload_cover_photo(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    from app.storage.cloudinary_service import CloudinaryService
    from app.repositories.user_repository import UserRepository
    if not file.content_type or not file.content_type.startswith("image/"):
        raise ValidationAppError("Cover photo must be an image (JPEG, PNG, WebP)")
    user = await UserRepository.find_by_user_id(user_id)
    if not user:
        raise NotFoundError("User not found")
    url = await CloudinaryService.upload_image(file, folder="covers")
    user.cover_photo = url
    await UserRepository.update_user(user)
    return success_response("Cover photo updated", {"url": url, "coverPhoto": url, "cover_photo": url})


@router.post("/follow")
async def follow_user(body: dict, user_id: str = Depends(get_current_user_id)):
    from pydantic import BaseModel
    class FollowBody(BaseModel):
        following_id: str
        following_type: str = "user"
    fb = FollowBody(**body)
    result = await ConnectionService.follow_user(user_id, fb.following_id, fb.following_type)
    return success_response(result["message"])


@router.delete("/unfollow/{following_id}")
async def unfollow_user(following_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.unfollow_user(user_id, following_id)
    return success_response(result["message"])


@router.delete("/unfollow")
async def unfollow_user_body(body: dict, user_id: str = Depends(get_current_user_id)):
    from pydantic import BaseModel
    class UnfollowBody(BaseModel):
        following_id: str
    ub = UnfollowBody(**body)
    result = await ConnectionService.unfollow_user(user_id, ub.following_id)
    return success_response(result["message"])


@router.post("/block")
async def block_user(body: dict, user_id: str = Depends(get_current_user_id)):
    from pydantic import BaseModel
    class BlockBody(BaseModel):
        blocked_id: str
    bb = BlockBody(**body)
    result = await ConnectionService.block_user(user_id, bb.blocked_id)
    return success_response(result["message"])


@router.delete("/unblock/{blocked_id}")
async def unblock_user(blocked_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.unblock_user(user_id, blocked_id)
    return success_response(result["message"])


@router.delete("/unblock")
async def unblock_user_body(body: dict, user_id: str = Depends(get_current_user_id)):
    from pydantic import BaseModel
    class UnblockBody(BaseModel):
        blocked_id: str
    ub = UnblockBody(**body)
    result = await ConnectionService.unblock_user(user_id, ub.blocked_id)
    return success_response(result["message"])
