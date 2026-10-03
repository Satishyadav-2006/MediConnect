import re
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from app.services.admin_service import AdminService
from app.core.dependencies import get_current_user_id, require_role
from app.core.exceptions import success_response, NotFoundError
from beanie.odm.operators.find.comparison import In

router = APIRouter(prefix="/admin", tags=["Admin"])


async def _search_ids(model, fields: list[str], search: str) -> list:
    """Case-insensitive substring search across fields, returning matching _id values."""
    pattern = re.escape(search.strip())
    if not pattern:
        return []
    ors = [{f: {"$regex": pattern, "$options": "i"}} for f in fields]
    rows = await model.get_motor_collection().find({"$or": ors}, {"_id": 1}).to_list(None)
    return [row["_id"] for row in rows]


class RoleUpdateBody(BaseModel):
    role: str


class VerificationActionBody(BaseModel):
    decision: str = Field(..., description="approved, rejected, need_more_information, suspended")
    remarks: str = ""


class ReportActionBody(BaseModel):
    action: str = Field(..., description="dismiss, warn, remove_content, suspend, ban, escalate")
    remarks: str = ""


class OrganizationUpdateBody(BaseModel):
    status: str = ""
    notes: str = ""


class AnnouncementUpdateBody(BaseModel):
    title: str | None = None
    content: str | None = None
    status: str | None = None
    target_roles: list[str] | None = None


class CategoryCreateBody(BaseModel):
    category_type: str = Field(..., description="specialization, department, research_area, job_category, skill, language")
    category_name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    display_order: int = 0


class CategoryUpdateBody(BaseModel):
    category_name: str | None = None
    description: str | None = None
    display_order: int | None = None
    status: str | None = None


class ReportCreateBody(BaseModel):
    resource_type: str = Field(..., description="post, comment, user, organization, research, job, internship, event, message")
    resource_id: str = Field(..., min_length=1)
    reason: str = Field(..., min_length=1)
    description: str = ""


class PlatformSettingsUpdateBody(BaseModel):
    registration_enabled: bool | None = None
    verification_required: bool | None = None
    maintenance_mode: bool | None = None
    max_upload_size: int | None = None
    allowed_file_types: list[str] | None = None


class LegacyRoleUpdateBody(BaseModel):
    user_id: str
    role: str


async def _user_cards(user_ids: list[str]) -> dict[str, dict]:
    """Batch-resolve user ids into small display cards for admin tables."""
    unique = [uid for uid in dict.fromkeys([u for u in user_ids if u])]
    if not unique:
        return {}
    from app.models.user import User
    cards: dict[str, dict] = {}
    for u in await User.find(In(User.user_id, unique)).to_list():
        cards[u.user_id] = {
            "user_id": u.user_id,
            "fullName": f"{u.first_name} {u.last_name}".strip(),
            "username": u.username,
            "profile_photo": u.profile_photo,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
        }
    return cards


async def _org_cards(org_ids: list[str]) -> dict[str, dict]:
    unique = [oid for oid in dict.fromkeys([o for o in org_ids if o])]
    if not unique:
        return {}
    from app.models.organization import Organization
    cards: dict[str, dict] = {}
    for o in await Organization.find(In(Organization.organization_id, unique)).to_list():
        cards[o.organization_id] = {
            "organization_id": o.organization_id,
            "name": o.organization_name,
            "organization_name": o.organization_name,
            "logo": o.logo,
        }
    return cards


@router.get("/dashboard")
async def get_dashboard(user_id: str = Depends(require_role("admin", "super_admin", "owner"))):
    result = await AdminService.get_platform_stats()
    return success_response("Dashboard retrieved", result)


