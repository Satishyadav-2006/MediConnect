from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status

from app.schemas.organization import (
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
    EmployeeAddRequest,
    DepartmentRequest,
)
from app.services.organization_service import OrganizationService
from app.services.job_service import JobService
from app.services.internship_service import InternshipService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("/{organization_id}/jobs")
async def get_organization_jobs(
    organization_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await JobService.get_organization_jobs(organization_id, page, per_page)
    return success_response("Organization jobs retrieved", result)


@router.get("/{organization_id}/internships")
async def get_organization_internships(
    organization_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await InternshipService.get_organization_internships(organization_id, page, per_page)
    return success_response("Organization internships retrieved", result)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_organization(body: OrganizationCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await OrganizationService.create(user_id, body)
    return success_response(result["message"], {
        "organization_id": result["organization_id"],
        "name": result["name"],
    })


@router.get("")
async def list_organizations(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await OrganizationService.list_organizations(page, per_page)
    return success_response("Organizations retrieved", result)


@router.get("/search")
async def search_organizations(
    q: str | None = Query(default=None),
    type: str | None = Query(default=None),
    country: str | None = Query(default=None),
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await OrganizationService.search_organizations(q, type, country, city, page, per_page)
    return success_response("Search results", result)


@router.get("/{organization_id}")
async def get_organization(organization_id: str):
    result = await OrganizationService.get_organization(organization_id)
    return success_response("Organization retrieved", result)


@router.patch("/{organization_id}")
async def update_organization(
    organization_id: str,
    body: OrganizationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.update_organization(organization_id, user_id, body)
    return success_response(result["message"])


@router.get("/{organization_id}/gallery")
async def list_gallery(
    organization_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    type: str | None = Query(default=None),
):
    result = await OrganizationService.list_gallery(organization_id, page, per_page, type)
    return success_response("Gallery retrieved", result)


@router.post("/{organization_id}/gallery", status_code=status.HTTP_201_CREATED)
async def upload_gallery_item(
    organization_id: str,
    file: UploadFile = File(...),
    type: str = Form("image"),
    caption: str = Form(""),
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.add_gallery_item(
        organization_id, user_id, file, type, caption
    )
    return success_response("Gallery item uploaded", result)


@router.delete("/{organization_id}/gallery/{item_id}")
async def delete_gallery_item(
    organization_id: str,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.delete_gallery_item(organization_id, user_id, item_id)
    return success_response(result["message"])


@router.get("/{organization_id}/employees")
async def list_employees(
    organization_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await OrganizationService.list_employees(organization_id, page, per_page)
    return success_response("Employees retrieved", result)


@router.get("/{organization_id}/departments")
async def list_departments(organization_id: str):
    result = await OrganizationService.list_departments(organization_id)
    return success_response("Departments retrieved", result)


@router.delete("/{organization_id}/departments/{department_id}")
async def delete_department(
    organization_id: str,
    department_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.delete_department(organization_id, user_id, department_id)
    return success_response(result["message"])


@router.get("/{organization_id}/followers")
async def list_followers(
    organization_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await OrganizationService.list_followers(organization_id, page, per_page)
    return success_response("Followers retrieved", result)


@router.post("/{organization_id}/follow")
async def follow_organization(
    organization_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.follow_organization(organization_id, user_id)
    return success_response(result["message"])


@router.delete("/{organization_id}/follow")
async def unfollow_organization(
    organization_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.unfollow_organization(organization_id, user_id)
    return success_response(result["message"])


@router.delete("/{organization_id}")
async def delete_organization(
    organization_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.delete_organization(organization_id, user_id)
    return success_response(result["message"])


@router.post("/{organization_id}/employees")
async def add_employee(
    organization_id: str,
    body: EmployeeAddRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.add_employee(organization_id, user_id, body)
    return success_response(result["message"])


@router.delete("/{organization_id}/employees/{employee_id}")
async def remove_employee(
    organization_id: str,
    employee_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.remove_employee(organization_id, user_id, employee_id)
    return success_response(result["message"])


@router.post("/{organization_id}/departments")
async def add_department(
    organization_id: str,
    body: DepartmentRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await OrganizationService.add_department(organization_id, user_id, body)
    return success_response(result["message"])
