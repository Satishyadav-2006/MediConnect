from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager
from app.core.security import decode_access_token
from app.services.message_service import MessageService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])


def _authenticate_ws(websocket: WebSocket) -> str | None:
    token = websocket.query_params.get("token")
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return payload.get("sub")


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    user_id = _authenticate_ws(websocket)
    if not user_id:
        await websocket.close(code=4003, reason="Authentication failed")
        return
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "")
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif event_type == "typing":
                conv_id = data.get("conversation_id", "")
                participants = data.get("participants", [])
                for pid in participants:
                    if pid != user_id:
                        await manager.send_to_user(pid, {
                            "type": "typing",
                            "conversation_id": conv_id,
                            "user_id": user_id,
                        })
            elif event_type == "message":
                conv_id = data.get("conversation_id", "")
                participants = data.get("participants", [])
                await manager.send_to_conversation(conv_id, participants, user_id, data)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        manager.disconnect(user_id)


@router.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket):
    user_id = _authenticate_ws(websocket)
    if not user_id:
        await websocket.close(code=4003, reason="Authentication failed")
        return
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "")
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        manager.disconnect(user_id)


@router.websocket("/ws/presence")
async def presence_websocket(websocket: WebSocket):
    user_id = _authenticate_ws(websocket)
    if not user_id:
        await websocket.close(code=4003, reason="Authentication failed")
        return
    await manager.connect(websocket, user_id)
    try:
        await manager.send_to_all({"type": "user_online", "user_id": user_id})
        # Mark this user's pending messages as delivered so senders see a
        # double tick as soon as the recipient's device is online.
        await MessageService.mark_delivered(user_id)
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "")
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif event_type == "status":
                status_val = data.get("status", "online")
                await manager.send_to_all({
                    "type": "presence_update",
                    "user_id": user_id,
                    "status": status_val,
                })
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.send_to_all({"type": "user_offline", "user_id": user_id})
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        manager.disconnect(user_id)


@router.websocket("/ws/organization/{organization_id}")
async def organization_websocket(websocket: WebSocket, organization_id: str):
    user_id = _authenticate_ws(websocket)
    if not user_id:
        await websocket.close(code=4003, reason="Authentication failed")
        return
    await manager.connect(websocket, user_id, room=f"org_{organization_id}")
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "")
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif event_type == "broadcast":
                await manager.send_to_room(f"org_{organization_id}", user_id, {
                    "type": "org_broadcast",
                    "organization_id": organization_id,
                    "user_id": user_id,
                    "message": data.get("message", ""),
                })
    except WebSocketDisconnect:
        manager.disconnect(user_id, room=f"org_{organization_id}")
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        manager.disconnect(user_id, room=f"org_{organization_id}")


@router.websocket("/ws/channel/{channel_id}")
async def channel_websocket(websocket: WebSocket, channel_id: str):
    user_id = _authenticate_ws(websocket)
    if not user_id:
        await websocket.close(code=4003, reason="Authentication failed")
        return
    await manager.connect(websocket, user_id, room=f"ch_{channel_id}")
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "")
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif event_type == "message":
                await manager.send_to_room(f"ch_{channel_id}", user_id, {
                    "type": "channel_message",
                    "channel_id": channel_id,
                    "user_id": user_id,
                    "message": data.get("message", ""),
                })
    except WebSocketDisconnect:
        manager.disconnect(user_id, room=f"ch_{channel_id}")
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        manager.disconnect(user_id, room=f"ch_{channel_id}")
