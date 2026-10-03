import logging
import re
from bson import ObjectId
from datetime import datetime, timezone
from typing import Any
from app.models.user import User
from app.models.base import AccountStatus, VerificationStatus, JobStatus, InternshipStatus
from app.models.post import Post
from app.models.report import Report, AuditLog, Announcement
from app.models.connection import Connection
from app.models.job import Job
from app.models.internship import Internship
from app.models.event import Event
from app.models.mentorship import MentorshipRequest
from app.models.organization import Organization
from app.core.exceptions import NotFoundError, AuthorizationError
from app.utils.pagination import paginate_response
from app.services.notification_helper import notify_announcement, notify_verification_update
from beanie.odm.operators.find.comparison import In
from app.services.audit_helper import (
    log_verification_status_change,
    log_role_change,
    log_account_suspend,
    log_account_delete,
    log_permission_change,
    log_announcement_create,
    log_settings_update,
)

logger = logging.getLogger(__name__)


class AdminService:

    @staticmethod
    async def get_platform_stats() -> dict[str, Any]:
        total_users = await User.find().count()
        verified_users = await User.find(User.account_status == "verified").count()
        total_posts = await Post.find(Post.is_deleted == False).count()
        total_jobs = await Job.find(Job.is_deleted == False, Job.status == JobStatus.PUBLISHED).count()
        total_internships = await Internship.find(Internship.is_deleted == False, Internship.status == InternshipStatus.PUBLISHED).count()
        total_events = await Event.find(Event.is_deleted == False).count()
        total_mentorships = await MentorshipRequest.find().count()
        pending_reports = await Report.find(Report.status == "pending").count()
        pending_verifications = await User.find(
            User.verification_status == "pending",
            User.account_status != "pending_email_verification",
        ).count()
        from app.models.organization import Organization
        pending_organizations = await Organization.find(
            Organization.verification_status == "pending",
        ).count()
        return {
            "total_users": total_users,
            "verified_users": verified_users,
            "unverified_users": total_users - verified_users,
            "total_posts": total_posts,
            "total_jobs": total_jobs,
            "total_internships": total_internships,
            "total_events": total_events,
            "total_mentorships": total_mentorships,
            "pending_reports": pending_reports,
            "pending_verifications": pending_verifications,
            "pending_organizations": pending_organizations,
        }

    @staticmethod
    async def get_all_users(
        page: int = 1,
        per_page: int = 20,
        status: str | None = None,
        role: str | None = None,
        search: str | None = None,
    ) -> dict[str, Any]:
        skip = (page - 1) * per_page
        query_filters = []
        if status:
            query_filters.append(User.account_status == status)
        if role:
            query_filters.append(User.role == role)
        if search:
            pattern = re.escape(search.strip())
            matched = await User.get_motor_collection().find(
                {
                    "$or": [
                        {"first_name": {"$regex": pattern, "$options": "i"}},
                        {"last_name": {"$regex": pattern, "$options": "i"}},
                        {"email": {"$regex": pattern, "$options": "i"}},
                        {"username": {"$regex": pattern, "$options": "i"}},
                        {"user_id": {"$regex": pattern, "$options": "i"}},
                    ]
                },
                {"_id": 1},
            ).to_list(None)
            matched_ids = [row["_id"] for row in matched]
            if not matched_ids:
                return paginate_response([], 0, page, per_page, "created_at")
            query_filters.append(In(User.id, matched_ids))
        if query_filters:
            users = await User.find(*query_filters).sort("-created_at").skip(skip).limit(per_page).to_list()
            total = await User.find(*query_filters).count()
        else:
            users = await User.find().sort("-created_at").skip(skip).limit(per_page).to_list()
            total = await User.find().count()
        return paginate_response([
                {
                    "user_id": u.user_id,
                    "_id": u.user_id,
                    "username": u.username,
                    "fullName": f"{u.first_name} {u.last_name}".strip(),
                    "profile_photo": u.profile_photo,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "email": u.email,
                    "role": u.role.value if hasattr(u.role, 'value') else u.role,
                    "account_status": u.account_status.value if hasattr(u.account_status, 'value') else u.account_status,
                    "verification_status": u.verification_status.value if hasattr(u.verification_status, 'value') else u.verification_status,
                    "created_at": u.created_at,
                    "last_login": u.last_login,
                }
                for u in users
            ], total, page, per_page, "created_at")

    @staticmethod
    async def get_user_details(user_id: str) -> dict[str, Any]:
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        return {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "username": user.username,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
            "verification_status": user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status,
            "email_verified": user.email_verified,
            "profile_completion": user.profile_completion,
            "country": user.country,
            "state": user.state,
            "city": user.city,
            "followers_count": getattr(user, "followers_count", 0),
            "connections_count": getattr(user, "connections_count", 0),
            "posts_count": getattr(user, "posts_count", 0),
            "created_at": user.created_at,
            "last_login": user.last_login,
        }

    @staticmethod
    async def update_user_status(user_id: str, new_status: str) -> dict[str, str]:
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        user.account_status = new_status
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        return {"message": f"User status updated to {new_status}"}

    @staticmethod
    async def suspend_user(user_id: str, reason: str = "") -> dict[str, str]:
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        user.account_status = "suspended"
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        await log_account_suspend("admin", user_id, reason)
        return {"message": "User suspended"}

    @staticmethod
    async def delete_user(user_id: str) -> dict[str, str]:
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        user.account_status = "deleted"
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        await log_account_delete("admin", user_id)
        return {"message": "User deleted"}

    @staticmethod
    async def get_reports(page: int = 1, per_page: int = 20, status: str = "pending") -> dict[str, Any]:
        skip = (page - 1) * per_page
        reports = await Report.find(Report.status == status).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Report.find(Report.status == status).count()
        return paginate_response([
                {
                    "report_id": str(r.id),
                    "reporter_id": r.reporter_id,
                    "target_id": r.resource_id,
                    "target_type": r.resource_type,
                    "reason": r.reason,
                    "description": r.description,
                    "status": r.status.value if hasattr(r.status, "value") else r.status,
                    "reviewed_by": r.reviewed_by,
                    "resolution_action": r.resolution_action,
                    "resolution_notes": r.resolution_notes,
                    "reviewed_at": r.reviewed_at,
                    "created_at": r.created_at,
                }
                for r in reports
            ], total, page, per_page, "created_at")

    @staticmethod
    async def resolve_report(report_id: str, action: str, notes: str = "", admin_id: str = "admin") -> dict[str, str]:
        report = await Report.find_one(Report.id == ObjectId(report_id))
        if not report:
            raise NotFoundError("Report not found")
        report.status = "resolved"
        report.reviewed_by = admin_id
        report.resolution_action = action
        report.resolution_notes = notes
        report.reviewed_at = datetime.now(timezone.utc)
        await report.save()
        if action == "remove_content":
            if report.resource_type == "post":
                post = await Post.find_one(Post.post_id == report.resource_id)
                if post:
                    post.is_deleted = True
                    await post.save()
            elif report.resource_type == "comment":
                from app.models.comment import Comment
                comment = await Comment.find_one(Comment.comment_id == report.resource_id)
                if comment:
                    comment.is_deleted = True
                    await comment.save()
        elif action == "suspend":
            target_user = await User.find_one(User.user_id == report.resource_id)
            if target_user:
                target_user.account_status = "suspended"
                await target_user.save()
                await log_account_suspend(admin_id, report.resource_id, notes)
        elif action == "ban":
            target_user = await User.find_one(User.user_id == report.resource_id)
            if target_user:
                target_user.account_status = "deleted"
                await target_user.save()
                await log_account_delete(admin_id, report.resource_id)
        elif action == "warn":
            pass
        elif action == "dismiss":
            pass
        return {"message": f"Report resolved with action: {action}"}

    @staticmethod
    async def update_verification(user_id: str, status: str, notes: str = "") -> dict[str, str]:
        from app.models.verification import VerificationRequest, VerificationHistory
        if user_id and (req := await VerificationRequest.find_one(VerificationRequest.verification_id == user_id)):
            user_id = req.user_id
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        old_status = user.verification_status
        user.verification_status = status
        if status == "approved":
            user.account_status = AccountStatus.ACTIVE
        elif status == "rejected":
            user.account_status = AccountStatus.REJECTED
        elif status == "need_more_information":
            user.account_status = AccountStatus.PENDING_PROFESSIONAL_VERIFICATION
        user.updated_at = datetime.now(timezone.utc)
        if not hasattr(user, 'verification_history') or user.verification_history is None:
            user.verification_history = []
        user.verification_history.append({
            "submitted_date": None,
            "reviewed_by": "admin",
            "decision": status,
            "reason": notes,
            "remarks": "",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        })
        await user.save()

        requests = await VerificationRequest.find(VerificationRequest.user_id == user_id).to_list()
        for r in requests:
            if status in ("approved", "rejected"):
                await r.delete()
            else:
                r.status = status
                r.remarks = notes
                r.reviewed_at = datetime.now(timezone.utc)
                r.reviewed_by = "admin"
                r.history.append(VerificationHistory(status=status, reviewer="admin", timestamp=datetime.now(timezone.utc), remarks=notes))
                await r.save()

        await log_verification_status_change("admin", user_id, old_status, status)
        await notify_verification_update(user_id, status)
        return {"message": f"Verification status updated to {status}"}

    @staticmethod
    async def get_pending_verifications(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        from app.models.verification import VerificationRequest
        requests = await VerificationRequest.find(
            In(VerificationRequest.status, ["pending", "need_more_information"])
        ).sort("-submitted_at").to_list()
        items: list[dict[str, Any]] = []
        seen_user_ids: set[str] = set()
        for r in requests:
            u = await User.find_one(User.user_id == r.user_id)
            if not u:
                continue
            seen_user_ids.add(u.user_id)
            items.append({
                "_id": u.user_id,
                "user_id": u.user_id,
                "verification_id": r.verification_id,
                "fullName": f"{u.first_name} {u.last_name}".strip(),
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "verification_status": u.verification_status.value if hasattr(u.verification_status, 'value') else u.verification_status,
                "registration_number": u.registration_number,
                "license_number": u.license_number,
                "specialization": u.specialization,
                "profile_photo": u.profile_photo,
                "account_status": u.account_status.value if hasattr(u.account_status, 'value') else u.account_status,
                "created_at": u.created_at,
            })
        pending_users = await User.find(
            User.account_status == "pending_professional_verification",
            In(User.verification_status, ["pending", "under_review"]),
        ).to_list()
        for u in pending_users:
            if u.user_id in seen_user_ids:
                continue
            items.append({
                "_id": u.user_id,
                "user_id": u.user_id,
                "verification_id": None,
                "fullName": f"{u.first_name} {u.last_name}".strip(),
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "verification_status": u.verification_status.value if hasattr(u.verification_status, 'value') else u.verification_status,
                "registration_number": u.registration_number,
                "license_number": u.license_number,
                "specialization": u.specialization,
                "profile_photo": u.profile_photo,
                "account_status": u.account_status.value if hasattr(u.account_status, 'value') else u.account_status,
                "created_at": u.created_at,
            })
        items.sort(key=lambda x: x.get("created_at") or datetime.now(timezone.utc), reverse=True)
        total = len(items)
        skip = (page - 1) * per_page
        return paginate_response(items[skip:skip + per_page], total, page, per_page, "created_at")

    @staticmethod
    async def get_growth_stats(days: int = 30) -> dict[str, Any]:
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        stats = []
        for i in range(days):
            day_start = now - timedelta(days=days - i)
            day_end = day_start + timedelta(days=1)
            count = await User.find(
                User.created_at >= day_start,
                User.created_at < day_end,
            ).count()
            stats.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "new_users": count,
            })
        return {"growth": stats, "period_days": days}

    @staticmethod
    async def get_all_organizations(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        orgs = await Organization.find().sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Organization.find().count()
        return paginate_response([
                {
                    "organization_id": o.organization_id,
                    "name": o.organization_name,
                    "organization_name": o.organization_name,
                    "organization_type": o.organization_type,
                    "verification_status": o.verification_status,
                    "organization_status": o.organization_status,
                    "email": o.email,
                    "phone": o.phone,
                    "logo": o.logo,
                    "city": o.city,
                    "state": o.state,
                    "country": o.country,
                    "employee_count": o.employee_count,
                    "followers_count": o.followers_count,
                    "department_count": o.department_count,
                    "created_at": o.created_at,
                }
                for o in orgs
            ], total, page, per_page, "created_at")

    @staticmethod
    async def update_organization_status(organization_id: str, new_status: str, notes: str = "") -> dict[str, str]:
        from app.models.organization_members import OrganizationVerification
        org = await Organization.find_one(Organization.organization_id == organization_id)
        if not org:
            raise NotFoundError("Organization not found")
        org.verification_status = new_status
        if new_status == "approved":
            org.organization_status = "active"
        elif new_status == "rejected":
            org.organization_status = "inactive"
        org.updated_at = datetime.now(timezone.utc)
        await org.save()

        folder_entries = await OrganizationVerification.find(
            OrganizationVerification.organization_id == organization_id
        ).to_list()
        if new_status in ("approved", "rejected"):
            for entry in folder_entries:
                await entry.delete()
        else:
            for entry in folder_entries:
                entry.status = new_status
                entry.remarks = notes
                entry.reviewed_at = datetime.now(timezone.utc)
                entry.reviewed_by = "admin"
                entry.history.append({
                    "status": new_status,
                    "reviewer": "admin",
                    "timestamp": datetime.now(timezone.utc),
                    "remarks": notes,
                })
                await entry.save()

        owner = await User.find_one(User.user_id == org.owner_id)
        if owner:
            if new_status == "approved":
                owner.account_status = AccountStatus.ACTIVE
                owner.verification_status = "approved"
                org.organization_status = "active"
                await org.save()
            elif new_status == "rejected":
                owner.account_status = AccountStatus.REJECTED
                owner.verification_status = "rejected"
            owner.updated_at = datetime.now(timezone.utc)
            await owner.save()
        return {"message": f"Organization status updated to {new_status}"}

    @staticmethod
    async def get_audit_logs(page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        logs = await AuditLog.find().sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await AuditLog.find().count()
        return paginate_response([
                {
                    "audit_id": str(l.id),
                    "actor_id": l.actor_id,
                    "target_id": l.resource_id,
                    "action": l.action,
                    "resource": l.resource_type,
                    "ip_address": l.ip_address,
                    "device_information": l.device_information,
                    "old_value": l.old_value,
                    "new_value": l.new_value,
                    "timestamp": l.created_at,
                }
                for l in logs
            ], total, page, per_page, "created_at")

    @staticmethod
    async def update_platform_settings(settings_data: dict) -> dict[str, str]:
        await log_settings_update("admin", "platform_settings")
        return {"message": "Platform settings updated"}

    @staticmethod
    async def create_announcement(author_id: str, data: dict) -> dict[str, Any]:
        import secrets
        announcement_id = secrets.token_hex(16)
        announcement = Announcement(
            announcement_id=announcement_id,
            title=data.get("title", ""),
            content=data.get("content", ""),
            author_id=author_id,
            target_roles=data.get("target_roles", []),
        )
        await announcement.insert()
        await log_announcement_create(author_id, announcement_id)
        target_roles = data.get("target_roles", [])
        if target_roles:
            users = await User.find(
                In(User.role, target_roles),
                User.account_status == AccountStatus.ACTIVE,
            ).to_list()
            for u in users:
                await notify_announcement(u.user_id, announcement_id, data.get("title", "Announcement"))
        return {"announcement_id": announcement_id, "message": "Announcement created"}

    @staticmethod
    async def update_user_role(user_id: str, new_role: str) -> dict[str, str]:
        user = await User.find_one(User.user_id == user_id)
        if not user:
            raise NotFoundError("User not found")
        old_role = user.role
        user.role = new_role
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        await log_role_change("admin", user_id, old_role, new_role)
        return {"message": f"User role updated to {new_role}"}
