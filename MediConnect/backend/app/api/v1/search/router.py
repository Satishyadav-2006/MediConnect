from fastapi import APIRouter, Depends, Query, Body
from app.services.search_service import SearchService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
async def search(
    q: str = Query(default=""),
    query: str | None = Query(default=None),
    type: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    location: str | None = Query(default=None),
    work_mode: str | None = Query(default=None),
    job_type: str | None = Query(default=None),
    experience_level: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    organization_id: str | None = Query(default=None),
    role: str | None = Query(default=None),
    country: str | None = Query(default=None),
    verified_only: bool | None = Query(default=None),
    availability: str | None = Query(default=None),
    is_free: bool | None = Query(default=None),
    mode: str | None = Query(default=None),
    research_area: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    filters = {
        "location": location,
        "work_mode": work_mode,
        "job_type": job_type,
        "experience_level": experience_level,
        "event_type": event_type,
        "organization_id": organization_id,
        "role": role,
        "country": country,
        "verified_only": verified_only,
        "availability": availability,
        "is_free": is_free,
        "mode": mode,
        "research_area": research_area,
        "date_from": date_from,
        "date_to": date_to,
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    term = q or query or ""
    results = await SearchService.search(term, type, page, per_page, **filters)
    await SearchService.record_search(user_id, term)
    return success_response("Search results", results)


@router.get("/people")
async def search_people(
    query: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    results = await SearchService._search_users(query, {}, page, per_page)
    return success_response("People search results", results)


@router.get("/organizations")
async def search_organizations(
    query: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    results = await SearchService._search_organizations(query, {}, page, per_page)
    return success_response("Organization search results", results)


@router.get("/posts")
async def search_posts(
    query: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    results = await SearchService._search_posts(query, {}, page, per_page)
    return success_response("Post search results", results)


@router.get("/autocomplete")
async def autocomplete(query: str = Query(default=""), user_id: str = Depends(get_current_user_id)):
    result = await SearchService.get_autocomplete(query)
    return success_response("Autocomplete results", result)


@router.get("/trending")
async def trending(user_id: str = Depends(get_current_user_id)):
    result = await SearchService.get_trending()
    return success_response("Trending", result)


@router.get("/recent")
async def recent_searches(user_id: str = Depends(get_current_user_id)):
    searches = await SearchService.get_recent_searches(user_id)
    return success_response("Recent searches", {"searches": searches})


@router.post("/recent")
async def add_recent_search(
    body: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    query = body.get("query", "")
    if query:
        await SearchService.record_search(user_id, query)
    return success_response("Search recorded")


@router.delete("/recent")
async def clear_recent_searches(user_id: str = Depends(get_current_user_id)):
    await SearchService.clear_recent_searches(user_id)
    return success_response("Recent searches cleared")


@router.get("/recommendations")
async def recommendations(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    result = await SearchService.get_recommendations(user_id, page, per_page)
    return success_response("Recommendations", result)


@router.get("/suggestions")
async def search_suggestions(
    q: str = Query(default="", min_length=1),
    user_id: str = Depends(get_current_user_id),
):
    result = await SearchService.get_suggestions(q)
    return success_response("Suggestions", result)


@router.get("/jobs")
async def search_jobs(
    q: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    location: str | None = Query(default=None),
    work_mode: str | None = Query(default=None),
    job_type: str | None = Query(default=None),
    experience_level: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    filters = {k: v for k, v in {"location": location, "work_mode": work_mode, "job_type": job_type, "experience_level": experience_level}.items() if v is not None}
    results = await SearchService.search(q, "job", page, per_page, **filters)
    return success_response("Job search results", results)


@router.get("/internships")
async def search_internships(
    q: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    location: str | None = Query(default=None),
    work_mode: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    filters = {k: v for k, v in {"location": location, "work_mode": work_mode}.items() if v is not None}
    results = await SearchService.search(q, "internship", page, per_page, **filters)
    return success_response("Internship search results", results)


@router.get("/events")
async def search_events(
    q: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    event_type: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    filters = {k: v for k, v in {"event_type": event_type, "date_from": date_from, "date_to": date_to}.items() if v is not None}
    results = await SearchService.search(q, "event", page, per_page, **filters)
    return success_response("Event search results", results)


@router.get("/mentors")
async def search_mentors(
    q: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    role: str | None = Query(default=None),
    availability: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    filters = {k: v for k, v in {"role": role, "availability": availability}.items() if v is not None}
    results = await SearchService.search(q, "mentor", page, per_page, **filters)
    return success_response("Mentor search results", results)
