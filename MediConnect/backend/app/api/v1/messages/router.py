from fastapi import APIRouter, Depends, Query, status
from app.schemas.messaging import (
    MessageCreateRequest,
    MessageUpdateRequest,
    ConversationCreateRequest,
)
from app.services.message_service import MessageService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response, NotFoundError

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def send_message(body: MessageCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await MessageService.send_message(user_id, body)
    return success_response("Message sent", result)


@router.get("/conversations")
async def get_conversations(user_id: str = Depends(get_current_user_id), page: int = Query(default=1, ge=1), per_page: int = Query(default=20, ge=1, le=100)):
    result = await MessageService.get_conversations(user_id, page, per_page)
    return success_response("Conversations retrieved", result)


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def create_conversation(body: ConversationCreateRequest, user_id: str = Depends(get_current_user_id)):
    result = await MessageService.create_conversation(user_id, body)
    return success_response("Conversation created", result)


@router.get("/search")
async def search_messages(
    q: str = Query(..., min_length=1),
    conversation_id: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await MessageService.search_messages(user_id, q, conversation_id, page, per_page)
    return success_response("Search results", result)


@router.post("/{conversation_id}", status_code=status.HTTP_201_CREATED)
async def send_message_to_conversation(
    conversation_id: str,
    body: dict,
    user_id: str = Depends(get_current_user_id),
):
    content = (body or {}).get("content", "")
    if not content:
        raise NotFoundError("content is required")
    data = MessageCreateRequest(
        conversation_id=conversation_id,
        content=content,
        message_type=(body or {}).get("type") or "text",
        reply_to=(body or {}).get("replyTo"),
        mentions=(body or {}).get("mentions") or [],
    )
    result = await MessageService.send_message(user_id, data)
    return success_response("Message sent", result)


@router.get("/{conversation_id}")
async def get_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
):
    result = await MessageService.get_messages(conversation_id, user_id, page, per_page)
    return success_response("Messages retrieved", result)


@router.put("/{conversation_id}/read")
async def mark_as_read(conversation_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MessageService.mark_as_read(conversation_id, user_id)
    return success_response(result["message"])


@router.get("/{conversation_id}/pinned")
async def get_pinned_messages(conversation_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MessageService.get_pinned_messages(conversation_id, user_id)
    return success_response("Pinned messages retrieved", result)


@router.get("/{conversation_id}/shared-files")
async def get_shared_files(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await MessageService.get_shared_files(conversation_id, user_id, page, per_page)
    return success_response("Shared files retrieved", result)


@router.get("/{conversation_id}/search")
async def search_in_conversation(
    conversation_id: str,
    query: str = Query(..., min_length=1),
    user_id: str = Depends(get_current_user_id),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    result = await MessageService.search_messages(user_id, query, conversation_id, page, per_page)
    return success_response("Search results", result)


@router.put("/message/{message_id}")
async def edit_message(
    message_id: str,
    body: MessageUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await MessageService.edit_message(message_id, user_id, body)
    return success_response(result["message"])


@router.delete("/message/{message_id}")
async def delete_message(
    message_id: str,
    forEveryone: str = Query(default="true"),
    user_id: str = Depends(get_current_user_id),
):
    mode = "everyone" if forEveryone in ("true", "1", "True") else "me"
    result = await MessageService.delete_message(message_id, user_id, mode)
    return success_response(result["message"])


@router.post("/message/{message_id}/pin")
async def pin_message(message_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MessageService.pin_message(message_id, user_id)
    return success_response(result["message"])


@router.delete("/message/{message_id}/pin")
async def unpin_message(message_id: str, user_id: str = Depends(get_current_user_id)):
    result = await MessageService.unpin_message(message_id, user_id)
    return success_response(result["message"])


@router.post("/message/{message_id}/react")
async def react_to_message(message_id: str, body: dict, user_id: str = Depends(get_current_user_id)):
    emoji = (body or {}).get("emoji")
    if not emoji:
        raise NotFoundError("emoji is required")
    result = await MessageService.react_to_message(message_id, user_id, emoji)
    return success_response(result["message"])


@router.delete("/message/{message_id}/react")
async def remove_message_reaction(
    message_id: str,
    emoji: str = Query(default=""),
    user_id: str = Depends(get_current_user_id),
):
    result = await MessageService.remove_reaction(message_id, user_id, emoji)
    return success_response(result["message"])


@router.post("/message/{message_id}/forward")
async def forward_message(message_id: str, body: dict, user_id: str = Depends(get_current_user_id)):
    target = (body or {}).get("conversationId") or (body or {}).get("conversation_id")
    if not target:
        raise NotFoundError("conversationId is required")
    result = await MessageService.forward_message(message_id, user_id, target)
    return success_response(result["message"])