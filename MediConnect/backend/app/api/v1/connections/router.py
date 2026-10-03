from fastapi import APIRouter, Depends, Query, status
from app.schemas.connection import ConnectionRequest, FollowRequest, BlockRequest
from app.services.connection_service import ConnectionService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/connections", tags=["Connections"])


@router.post("/request")
async def send_connection_request(body: ConnectionRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.send_request(user_id, body.receiver_id)
    return success_response(result["message"])


@router.post("/accept")
async def accept_connection(body: ConnectionRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.accept_request(user_id, body.receiver_id)
    return success_response(result["message"])


@router.post("/reject")
async def reject_connection(body: ConnectionRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.reject_request(user_id, body.receiver_id)
    return success_response(result["message"])


@router.delete("/remove")
async def remove_connection(body: ConnectionRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.remove_connection(user_id, body.receiver_id)
    return success_response(result["message"])


@router.get("")
async def get_connections(user_id: str = Depends(get_current_user_id), status: str = Query(default="accepted"), page: int = Query(default=1, ge=1)):
    result = await ConnectionService.get_connections(user_id, status, page)
    return success_response("Connections retrieved", result)


@router.get("/pending")
async def get_pending_requests(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await ConnectionService.get_pending_requests(user_id, page, per_page)
    return success_response("Pending requests retrieved", result)


@router.get("/sent")
async def get_sent_requests(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await ConnectionService.get_sent_requests(user_id, page, per_page)
    return success_response("Sent requests retrieved", result)


@router.get("/status/{other_id}")
async def get_connection_status(other_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.get_status(user_id, other_id)
    return success_response("Connection status retrieved", result)


@router.get("/suggestions")
async def get_suggestions(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await ConnectionService.get_suggestions(user_id, page, per_page)
    return success_response("Suggestions retrieved", result)


@router.post("/follow")
async def follow_user(body: FollowRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.follow_user(user_id, body.following_id, body.following_type)
    return success_response(result["message"])


@router.delete("/unfollow/{following_id}")
async def unfollow_user(following_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.unfollow_user(user_id, following_id)
    return success_response(result["message"])


@router.post("/block")
async def block_user(body: BlockRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.block_user(user_id, body.blocked_id)
    return success_response(result["message"])


@router.delete("/unblock/{blocked_id}")
async def unblock_user(blocked_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.unblock_user(user_id, blocked_id)
    return success_response(result["message"])


@router.get("/followers/{user_id}")
async def get_followers(user_id: str, page: int = Query(default=1, ge=1)):
    result = await ConnectionService.get_followers(user_id, page)
    return success_response("Followers retrieved", result)


@router.get("/following/{user_id}")
async def get_following(user_id: str, page: int = Query(default=1, ge=1)):
    result = await ConnectionService.get_following(user_id, page)
    return success_response("Following retrieved", result)


@router.patch("/{connection_id}/accept")
async def accept_connection_by_id(connection_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.accept_request_by_id(connection_id, user_id)
    return success_response(result["message"])


@router.patch("/{connection_id}/reject")
async def reject_connection_by_id(connection_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.reject_request_by_id(connection_id, user_id)
    return success_response(result["message"])


@router.delete("/{connection_id}/cancel")
async def cancel_connection_request(connection_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.cancel_request_by_id(connection_id, user_id)
    return success_response(result["message"])


@router.delete("/{connection_id}")
async def delete_connection(connection_id: str, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.delete_connection(connection_id, user_id)
    return success_response(result["message"])


@router.delete("/follow")
async def unfollow_user_body(body: FollowRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.unfollow_user(user_id, body.following_id)
    return success_response(result["message"])


@router.get("/followers")
async def get_current_user_followers(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await ConnectionService.get_followers(user_id, page)
    return success_response("Followers retrieved", result)


@router.get("/following")
async def get_current_user_following(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1)):
    result = await ConnectionService.get_following(user_id, page)
    return success_response("Following retrieved", result)


@router.delete("/block")
async def unblock_user_body(body: BlockRequest, user_id: str = Depends(get_current_user_id)):
    result = await ConnectionService.unblock_user(user_id, body.blocked_id)
    return success_response(result["message"])


@router.get("/blocked-users")
async def get_blocked_users(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await ConnectionService.get_blocked_users(user_id, page, per_page)
    return success_response("Blocked users retrieved", result)
