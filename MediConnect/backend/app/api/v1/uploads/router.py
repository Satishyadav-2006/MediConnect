from fastapi import APIRouter, Depends, UploadFile, File

from app.core.dependencies import get_current_user_id
from app.core.exceptions import (
    success_response,
    AppException,
    ValidationAppError,
    NotFoundError,
)
from app.storage.cloudinary_service import CloudinaryService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "general",
    user_id: str = Depends(get_current_user_id),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise ValidationAppError("File must be an image (JPEG, PNG, WebP)")
    url = await CloudinaryService.upload_image(file, folder=folder)
    return success_response("Image uploaded", {"url": url})


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    folder: str = "videos",
    user_id: str = Depends(get_current_user_id),
):
    url = await CloudinaryService.upload_video(file, folder=folder)
    return success_response("Video uploaded", {"url": url})


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    folder: str = "documents",
    user_id: str = Depends(get_current_user_id),
):
    url = await CloudinaryService.upload_document(file, folder=folder)
    return success_response("Document uploaded", {"url": url})


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    allowed = ["application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if not file.content_type or file.content_type not in allowed:
        raise ValidationAppError("Resume must be a PDF or Word document")
    url = await CloudinaryService.upload_document(file, folder="resumes")
    return success_response("Resume uploaded", {"url": url})


@router.post("/certificate")
async def upload_certificate(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if not file.content_type or file.content_type not in allowed:
        raise ValidationAppError("Certificate must be a PDF or image")
    if file.content_type.startswith("image/"):
        url = await CloudinaryService.upload_image(file, folder="certificates")
    else:
        url = await CloudinaryService.upload_document(file, folder="certificates")
    return success_response("Certificate uploaded", {"url": url})


@router.post("/org-logo")
async def upload_org_logo(
    file: UploadFile = File(...),
    organization_id: str = "",
    user_id: str = Depends(get_current_user_id),
):
    from app.repositories.organization_repository import OrganizationRepository
    from app.core.exceptions import AuthorizationError
    if not organization_id:
        raise ValidationAppError("organization_id is required")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise ValidationAppError("Logo must be an image (JPEG, PNG, WebP)")
    org = await OrganizationRepository.find_by_id(organization_id)
    if not org:
        raise NotFoundError("Organization not found")
    if org.owner_id != user_id:
        raise AuthorizationError("Only the owner can update this organization")
    url = await CloudinaryService.upload_image(
        file, folder=f"organizations/{organization_id}/logo"
    )
    org.logo = url
    await OrganizationRepository.update(org)
    return success_response("Organization logo uploaded", {"url": url, "logo": url})


@router.post("/org-banner")
async def upload_org_banner(
    file: UploadFile = File(...),
    organization_id: str = "",
    user_id: str = Depends(get_current_user_id),
):
    from app.repositories.organization_repository import OrganizationRepository
    from app.core.exceptions import AuthorizationError
    if not organization_id:
        raise ValidationAppError("organization_id is required")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise ValidationAppError("Banner must be an image (JPEG, PNG, WebP)")
    org = await OrganizationRepository.find_by_id(organization_id)
    if not org:
        raise NotFoundError("Organization not found")
    if org.owner_id != user_id:
        raise AuthorizationError("Only the owner can update this organization")
    url = await CloudinaryService.upload_image(
        file, folder=f"organizations/{organization_id}/banner"
    )
    org.banner = url
    await OrganizationRepository.update(org)
    return success_response("Organization banner uploaded", {"url": url, "banner": url, "coverPhoto": url})


@router.post("/post-media")
async def upload_post_media(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type and file.content_type.startswith("image/"):
        url = await CloudinaryService.upload_image(file, folder="posts")
    elif file.content_type and file.content_type.startswith("video/"):
        url = await CloudinaryService.upload_video(file, folder="posts")
    else:
        raise ValidationAppError("Post media must be an image or video")
    return success_response("Post media uploaded", {"url": url})