@router.get("/stats")
async def get_platform_stats(user_id: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.get_platform_stats()
    return success_response("Platform stats retrieved", result)


@router.get("/users")
async def get_all_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    result = await AdminService.get_all_users(page, per_page, status, role, search)
    return success_response("Users retrieved", result)


@router.get("/users/{user_id}")
async def get_user_details(user_id: str, _admin: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.get_user_details(user_id)
    return success_response("User details retrieved", result)


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, new_status: str = Query(...), _admin: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.update_user_status(user_id, new_status)
    return success_response(result["message"])


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _admin: str = Depends(require_role("super_admin"))):
    result = await AdminService.delete_user(user_id)
    return success_response(result["message"])


@router.patch("/users/{user_id}/role", status_code=status.HTTP_200_OK)
async def update_user_role_by_id(user_id: str, body: RoleUpdateBody, _admin: str = Depends(require_role("super_admin"))):
    result = await AdminService.update_user_role(user_id, body.role)
    return success_response(result["message"])


@router.patch("/roles", status_code=status.HTTP_200_OK)
async def update_role_legacy(body: LegacyRoleUpdateBody, user_id: str = Depends(require_role("super_admin"))):
    result = await AdminService.update_user_role(body.user_id, body.role)
    return success_response(result["message"])


@router.get("/organizations")
async def get_all_organizations(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    result = await AdminService.get_all_organizations(page, per_page)
    return success_response("Organizations retrieved", result)


@router.get("/organizations/{organization_id}")
async def get_organization_details(organization_id: str, _admin: str = Depends(require_role("admin", "super_admin"))):
    from app.models.organization import Organization
    org = await Organization.find_one(Organization.organization_id == organization_id)
    if not org:
        raise NotFoundError("Organization not found")
    return success_response("Organization retrieved", {
        "organization_id": org.organization_id,
        "name": org.name,
        "organization_type": org.organization_type,
        "email": org.email,
        "phone": org.phone,
        "website": org.website,
        "verification_status": org.verification_status,
        "employees_count": org.employees_count,
        "created_at": org.created_at,
        "updated_at": org.updated_at,
    })


@router.delete("/organizations/{organization_id}", status_code=status.HTTP_200_OK)
async def delete_organization(organization_id: str, _admin: str = Depends(require_role("super_admin"))):
    from app.models.organization import Organization
    org = await Organization.find_one(Organization.organization_id == organization_id)
    if not org:
        raise NotFoundError("Organization not found")
    org.is_deleted = True
    org.updated_at = datetime.utcnow()
    await org.save()
    return success_response("Organization deleted")


@router.patch("/organizations/{organization_id}")
async def update_organization(organization_id: str, body: OrganizationUpdateBody, user_id: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.update_organization_status(organization_id, body.status, body.notes)
    return success_response(result["message"])


@router.get("/reports")
async def get_reports(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    report_status: str = Query(default="pending"),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    result = await AdminService.get_reports(page, per_page, report_status)
    return success_response("Reports retrieved", result)


@router.patch("/reports/{report_id}")
async def resolve_report(report_id: str, body: ReportActionBody, user_id: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.resolve_report(report_id, body.action, body.remarks, user_id)
    return success_response(result["message"])


@router.get("/verifications")
async def get_pending_verifications(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    result = await AdminService.get_pending_verifications(page, per_page)
    return success_response("Pending verifications retrieved", result)


@router.get("/verifications/{verification_id}")
async def get_verification_details(verification_id: str, _admin: str = Depends(require_role("admin", "super_admin"))):
    from app.models.verification import VerificationRequest
    vr = await VerificationRequest.find_one(VerificationRequest.verification_id == verification_id)
    if not vr:
        raise NotFoundError("Verification request not found")
    return success_response("Verification details retrieved", {
        "verification_id": vr.verification_id,
        "user_id": vr.user_id,
        "registration_number": vr.registration_number,
        "license_number": vr.license_number,
        "verification_type": vr.verification_type,
        "supporting_documents": [
            {
                "cloudinary_url": d.cloudinary_url,
                "original_filename": d.original_filename,
                "document_type": d.document_type,
                "file_size": d.file_size,
                "mime_type": d.mime_type,
                "upload_timestamp": d.upload_timestamp,
            }
            for d in vr.supporting_documents
        ],
        "submitted_at": vr.submitted_at,
        "reviewed_at": vr.reviewed_at,
        "reviewed_by": vr.reviewed_by,
        "status": vr.status.value if hasattr(vr.status, "value") else vr.status,
        "remarks": vr.remarks,
        "history": [
            {
                "status": h.status,
                "reviewer": h.reviewer,
                "timestamp": h.timestamp,
                "remarks": h.remarks,
            }
            for h in vr.history
        ],
    })


@router.patch("/verifications/{verification_id}")
async def update_verification(verification_id: str, body: VerificationActionBody, user_id: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.update_verification(verification_id, body.decision, body.remarks)
    return success_response(result["message"])


@router.get("/verification")
async def get_verification_requests(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    result = await AdminService.get_pending_verifications(page, per_page)
    return success_response("Pending verifications retrieved", result)


@router.put("/verification/{user_id}/approve")
async def approve_verification(user_id: str, _admin: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.update_verification(user_id, "approved", "")
    return success_response(result["message"])


@router.put("/verification/{user_id}/reject")
async def reject_verification(user_id: str, body: VerificationActionBody, _admin: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.update_verification(user_id, "rejected", body.remarks)
    return success_response(result["message"])


@router.put("/verification/{user_id}/request-info")
async def request_more_information(user_id: str, body: VerificationActionBody, _admin: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.update_verification(user_id, "need_more_information", body.remarks)
    return success_response(result["message"])


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    result = await AdminService.get_audit_logs(page, per_page)
    return success_response("Audit logs retrieved", result)


@router.get("/analytics")
async def get_analytics(
    period: str = Query(default="monthly", description="daily, weekly, monthly, quarterly, yearly"),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    from app.services.analytics_service import AnalyticsService
    result = await AnalyticsService.get_admin_platform_analytics(period=period)
    return success_response("Analytics retrieved", result)


@router.get("/analytics/recruitment")
async def get_recruitment_analytics(user_id: str = Depends(require_role("admin", "super_admin"))):
    from app.services.analytics_service import AnalyticsService
    result = await AnalyticsService.get_recruitment_analytics()
    return success_response("Recruitment analytics retrieved", result)


@router.get("/analytics/events")
async def get_event_analytics(user_id: str = Depends(require_role("admin", "super_admin"))):
    from app.services.analytics_service import AnalyticsService
    result = await AnalyticsService.get_event_analytics()
    return success_response("Event analytics retrieved", result)


@router.get("/analytics/mentorship")
async def get_mentorship_analytics(user_id: str = Depends(require_role("admin", "super_admin"))):
    from app.services.analytics_service import AnalyticsService
    result = await AnalyticsService.get_mentorship_analytics()
    return success_response("Mentorship analytics retrieved", result)


@router.get("/security")
async def get_security_analytics(user_id: str = Depends(require_role("admin", "super_admin"))):
    from app.services.analytics_service import AnalyticsService
    result = await AnalyticsService.get_security_analytics()
    return success_response("Security analytics retrieved", result)


@router.get("/security/logs")
async def get_security_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    action: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    from app.models.report import AuditLog
    skip = (page - 1) * per_page
    q = AuditLog.find()
    if action:
        q = q.find(AuditLog.action == action)
    total = await q.count()
    logs = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    from app.utils.pagination import paginate_response
    return success_response("Security logs retrieved", paginate_response([
        {
            "audit_id": str(l.id),
            "actor_id": l.actor_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "ip_address": l.ip_address,
            "created_at": l.created_at,
        }
        for l in logs
    ], total, page, per_page, "created_at"))


@router.get("/security-events")
async def get_security_events(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    action: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    from app.models.report import AuditLog
    skip = (page - 1) * per_page
    q = AuditLog.find()
    if action:
        q = q.find(AuditLog.action == action)
    total = await q.count()
    logs = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    from app.utils.pagination import paginate_response
    return success_response("Security events retrieved", paginate_response([
        {
            "audit_id": str(l.id),
            "actor_id": l.actor_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "ip_address": l.ip_address,
            "device_information": l.device_information,
            "created_at": l.created_at,
        }
        for l in logs
    ], total, page, per_page, "created_at"))


@router.get("/settings")
async def get_settings(user_id: str = Depends(require_role("super_admin"))):
    from app.models.platform_settings import PlatformSettings
    settings_doc = await PlatformSettings.find_one()
    if not settings_doc:
        return success_response("Platform settings retrieved", {
            "registration_enabled": True,
            "verification_required": True,
            "maintenance_mode": False,
            "max_upload_size": 10485760,
            "allowed_file_types": ["image/jpeg", "image/png", "image/gif", "application/pdf"],
        })
    return success_response("Platform settings retrieved", {
        "registration_enabled": settings_doc.registration_enabled,
        "verification_required": settings_doc.verification_required,
        "maintenance_mode": settings_doc.maintenance_mode,
        "max_upload_size": settings_doc.max_upload_size,
        "allowed_file_types": settings_doc.allowed_file_types,
    })


@router.patch("/settings")
async def update_settings(body: PlatformSettingsUpdateBody, user_id: str = Depends(require_role("super_admin"))):
    from app.models.platform_settings import PlatformSettings as PS
    settings_doc = await PS.find_one()
    if not settings_doc:
        settings_doc = PS()
    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(settings_doc, field, value)
    settings_doc.updated_at = datetime.utcnow()
    await settings_doc.save()
    result = await AdminService.update_platform_settings(update_data)
    return success_response(result["message"])


@router.get("/announcements")
async def get_announcements(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    announcement_status: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    from app.models.report import Announcement
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Announcement.find()
    if announcement_status:
        q = q.find(Announcement.status == announcement_status)
    total = await q.count()
    announcements = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    return success_response("Announcements retrieved", paginate_response([
        {
            "announcement_id": a.announcement_id,
            "title": a.title,
            "content": a.content,
            "published_by": a.published_by,
            "target_audience": a.target_audience.value if hasattr(a.target_audience, "value") else a.target_audience,
            "priority": a.priority.value if hasattr(a.priority, "value") else a.priority,
            "status": a.status.value if hasattr(a.status, "value") else a.status,
            "published_at": a.published_at,
            "expires_at": a.expires_at,
            "created_at": a.created_at,
        }
        for a in announcements
    ], total, page, per_page, "created_at"))


@router.post("/announcements", status_code=status.HTTP_201_CREATED)
async def create_announcement(body: dict, user_id: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.create_announcement(user_id, body)
    return success_response(result["message"], {"announcement_id": result.get("announcement_id")})


@router.patch("/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, body: AnnouncementUpdateBody, user_id: str = Depends(require_role("admin", "super_admin"))):
    from app.models.report import Announcement
    ann = await Announcement.find_one(Announcement.announcement_id == announcement_id)
    if not ann:
        raise NotFoundError("Announcement not found")
    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(ann, field, value)
    ann.updated_at = datetime.utcnow()
    await ann.save()
    return success_response("Announcement updated")


@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_200_OK)
async def delete_announcement(announcement_id: str, user_id: str = Depends(require_role("admin", "super_admin"))):
    from app.models.report import Announcement
    ann = await Announcement.find_one(Announcement.announcement_id == announcement_id)
    if not ann:
        raise NotFoundError("Announcement not found")
    ann.status = "archived"
    ann.updated_at = datetime.utcnow()
    await ann.save()
    return success_response("Announcement deleted")


@router.get("/categories")
async def get_categories(
    category_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    user_id: str = Depends(require_role("admin", "super_admin")),
):
    from app.models.categories import Category
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Category.find()
    if category_type:
        q = q.find(Category.category_type == category_type)
    total = await q.count()
    categories = await q.sort("display_order").skip(skip).limit(per_page).to_list()
    return success_response("Categories retrieved", paginate_response([
        {
            "category_id": c.category_id,
            "category_type": c.category_type.value if hasattr(c.category_type, "value") else c.category_type,
            "category_name": c.category_name,
            "description": c.description,
            "display_order": c.display_order,
            "status": c.status,
            "created_at": c.created_at,
        }
        for c in categories
    ], total, page, per_page, "created_at"))


@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(body: CategoryCreateBody, user_id: str = Depends(require_role("super_admin"))):
    from app.models.categories import Category
    import secrets
    category_id = secrets.token_hex(16)
    category = Category(
        category_id=category_id,
        category_type=body.category_type,
        category_name=body.category_name,
        description=body.description,
        display_order=body.display_order,
    )
    await category.insert()
    return success_response("Category created", {"category_id": category_id})


@router.patch("/categories/{category_id}")
async def update_category(category_id: str, body: CategoryUpdateBody, user_id: str = Depends(require_role("super_admin"))):
    from app.models.categories import Category
    cat = await Category.find_one(Category.category_id == category_id)
    if not cat:
        raise NotFoundError("Category not found")
    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(cat, field, value)
    cat.updated_at = datetime.utcnow()
    await cat.save()
    return success_response("Category updated")


@router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(category_id: str, user_id: str = Depends(require_role("super_admin"))):
    from app.models.categories import Category
    cat = await Category.find_one(Category.category_id == category_id)
    if not cat:
        raise NotFoundError("Category not found")
    await cat.delete()
    return success_response("Category deleted")


@router.get("/system-health")
async def get_system_health(user_id: str = Depends(require_role("admin", "super_admin"))):
    health = {"status": "healthy", "checks": {}}

    try:
        from app.core.database import get_database
        db = await get_database()
        await db.command("ping")
        health["checks"]["database"] = {"status": "healthy"}
    except Exception as e:
        health["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
        health["status"] = "degraded"

    try:
        import os
        from app.core.config import settings
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            health["checks"]["firebase"] = {"status": "configured"}
        else:
            health["checks"]["firebase"] = {"status": "not_configured"}
    except Exception as e:
        health["checks"]["firebase"] = {"status": "unhealthy", "error": str(e)}

    try:
        from app.core.config import settings
        if settings.SMTP_HOST and settings.SMTP_USERNAME:
            import socket
            sock = socket.create_connection((settings.SMTP_HOST, settings.SMTP_PORT), timeout=5)
            sock.close()
            health["checks"]["email"] = {"status": "healthy"}
        else:
            health["checks"]["email"] = {"status": "not_configured"}
    except Exception as e:
        health["checks"]["email"] = {"status": "unhealthy", "error": str(e)}

    try:
        from app.core.config import settings
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            health["checks"]["storage"] = {"status": "configured"}
        else:
            health["checks"]["storage"] = {"status": "not_configured"}
    except Exception as e:
        health["checks"]["storage"] = {"status": "unhealthy", "error": str(e)}

    return success_response("System health retrieved", health)


@router.get("/moderation/posts")
async def moderate_posts(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    post_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.post import Post
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Post.find(Post.is_deleted == False)
    if post_status:
        q = q.find(Post.status == post_status)
    if search:
        q = q.find(In(Post.id, await _search_ids(Post, ["content", "title"], search)))
    total = await q.count()
    posts = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    authors = await _user_cards([p.author_id for p in posts])
    return success_response("Posts for moderation retrieved", paginate_response([
        {
            "post_id": p.post_id,
            "author_id": p.author_id,
            "author": authors.get(p.author_id),
            "content": p.content[:200] if p.content else "",
            "post_type": p.post_type.value if hasattr(p.post_type, "value") else p.post_type,
            "status": p.status.value if hasattr(p.status, "value") else p.status,
            "reaction_count": p.reaction_count,
            "comment_count": p.comment_count,
            "share_count": p.share_count,
            "view_count": p.view_count,
            "created_at": p.created_at,
        }
        for p in posts
    ], total, page, per_page, "created_at"))


@router.delete("/moderation/posts/{post_id}")
async def delete_moderated_post(post_id: str, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.post import Post
    from datetime import timezone
    post = await Post.find_one(Post.post_id == post_id)
    if not post:
        raise NotFoundError("Post not found")
    post.is_deleted = True
    post.updated_at = datetime.now(timezone.utc)
    await post.save()
    return success_response("Post deleted")


@router.get("/moderation/comments")
async def moderate_comments(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    comment_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.comment import Comment
    from app.models.post import Post
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Comment.find(Comment.is_deleted == False)
    if comment_status:
        q = q.find(Comment.status == comment_status)
    if search:
        q = q.find(In(Comment.id, await _search_ids(Comment, ["content"], search)))
    total = await q.count()
    comments = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    authors = await _user_cards([c.author_id for c in comments])
    post_titles: dict[str, str] = {}
    post_ids = [c.post_id for c in comments if c.post_id]
    if post_ids:
        for p in await Post.find(In(Post.post_id, post_ids)).to_list():
            post_titles[p.post_id] = (p.content or "")[:80]
    return success_response("Comments for moderation retrieved", paginate_response([
        {
            "comment_id": c.comment_id,
            "author_id": c.author_id,
            "author": authors.get(c.author_id),
            "post_id": c.post_id,
            "postTitle": post_titles.get(c.post_id, ""),
            "content": c.content[:200] if c.content else "",
            "status": c.status,
            "reaction_count": c.reaction_count,
            "reply_count": c.reply_count,
            "created_at": c.created_at,
        }
        for c in comments
    ], total, page, per_page, "created_at"))


class CommentStatusBody(BaseModel):
    status: str = Field(..., description="active, hidden, removed")


@router.patch("/moderation/comments/{comment_id}")
async def set_comment_status(comment_id: str, body: CommentStatusBody, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.comment import Comment
    comment = await Comment.find_one(Comment.comment_id == comment_id)
    if not comment:
        raise NotFoundError("Comment not found")
    comment.status = body.status
    await comment.save()
    return success_response(f"Comment status updated to {body.status}")


@router.delete("/moderation/comments/{comment_id}")
async def delete_moderated_comment(comment_id: str, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.comment import Comment
    from datetime import timezone
    comment = await Comment.find_one(Comment.comment_id == comment_id)
    if not comment:
        raise NotFoundError("Comment not found")
    comment.is_deleted = True
    comment.updated_at = datetime.now(timezone.utc)
    await comment.save()
    return success_response("Comment deleted")


@router.get("/moderation/messages")
async def moderate_messages(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.message import Message
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Message.find()
    if search:
        q = q.find(In(Message.id, await _search_ids(Message, ["content"], search)))
    total = await q.count()
    messages = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    senders = await _user_cards([m.sender_id for m in messages])
    return success_response("Messages for moderation retrieved", paginate_response([
        {
            "message_id": m.message_id,
            "sender_id": m.sender_id,
            "sender": senders.get(m.sender_id),
            "conversation_id": m.conversation_id,
            "content": m.content[:200] if m.content else "",
            "message_type": m.message_type,
            "status": m.status.value if hasattr(m.status, "value") else m.status,
            "created_at": m.created_at,
        }
        for m in messages
    ], total, page, per_page, "created_at"))


class MessageStatusBody(BaseModel):
    status: str = Field(..., description="sent, delivered, read")


@router.patch("/moderation/messages/{message_id}")
async def set_message_status(message_id: str, body: MessageStatusBody, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.message import Message
    message = await Message.find_one(Message.message_id == message_id)
    if not message:
        raise NotFoundError("Message not found")
    message.status = body.status
    await message.save()
    return success_response(f"Message status updated to {body.status}")


@router.delete("/moderation/messages/{message_id}")
async def delete_moderated_message(message_id: str, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.message import Message
    message = await Message.find_one(Message.message_id == message_id)
    if not message:
        raise NotFoundError("Message not found")
    message.content = ""
    message.attachments = []
    await message.save()
    return success_response("Message content removed")


@router.get("/moderation/research")
async def moderate_research(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.research_publication import ResearchPublication
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = ResearchPublication.find()
    total = await q.count()
    publications = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    return success_response("Research publications for moderation retrieved", paginate_response([
        {
            "publication_id": p.publication_id,
            "author_id": p.author_id,
            "title": p.title,
            "status": p.status,
            "created_at": p.created_at,
        }
        for p in publications
    ], total, page, per_page, "created_at"))


@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(body: ReportCreateBody, user_id: str = Depends(get_current_user_id)):
    import secrets
    from app.models.report import Report
    report = Report(
        report_id=secrets.token_hex(16),
        reporter_id=user_id,
        resource_type=body.resource_type,
        resource_id=body.resource_id,
        reason=body.reason,
        description=body.description,
    )
    await report.insert()
    return success_response("Report created", {"report_id": report.report_id})


@router.get("/growth")
async def get_growth_stats(days: int = Query(default=30, ge=1, le=365), user_id: str = Depends(require_role("admin", "super_admin"))):
    result = await AdminService.get_growth_stats(days)
    return success_response("Growth stats retrieved", result)


# ---------------------------------------------------------------------------
# Recruitment moderation (jobs / internships / events)
# ---------------------------------------------------------------------------


@router.get("/jobs")
async def admin_list_jobs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    job_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.job import Job
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Job.find(Job.is_deleted == False)
    if job_status:
        q = q.find(Job.status == job_status)
    if search:
        q = q.find(In(Job.id, await _search_ids(Job, ["title", "description"], search)))
    total = await q.count()
    jobs = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    orgs = await _org_cards([j.organization_id for j in jobs])
    return success_response("Jobs retrieved", paginate_response([
        {
            "job_id": j.job_id,
            "title": j.title,
            "organization_id": j.organization_id,
            "organization": orgs.get(j.organization_id or ""),
            "location": j.location,
            "job_type": j.job_type.value if hasattr(j.job_type, "value") else j.job_type,
            "work_mode": j.work_mode.value if hasattr(j.work_mode, "value") else j.work_mode,
            "vacancies": j.vacancies,
            "application_count": j.application_count,
            "applicantsCount": j.application_count,
            "status": j.status.value if hasattr(j.status, "value") else j.status,
            "deadline": j.deadline,
            "created_at": j.created_at,
        }
        for j in jobs
    ], total, page, per_page, "created_at"))


class JobStatusBody(BaseModel):
    status: str = Field(..., description="draft, published, closed, expired")


@router.patch("/jobs/{job_id}")
async def admin_update_job(job_id: str, body: JobStatusBody, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.job import Job
    from datetime import timezone
    job = await Job.find_one(Job.job_id == job_id)
    if not job:
        raise NotFoundError("Job not found")
    job.status = body.status
    job.updated_at = datetime.now(timezone.utc)
    await job.save()
    return success_response(f"Job status updated to {body.status}")


@router.delete("/jobs/{job_id}")
async def admin_delete_job(job_id: str, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.job import Job
    from datetime import timezone
    job = await Job.find_one(Job.job_id == job_id)
    if not job:
        raise NotFoundError("Job not found")
    job.is_deleted = True
    job.updated_at = datetime.now(timezone.utc)
    await job.save()
    return success_response("Job deleted")


@router.get("/internships")
async def admin_list_internships(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    internship_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.internship import Internship
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Internship.find(Internship.is_deleted == False)
    if internship_status:
        q = q.find(Internship.status == internship_status)
    if search:
        q = q.find(In(Internship.id, await _search_ids(Internship, ["title", "description"], search)))
    total = await q.count()
    internships = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    orgs = await _org_cards([i.organization_id for i in internships])
    return success_response("Internships retrieved", paginate_response([
        {
            "internship_id": i.internship_id,
            "title": i.title,
            "organization_id": i.organization_id,
            "organization": orgs.get(i.organization_id or ""),
            "location": i.location,
            "duration": i.duration,
            "work_mode": i.work_mode.value if hasattr(i.work_mode, "value") else i.work_mode,
            "vacancies": i.vacancies,
            "application_count": i.application_count,
            "is_paid": i.is_paid,
            "status": i.status.value if hasattr(i.status, "value") else i.status,
            "start_date": i.start_date,
            "created_at": i.created_at,
        }
        for i in internships
    ], total, page, per_page, "created_at"))


class InternshipStatusBody(BaseModel):
    status: str = Field(..., description="draft, published, closed, expired, archived")


@router.patch("/internships/{internship_id}")
async def admin_update_internship(internship_id: str, body: InternshipStatusBody, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.internship import Internship
    from datetime import timezone
    internship = await Internship.find_one(Internship.internship_id == internship_id)
    if not internship:
        raise NotFoundError("Internship not found")
    internship.status = body.status
    internship.updated_at = datetime.now(timezone.utc)
    await internship.save()
    return success_response(f"Internship status updated to {body.status}")


@router.delete("/internships/{internship_id}")
async def admin_delete_internship(internship_id: str, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.internship import Internship
    from datetime import timezone
    internship = await Internship.find_one(Internship.internship_id == internship_id)
    if not internship:
        raise NotFoundError("Internship not found")
    internship.is_deleted = True
    internship.updated_at = datetime.now(timezone.utc)
    await internship.save()
    return success_response("Internship deleted")


@router.get("/events")
async def admin_list_events(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    event_status: str | None = Query(default=None),
    event_mode: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: str = Depends(require_role("admin", "super_admin", "moderator")),
):
    from app.models.event import Event
    from app.utils.pagination import paginate_response
    skip = (page - 1) * per_page
    q = Event.find(Event.is_deleted == False)
    if event_status:
        q = q.find(Event.status == event_status)
    if event_mode:
        q = q.find(Event.mode == event_mode)
    if search:
        q = q.find(In(Event.id, await _search_ids(Event, ["title", "description", "venue"], search)))
    total = await q.count()
    events = await q.sort("-created_at").skip(skip).limit(per_page).to_list()
    orgs = await _org_cards([e.organization_id for e in events])
    hosts = await _user_cards([e.host_id for e in events])
    return success_response("Events retrieved", paginate_response([
        {
            "event_id": e.event_id,
            "title": e.title,
            "host_id": e.host_id,
            "host": hosts.get(e.host_id),
            "organization_id": e.organization_id,
            "organization": orgs.get(e.organization_id or ""),
            "location": e.location,
            "venue": e.venue,
            "mode": e.mode.value if hasattr(e.mode, "value") else e.mode,
            "capacity": e.capacity,
            "registered_count": e.registered_count,
            "registrantsCount": e.registered_count,
            "status": e.status.value if hasattr(e.status, "value") else e.status,
            "start_datetime": e.start_datetime,
            "end_datetime": e.end_datetime,
            "created_at": e.created_at,
        }
        for e in events
    ], total, page, per_page, "created_at"))


class EventStatusBody(BaseModel):
    status: str = Field(..., description="draft, published, cancelled, completed, archived")


@router.patch("/events/{event_id}")
async def admin_update_event(event_id: str, body: EventStatusBody, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.event import Event
    from datetime import timezone
    event = await Event.find_one(Event.event_id == event_id)
    if not event:
        raise NotFoundError("Event not found")
    event.status = body.status
    event.updated_at = datetime.now(timezone.utc)
    await event.save()
    return success_response(f"Event status updated to {body.status}")


@router.delete("/events/{event_id}")
async def admin_delete_event(event_id: str, _admin: str = Depends(require_role("admin", "super_admin", "moderator"))):
    from app.models.event import Event
    from datetime import timezone
    event = await Event.find_one(Event.event_id == event_id)
    if not event:
        raise NotFoundError("Event not found")
    event.is_deleted = True
    event.updated_at = datetime.now(timezone.utc)
    await event.save()
    return success_response("Event deleted")
