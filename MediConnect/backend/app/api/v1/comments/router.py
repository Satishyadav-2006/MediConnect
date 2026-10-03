from fastapi import APIRouter, Depends, Query
from app.services.post_service import PostService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.get("/{comment_id}")
async def get_comment(comment_id: str):
    return success_response("Comment retrieved")


@router.patch("/{comment_id}")
async def update_comment(comment_id: str, user_id: str = Depends(get_current_user_id)):
    return success_response("Use PATCH /posts/comments/{comment_id}")


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, user_id: str = Depends(get_current_user_id)):
    return success_response("Use DELETE /posts/comments/{comment_id}")
