from fastapi import APIRouter, Depends, Query, status
from app.schemas.job import JobCreateRequest, JobUpdateRequest, JobApplicationRequest
from app.services.job_service import JobService
from app.core.dependencies import get_current_user_id, get_current_recruiter_or_organization
from app.core.exceptions import success_response

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_job(body: JobCreateRequest, user_id: str = Depends(get_current_recruiter_or_organization)):
    result = await JobService.create_job(user_id, body)
    return success_response(result["message"], {"job_id": result["job_id"]})


@router.get("")
async def get_jobs(page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await JobService.get_jobs(page, per_page)
    return success_response("Jobs retrieved", result)


@router.get("/recommended")
async def get_recommended_jobs(page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await JobService.get_recommended(page, per_page)
    return success_response("Recommended jobs retrieved", result)


@router.get("/applications")
async def get_all_applications(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    status: str | None = Query(default=None),
):
    result = await JobService.get_posted_applications(user_id, page, status=status)
    return success_response("Applications retrieved", result)


@router.get("/my-posted")
async def get_my_posted_jobs(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await JobService.get_user_posted_jobs(user_id, page)
    return success_response("Posted jobs retrieved", result)


@router.get("/my-applications")
async def get_my_applications(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await JobService.get_user_applications(user_id, page)
    return success_response("Applications retrieved", result)


@router.get("/applied")
async def get_applied_jobs(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await JobService.get_applied_jobs(user_id, page, per_page)
    return success_response("Applied jobs retrieved", result)


@router.get("/saved")
async def get_saved_jobs(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await JobService.get_saved_jobs(user_id, page, per_page)
    return success_response("Saved jobs retrieved", result)


@router.get("/{job_id}")
async def get_job(job_id: str):
    result = await JobService.get_job(job_id)
    return success_response("Job retrieved", result)


@router.patch("/{job_id}")
async def update_job(job_id: str, body: JobUpdateRequest, user_id: str = Depends(get_current_recruiter_or_organization)):
    result = await JobService.update_job(job_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{job_id}")
async def delete_job(job_id: str, user_id: str = Depends(get_current_recruiter_or_organization)):
    result = await JobService.delete_job(job_id, user_id)
    return success_response(result["message"])


@router.post("/{job_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_job(job_id: str, body: JobApplicationRequest, user_id: str = Depends(get_current_user_id)):
    result = await JobService.apply_to_job(job_id, user_id, body)
    return success_response(result["message"], {"application_id": result["application_id"]})


@router.delete("/{job_id}/apply")
async def withdraw_application(job_id: str, user_id: str = Depends(get_current_user_id)):
    result = await JobService.withdraw_application(job_id, user_id)
    return success_response(result["message"])


@router.get("/{job_id}/applications")
async def get_job_applications(job_id: str, user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await JobService.get_job_applications(job_id, user_id, page)
    return success_response("Applications retrieved", result)


@router.patch("/applications/{application_id}")
async def update_application_status(application_id: str, new_status: str = Query(...), user_id: str = Depends(get_current_user_id)):
    result = await JobService.update_application_status(application_id, user_id, new_status)
    return success_response(result["message"], {"application_id": application_id, "status": new_status})


@router.get("/applications/{application_id}")
async def get_application_detail(application_id: str, user_id: str = Depends(get_current_user_id)):
    result = await JobService.get_application_detail(application_id, user_id)
    return success_response("Application retrieved", result)


@router.post("/{job_id}/bookmark", status_code=status.HTTP_201_CREATED)
async def bookmark_job(job_id: str, user_id: str = Depends(get_current_user_id)):
    result = await JobService.bookmark_job(job_id, user_id)
    return success_response(result["message"])


@router.delete("/{job_id}/bookmark")
async def unbookmark_job(job_id: str, user_id: str = Depends(get_current_user_id)):
    result = await JobService.unbookmark_job(job_id, user_id)
    return success_response(result["message"])


@router.post("/{job_id}/save", status_code=status.HTTP_201_CREATED)
async def save_job(job_id: str, user_id: str = Depends(get_current_user_id)):
    result = await JobService.bookmark_job(job_id, user_id)
    return success_response(result["message"])


@router.delete("/{job_id}/save")
async def unsave_job(job_id: str, user_id: str = Depends(get_current_user_id)):
    result = await JobService.unbookmark_job(job_id, user_id)
    return success_response(result["message"])
