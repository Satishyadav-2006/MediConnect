from fastapi import APIRouter, Depends, Query
from app.services.connection_service import ConnectionService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/followers", tags=["Followers"])


@router.get("")
async def get_followers(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await ConnectionService.get_followers(user_id, page)
    return success_response("Followers retrieved", result)
