import json
import logging
from typing import Any
from fastapi import WebSocket
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.rooms: dict[str, set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, room: str | None = None) -> None:
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if room:
            if room not in self.rooms:
                self.rooms[room] = set()
            self.rooms[room].add(user_id)
        logger.info("WebSocket connected: %s (room: %s)", user_id, room)

    def disconnect(self, user_id: str, room: str | None = None) -> None:
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if room and room in self.rooms:
            self.rooms[room].discard(user_id)
            if not self.rooms[room]:
                del self.rooms[room]
        logger.info("WebSocket disconnected: %s (room: %s)", user_id, room)

    async def send_to_user(self, user_id: str, data: dict[str, Any]) -> None:
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)

    async def send_to_conversation(self, conversation_id: str, participants: list[str], sender_id: str, data: dict[str, Any]) -> None:
        for user_id in participants:
            if user_id != sender_id:
                await self.send_to_user(user_id, data)

    async def send_to_room(self, room: str, sender_id: str, data: dict[str, Any]) -> None:
        members = self.rooms.get(room, set())
        for user_id in members:
            if user_id != sender_id:
                await self.send_to_user(user_id, data)

    async def send_to_all(self, data: dict[str, Any], exclude: list[str] | None = None) -> None:
        exclude = exclude or []
        disconnected = []
        for user_id, ws in self.active_connections.items():
            if user_id not in exclude:
                try:
                    await ws.send_json(data)
                except Exception:
                    disconnected.append(user_id)
        for uid in disconnected:
            self.disconnect(uid)

    async def broadcast(self, data: dict[str, Any], exclude: list[str] | None = None) -> None:
        await self.send_to_all(data, exclude)

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections

    def get_online_users(self) -> list[str]:
        return list(self.active_connections.keys())

    def get_room_members(self, room: str) -> list[str]:
        return list(self.rooms.get(room, set()))


manager = ConnectionManager()
