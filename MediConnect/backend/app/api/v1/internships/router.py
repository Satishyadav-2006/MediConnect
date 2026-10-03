from fastapi import APIRouter, Depends, Query, status
from app.schemas.internship import InternshipCreateRequest, InternshipUpdateRequest, InternshipApplicationRequest
from app.services.internship_service import InternshipService
from app.core.dependencies import get_current_user_id, get_current_recruiter_or_organization
from app.core.exceptions import success_response

router = APIRouter(prefix="/internships", tags=["Internships"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_internship(body: InternshipCreateRequest, user_id: str = Depends(get_current_recruiter_or_organization)):
    result = await InternshipService.create_internship(user_id, body)
    return success_response(result["message"], {"internship_id": result["internship_id"]})


@router.get("")
async def get_internships(page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await InternshipService.get_internships(page, per_page)
    return success_response("Internships retrieved", result)


@router.get("/my-posted")
async def get_my_posted_internships(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await InternshipService.get_user_posted_internships(user_id, page)
    return success_response("Posted internships retrieved", result)


@router.get("/my-applications")
async def get_my_applications(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await InternshipService.get_user_applications(user_id, page)
    return success_response("Applications retrieved", result)


@router.get("/applications")
async def get_all_internship_applications(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    status: str | None = Query(default=None),
):
    result = await InternshipService.get_posted_applications(user_id, page, status=status)
    return success_response("Applications retrieved", result)


@router.get("/recommended")
async def get_recommended_internships(page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await InternshipService.get_recommended(page, per_page)
    return success_response("Recommended internships retrieved", result)


@router.get("/saved")
async def get_saved_internships(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await InternshipService.get_saved_internships(user_id, page, per_page)
    return success_response("Saved internships retrieved", result)


@router.get("/{internship_id}")
async def get_internship(internship_id: str):
    result = await InternshipService.get_internship(internship_id)
    return success_response("Internship retrieved", result)


@router.patch("/{internship_id}")
async def update_internship(internship_id: str, body: InternshipUpdateRequest, user_id: str = Depends(get_current_recruiter_or_organization)):
    result = await InternshipService.update_internship(internship_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{internship_id}")
async def delete_internship(internship_id: str, user_id: str = Depends(get_current_recruiter_or_organization)):
    result = await InternshipService.delete_internship(internship_id, user_id)
    return success_response(result["message"])


@router.post("/{internship_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_internship(internship_id: str, body: InternshipApplicationRequest, user_id: str = Depends(get_current_user_id)):
    result = await InternshipService.apply_to_internship(internship_id, user_id, body)
    return success_response(result["message"], {"application_id": result["application_id"]})


@router.get("/{internship_id}/applications")
async def get_internship_applications(internship_id: str, user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await InternshipService.get_internship_applications(internship_id, user_id, page)
    return success_response("Applications retrieved", result)


@router.post("/{internship_id}/save", status_code=status.HTTP_201_CREATED)
async def save_internship(internship_id: str, user_id: str = Depends(get_current_user_id)):
    result = await InternshipService.save_internship(internship_id, user_id)
    return success_response(result["message"])


@router.delete("/{internship_id}/save")
async def unsave_internship(internship_id: str, user_id: str = Depends(get_current_user_id)):
    result = await InternshipService.unsave_internship(internship_id, user_id)
    return success_response(result["message"])


@router.patch("/applications/{application_id}")
async def update_internship_application(application_id: str, new_status: str = Query(...), user_id: str = Depends(get_current_user_id)):
    result = await InternshipService.update_application_status(application_id, user_id, new_status)
    return success_response(result["message"], {"application_id": application_id, "status": new_status})
