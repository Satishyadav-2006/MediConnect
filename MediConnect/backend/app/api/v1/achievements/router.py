from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response
from app.services.achievement_service import AchievementService

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("")
async def list_all_achievements(user_id: str = Depends(get_current_user_id)):
    result = await AchievementService.get_user_achievements_with_all(user_id)
    return success_response("Achievements retrieved", result)


@router.get("/user/{target_user_id}")
async def get_user_achievements(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await AchievementService.get_user_achievements(target_user_id)
    return success_response("User achievements retrieved", result)


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    result = await AchievementService.get_leaderboard(limit)
    return success_response("Leaderboard retrieved", result)
