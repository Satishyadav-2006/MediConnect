import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Any
from collections import Counter

from beanie.odm.operators.find.comparison import In

from app.models.user import User
from app.models.post import Post
from app.models.job import Job
from app.models.internship import Internship
from app.models.event import Event
from app.models.organization import Organization
from app.models.connection import Connection, ConnectionStatus
from app.models.base import (
    JobStatus,
    InternshipStatus,
    EventStatus,
    VerificationStatus,
)
from app.core.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

_search_history: dict[str, list[dict[str, Any]]] = {}

MAX_RECENT = 20

_CATEGORY_ALIASES: dict[str, tuple[str, ...]] = {
    "all": ("users", "organizations", "jobs", "internships", "events", "posts"),
    "people": ("users",),
    "users": ("users",),
    "organizations": ("organizations",),
    "jobs": ("jobs",),
    "job": ("jobs",),
    "internships": ("internships",),
    "internship": ("internships",),
    "events": ("events",),
    "event": ("events",),
    "posts": ("posts",),
    "post": ("posts",),
}


def _enum_value(v):
    return v.value if hasattr(v, "value") else v


def _iso(dt):
    return dt.isoformat() if dt else None


def _fallback_org(org_id):
    return {
        "_id": org_id,
        "name": "MediConnect Organization",
        "slug": org_id,
        "type": "other",
        "logo": None,
        "coverPhoto": None,
        "description": "",
        "website": "",
        "email": "",
        "phone": "",
        "location": "",
        "country": "",
        "state": "",
        "city": "",
        "employeesCount": 0,
        "followersCount": 0,
        "isVerified": False,
        "foundedYear": None,
        "specializations": [],
        "createdAt": None,
    }


def _org_dict(o) -> dict[str, Any]:
    if not o:
        return _fallback_org(None)
    return {
        "_id": o.organization_id,
        "name": o.organization_name,
        "slug": o.organization_id,
        "type": o.organization_type or "other",
        "logo": o.logo,
        "coverPhoto": o.banner,
        "description": o.description,
        "website": o.website or (o.social_links.website if o.social_links else ""),
        "email": o.email,
        "phone": o.phone,
        "location": f"{o.city}, {o.country}".strip(", "),
        "country": o.country,
        "state": o.state,
        "city": o.city,
        "employeesCount": o.employee_count,
        "followersCount": o.followers_count,
        "isVerified": o.verification_status == VerificationStatus.APPROVED,
        "foundedYear": o.founded_year,
        "specializations": [],
        "createdAt": _iso(o.created_at),
    }


def _user_dict(u, connection_count: int = 0) -> dict[str, Any]:
    return {
        "_id": u.user_id,
        "user_id": u.user_id,
        "email": u.email,
        "fullName": f"{u.first_name} {u.last_name}".strip(),
        "username": u.username,
        "role": _enum_value(u.role),
        "accountStatus": _enum_value(u.account_status),
        "profilePhoto": u.profile_photo,
        "coverPhoto": u.cover_photo,
        "headline": u.headline,
        "bio": u.bio,
        "location": u.city or u.country or "",
        "country": u.country,
        "state": u.state,
        "city": u.city,
        "specialization": u.specialization,
        "skills": [s.skill_name for s in (u.skills or []) if s.skill_name],
        "languages": [l.language for l in (u.languages or []) if l.language],
        "isEmailVerified": bool(u.email_verified),
        "isProfileComplete": bool(u.profile_completion and u.profile_completion >= 100),
        "verificationStatus": _enum_value(u.verification_status),
        "connectionsCount": connection_count,
        "followersCount": 0,
        "followingCount": 0,
        "postsCount": 0,
        "createdAt": _iso(u.created_at),
        "updatedAt": _iso(u.updated_at),
    }


def _job_dict(j, org) -> dict[str, Any]:
    salary = j.salary
    benefits = [
        b.get("name") if isinstance(b, dict) else str(b)
        for b in (j.benefits or [])
    ]
    return {
        "_id": j.job_id,
        "organization": _org_dict(org) if org else _fallback_org(j.organization_id or j.recruiter_id),
        "title": j.title,
        "description": j.description,
        "requirements": j.requirements or [],
        "responsibilities": j.responsibilities or [],
        "employmentType": _enum_value(j.employment_type),
        "experienceLevel": _enum_value(j.experience_level),
        "salaryMin": salary.minimum_salary if salary else 0,
        "salaryMax": salary.maximum_salary if salary else 0,
        "currency": salary.currency if salary else "USD",
        "isRemote": _enum_value(j.work_mode) == "remote",
        "location": j.location,
        "country": "",
        "state": "",
        "city": "",
        "skills": j.skills or [],
        "benefits": benefits,
        "applicationDeadline": _iso(j.deadline),
        "applicantsCount": j.application_count,
        "isSaved": False,
        "hasApplied": False,
        "status": "active" if j.status == JobStatus.PUBLISHED else _enum_value(j.status),
        "createdAt": _iso(j.created_at),
        "updatedAt": _iso(j.updated_at),
    }


