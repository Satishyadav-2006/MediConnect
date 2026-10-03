from fastapi import APIRouter, Depends, Query
from app.services.post_service import PostService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("")
async def get_feed(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await PostService.get_feed(user_id, page)
    return success_response("Feed retrieved", result)


@router.get("/ranked")
async def get_feed_ranked(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await PostService.get_feed_ranked(user_id, page)
    return success_response("Ranked feed retrieved", result)
