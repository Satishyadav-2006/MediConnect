from fastapi import APIRouter, Depends, Query
from app.services.analytics_service import AnalyticsService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    result = await AnalyticsService.get_dashboard_stats()
    return success_response("Dashboard stats retrieved", result)


@router.get("/users/{target_user_id}")
async def get_user_analytics(target_user_id: str, user_id: str = Depends(get_current_user_id)):
    result = await AnalyticsService.get_user_analytics(target_user_id)
    return success_response("User analytics retrieved", result)


@router.get("/profile")
async def get_profile_analytics(user_id: str = Depends(get_current_user_id), period: str | None = Query(default=None)):
    result = await AnalyticsService.get_profile_analytics(user_id, period)
    return success_response("Profile analytics retrieved", result)


@router.get("/posts")
async def get_post_analytics(user_id: str = Depends(get_current_user_id), period: str | None = Query(default=None)):
    result = await AnalyticsService.get_post_analytics(user_id)
    return success_response("Post analytics retrieved", result)


@router.get("/connections")
async def get_connection_analytics(user_id: str = Depends(get_current_user_id), period: str | None = Query(default=None)):
    result = await AnalyticsService.get_connection_analytics(user_id)
    return success_response("Connection analytics retrieved", result)


@router.get("/search")
async def get_search_analytics(user_id: str = Depends(get_current_user_id), period: str | None = Query(default=None)):
    result = await AnalyticsService.get_search_appearances(user_id)
    return success_response("Search analytics retrieved", result)


@router.get("/content")
async def get_content_analytics(user_id: str = Depends(get_current_user_id)):
    result = await AnalyticsService.get_content_analytics()
    return success_response("Content analytics retrieved", result)


@router.get("/engagement")
async def get_engagement_stats(user_id: str = Depends(get_current_user_id)):
    result = await AnalyticsService.get_engagement_stats()
    return success_response("Engagement stats retrieved", result)