def _internship_dict(i, org) -> dict[str, Any]:
    stipend = i.stipend
    paid = bool(stipend and stipend.minimum_stipend)
    return {
        "_id": i.internship_id,
        "organization": _org_dict(org) if org else _fallback_org(i.organization_id),
        "title": i.title,
        "description": i.description,
        "requirements": [],
        "type": "paid" if paid else "unpaid",
        "stipend": stipend.minimum_stipend if stipend else 0,
        "currency": stipend.currency if stipend else "INR",
        "duration": f"{i.duration} weeks" if i.duration else "",
        "startDate": _iso(i.start_date),
        "isRemote": _enum_value(i.work_mode) == "remote",
        "location": i.location,
        "skills": i.skills or [],
        "applicationDeadline": _iso(i.deadline),
        "applicantsCount": i.application_count,
        "isSaved": False,
        "hasApplied": False,
        "status": "active" if i.status == InternshipStatus.PUBLISHED else _enum_value(i.status),
        "createdAt": _iso(i.created_at),
    }


def _map_event_mode(mode: str) -> str:
    return {"offline": "in_person", "online": "online", "hybrid": "hybrid"}.get(mode, "in_person")


def _map_event_status(status: str) -> str:
    return {
        "published": "upcoming",
        "draft": "draft",
        "completed": "completed",
        "cancelled": "cancelled",
        "archived": "archived",
    }.get(status, status)


def _event_dict(e, organizer) -> dict[str, Any]:
    return {
        "_id": e.event_id,
        "organizer": organizer,
        "organizerType": "Organization" if e.organization_id else "User",
        "title": e.title,
        "description": e.description,
        "mode": _map_event_mode(_enum_value(e.mode)),
        "startDate": _iso(e.start_datetime),
        "endDate": _iso(e.end_datetime),
        "location": e.venue,
        "onlineLink": e.meeting_link,
        "maxAttendees": e.capacity or None,
        "attendeesCount": e.registered_count,
        "speakers": [],
        "agenda": [],
        "certificateInfo": {"enabled": bool(e.certificate_available)},
        "banner": None,
        "tags": [],
        "isRegistered": False,
        "isSaved": False,
        "status": _map_event_status(_enum_value(e.status)),
        "createdAt": _iso(e.created_at),
    }


def _post_dict(p: dict[str, Any]) -> dict[str, Any]:
    media = p.get("media") or []
    return {
        "_id": p.get("post_id") or p.get("_id"),
        "post_id": p.get("post_id") or p.get("_id"),
        "author": p.get("author") or {},
        "authorType": p.get("author_type") or "User",
        "content": p.get("content") or "",
        "visibility": p.get("visibility") or "public",
        "type": p.get("post_type") or "text",
        "images": [m.get("cloudinary_url") for m in media if m.get("cloudinary_url")],
        "video": None,
        "document": None,
        "poll": None,
        "research": None,
        "tags": p.get("hashtags") or [],
        "mentions": p.get("mentions") or [],
        "hashtags": p.get("hashtags") or [],
        "likesCount": p.get("reaction_count") or 0,
        "commentsCount": p.get("comment_count") or 0,
        "sharesCount": p.get("share_count") or 0,
        "isLiked": False,
        "isSaved": False,
        "createdAt": p.get("created_at"),
        "updatedAt": p.get("updated_at"),
    }


class SearchService:

    @staticmethod
    async def search(
        query: str,
        search_type: str = "all",
        page: int = 1,
        per_page: int = 20,
        **filters,
    ) -> dict[str, Any]:
        results: dict[str, Any] = {}
        categories = _CATEGORY_ALIASES.get(search_type, ())

        for cat in categories:
            if cat == "users":
                results["users"] = await SearchService._search_users(query, filters, page, per_page)
            elif cat == "organizations":
                results["organizations"] = await SearchService._search_organizations(query, filters, page, per_page)
            elif cat == "jobs":
                results["jobs"] = await SearchService._search_jobs(query, filters, page, per_page)
            elif cat == "internships":
                results["internships"] = await SearchService._search_internships(query, filters, page, per_page)
            elif cat == "events":
                results["events"] = await SearchService._search_events(query, filters, page, per_page)
            elif cat == "posts":
                results["posts"] = await SearchService._search_posts(query, filters, page, per_page)

        return results

    @staticmethod
    async def _search_users(query: str, filters: dict, page: int, per_page: int) -> list[dict[str, Any]]:
        q = User.find(User.is_deleted != True)
        if query:
            q = q.find(
                {"$or": [
                    {"first_name": {"$regex": query, "$options": "i"}},
                    {"last_name": {"$regex": query, "$options": "i"}},
                    {"username": {"$regex": query, "$options": "i"}},
                    {"headline": {"$regex": query, "$options": "i"}},
                    {"skills": {"$elemMatch": {"skill_name": {"$regex": query, "$options": "i"}}}},
                    {"specialization": {"$regex": query, "$options": "i"}},
                ]}
            )
        if filters.get("role"):
            q = q.find(User.role == filters["role"])
        if filters.get("country"):
            q = q.find(User.country == filters["country"])
        if filters.get("city"):
            q = q.find(User.city == filters["city"])
        if filters.get("specialization"):
            q = q.find({"specialization": {"$regex": filters["specialization"], "$options": "i"}})
        if filters.get("verified_only"):
            q = q.find(User.verification_status == VerificationStatus.APPROVED)
        if filters.get("availability"):
            q = q.find({"availability": filters["availability"]})
        if filters.get("organization_id"):
            q = q.find(User.organization_id == filters["organization_id"])
        if filters.get("research_area"):
            q = q.find({"research_publications": {"$elemMatch": {"research_area": {"$regex": filters["research_area"], "$options": "i"}}}})

        skip = (page - 1) * per_page
        users = await q.sort("-created_at").skip(skip).limit(per_page).to_list()

        counts = await SearchService._connection_counts([u.user_id for u in users])
        return [_user_dict(u, counts.get(u.user_id, 0)) for u in users]

    @staticmethod
    async def _connection_counts(user_ids: list[str]) -> dict[str, int]:
        if not user_ids:
            return {}
        conns = await Connection.find(
            {
                "status": ConnectionStatus.ACCEPTED.value,
                "$or": [
                    {"sender_id": {"$in": user_ids}},
                    {"receiver_id": {"$in": user_ids}},
                ],
            }
        ).to_list()
        counts: dict[str, int] = {}
        for c in conns:
            counts[c.sender_id] = counts.get(c.sender_id, 0) + 1
            counts[c.receiver_id] = counts.get(c.receiver_id, 0) + 1
        return counts

    @staticmethod
    async def _search_jobs(query: str, filters: dict, page: int, per_page: int) -> list[dict[str, Any]]:
        q = Job.find(Job.is_deleted == False, Job.status == JobStatus.PUBLISHED)
        if query:
            q = q.find(
                {"$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"department": {"$regex": query, "$options": "i"}},
                    {"location": {"$regex": query, "$options": "i"}},
                    {"skills": {"$in": [re.compile(query, re.IGNORECASE)]}},
                ]}
            )
        if filters.get("location"):
            q = q.find(Job.location == {"$regex": filters["location"], "$options": "i"})
        if filters.get("work_mode"):
            q = q.find(Job.work_mode == filters["work_mode"])
        if filters.get("job_type"):
            q = q.find(Job.employment_type == filters["job_type"])
        if filters.get("experience_level"):
            pass
        if filters.get("organization_id"):
            q = q.find(Job.organization_id == filters["organization_id"])
        if filters.get("date_from"):
            try:
                date_val = datetime.fromisoformat(filters["date_from"])
                q = q.find(Job.created_at >= date_val)
            except (ValueError, TypeError):
                pass
        if filters.get("date_to"):
            try:
                date_val = datetime.fromisoformat(filters["date_to"])
                q = q.find(Job.created_at <= date_val)
            except (ValueError, TypeError):
                pass

        skip = (page - 1) * per_page
        jobs = await q.sort("-created_at").skip(skip).limit(per_page).to_list()

        org_map = await SearchService._organizations_for([j.organization_id for j in jobs if j.organization_id])
        return [_job_dict(j, org_map.get(j.organization_id)) for j in jobs]

    @staticmethod
    async def _organizations_for(org_ids: list[str]) -> dict[str, Any]:
        if not org_ids:
            return {}
        orgs = await Organization.find(In(Organization.organization_id, org_ids)).to_list()
        return {o.organization_id: o for o in orgs}

    @staticmethod
    async def _search_internships(query: str, filters: dict, page: int, per_page: int) -> list[dict[str, Any]]:
        q = Internship.find(Internship.is_deleted == False, Internship.status == InternshipStatus.PUBLISHED)
        if query:
            q = q.find(
                {"$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"department": {"$regex": query, "$options": "i"}},
                    {"location": {"$regex": query, "$options": "i"}},
                ]}
            )
        if filters.get("location"):
            q = q.find(Internship.location == {"$regex": filters["location"], "$options": "i"})

        skip = (page - 1) * per_page
        items = await q.sort("-created_at").skip(skip).limit(per_page).to_list()

        org_map = await SearchService._organizations_for([i.organization_id for i in items if i.organization_id])
        return [_internship_dict(i, org_map.get(i.organization_id)) for i in items]

    @staticmethod
    async def _search_events(query: str, filters: dict, page: int, per_page: int) -> list[dict[str, Any]]:
        q = Event.find(Event.is_deleted == False, Event.status == EventStatus.PUBLISHED)
        if query:
            q = q.find(
                {"$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"category": {"$regex": query, "$options": "i"}},
                    {"venue": {"$regex": query, "$options": "i"}},
                ]}
            )
        if filters.get("event_type"):
            q = q.find(Event.category == filters["event_type"])
        if filters.get("mode"):
            q = q.find(Event.mode == filters["mode"])
        if filters.get("is_free") is not None:
            q = q.find(Event.is_free == filters["is_free"])
        if filters.get("date_from"):
            try:
                date_val = datetime.fromisoformat(filters["date_from"])
                q = q.find(Event.start_datetime >= date_val)
            except (ValueError, TypeError):
                pass
        if filters.get("date_to"):
            try:
                date_val = datetime.fromisoformat(filters["date_to"])
                q = q.find(Event.start_datetime <= date_val)
            except (ValueError, TypeError):
                pass

        skip = (page - 1) * per_page
        events = await q.sort("-start_datetime").skip(skip).limit(per_page).to_list()

        org_map = await SearchService._organizations_for([e.organization_id for e in events if e.organization_id])
        org_events = [e for e in events if e.organization_id]
        host_ids = [e.host_id for e in events if not e.organization_id and e.host_id]
        host_map = {}
        if host_ids:
            hosts = await User.find(In(User.user_id, host_ids)).to_list()
            host_map = {u.user_id: u for u in hosts}

        items = []
        for e in events:
            if e.organization_id:
                org = org_map.get(e.organization_id)
                organizer = _org_dict(org) if org else _fallback_org(e.organization_id)
            else:
                host = host_map.get(e.host_id)
                organizer = _user_dict(host) if host else _user_dict(None)
            items.append(_event_dict(e, organizer))
        return items

    @staticmethod
    async def _search_organizations(query: str, filters: dict, page: int, per_page: int) -> list[dict[str, Any]]:
        q = Organization.find(Organization.is_deleted == False, Organization.organization_status == "active")
        if query:
            q = q.find(
                {"$or": [
                    {"organization_name": {"$regex": query, "$options": "i"}},
                    {"organization_type": {"$regex": query, "$options": "i"}},
                    {"city": {"$regex": query, "$options": "i"}},
                ]}
            )
        if filters.get("organization_type"):
            q = q.find(Organization.organization_type == filters["organization_type"])
        if filters.get("country"):
            q = q.find(Organization.country == filters["country"])

        skip = (page - 1) * per_page
        orgs = await q.sort("organization_name").skip(skip).limit(per_page).to_list()

        return [_org_dict(o) for o in orgs]

    @staticmethod
    async def _search_posts(query: str, filters: dict, page: int, per_page: int) -> list[dict[str, Any]]:
        from app.repositories.post_repository import PostRepository
        from app.services.post_service import PostService
        posts, _total = await PostRepository.search_posts(query, None, None, page, per_page)
        raw = await PostService._with_authors(posts)
        return [_post_dict(p) for p in raw]

    @staticmethod
    async def get_autocomplete(query: str) -> list[dict[str, Any]]:
        if not query:
            return []
        q = query.strip()
        users = await User.find({"$or": [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"username": {"$regex": q, "$options": "i"}},
        ]}).limit(8).to_list()
        jobs = await Job.find(
            Job.is_deleted == False, Job.status == JobStatus.PUBLISHED,
            {"$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"department": {"$regex": q, "$options": "i"}},
                {"location": {"$regex": q, "$options": "i"}},
            ]},
        ).limit(8).to_list()
        orgs = await Organization.find(Organization.is_deleted == False, {"organization_name": {"$regex": q, "$options": "i"}}).limit(8).to_list()

        items: list[dict[str, Any]] = []
        for u in users:
            items.append({"text": f"{u.first_name} {u.last_name}".strip(), "type": "People"})
        for j in jobs:
            items.append({"text": j.title, "type": "Jobs"})
        for o in orgs:
            items.append({"text": o.organization_name, "type": "Organizations"})
        return items

    @staticmethod
    async def record_search(user_id: str, query: str) -> None:
        if user_id not in _search_history:
            _search_history[user_id] = []
        _search_history[user_id].insert(0, {
            "query": query,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        _search_history[user_id] = _search_history[user_id][:MAX_RECENT]

    @staticmethod
    async def get_recent_searches(user_id: str) -> list[dict[str, Any]]:
        return _search_history.get(user_id, [])

    @staticmethod
    async def clear_recent_searches(user_id: str) -> None:
        _search_history.pop(user_id, None)

    @staticmethod
    async def get_trending() -> list[dict[str, Any]]:
        cached = await cache_get("search:trending:v2")
        if cached:
            return cached

        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        posts = await Post.find(
            Post.is_deleted == False, Post.visibility == "public",
            Post.created_at >= week_ago,
        ).sort("-reaction_count").limit(10).to_list()

        jobs = await Job.find(
            Job.is_deleted == False, Job.status == JobStatus.PUBLISHED,
            Job.created_at >= week_ago,
        ).sort("-application_count").limit(5).to_list()

        events = await Event.find(
            Event.is_deleted == False, Event.status == EventStatus.PUBLISHED,
        ).sort("-registered_count").limit(5).to_list()

        all_tags: list[str] = []
        for p in posts:
            all_tags.extend(getattr(p, "tags", []) or [])
        for j in jobs:
            all_tags.extend(getattr(j, "skills", []) or [])
        for e in events:
            all_tags.extend(getattr(e, "category", None) and [e.category] or [])

        items: list[dict[str, Any]] = []
        for tag, count in Counter(all_tags).most_common(15):
            items.append({"text": f"#{tag}", "count": count})
        for j in jobs:
            items.append({"text": j.title, "count": j.application_count})
        for e in events:
            items.append({"text": e.title, "count": e.registered_count})
        for p in posts:
            hashtags = getattr(p, "hashtags", None) or []
            if hashtags:
                items.append({"text": f"#{hashtags[0]}", "count": p.reaction_count})

        items.sort(key=lambda x: x["count"], reverse=True)
        items = items[:12]

        await cache_set("search:trending:v2", items, ttl=300)
        return items

    @staticmethod
    async def get_recommendations(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        user = await User.find_one(User.user_id == user_id)
        if not user:
            return {"jobs": [], "events": [], "mentors": []}

        recommended_jobs = []
        if user.specialization or user.skills:
            skills = [s.skill_name for s in (user.skills or []) if s.skill_name]
            job_q = Job.find(Job.is_deleted == False, Job.status == JobStatus.PUBLISHED)
            if skills:
                job_q = job_q.find({"skills": {"$in": skills}})
            recommended_jobs = await job_q.sort("-created_at").limit(per_page).to_list()

        recommended_events = await Event.find(
            Event.is_deleted == False,
            Event.status == EventStatus.PUBLISHED,
        ).sort("-registered_count").limit(per_page).to_list()

        return {
            "jobs": [_job_dict(j, None) for j in recommended_jobs],
            "events": [_event_dict(e, None) for e in recommended_events],
            "mentors": [],
        }

    @staticmethod
    async def get_suggestions(q: str) -> dict[str, Any]:
        q = q.strip()
        if not q:
            return {"suggestions": []}
        users = await User.find({"$or": [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"username": {"$regex": q, "$options": "i"}},
        ]}).limit(5).to_list()
        jobs = await Job.find(
            Job.is_deleted == False, Job.status == JobStatus.PUBLISHED,
            {"title": {"$regex": q, "$options": "i"}},
        ).limit(5).to_list()
        suggestions: list[dict[str, Any]] = []
        for u in users:
            suggestions.append({"text": f"{u.first_name} {u.last_name}".strip(), "type": "People"})
        for j in jobs:
            suggestions.append({"text": j.title, "type": "Jobs"})
        return {"suggestions": suggestions}
