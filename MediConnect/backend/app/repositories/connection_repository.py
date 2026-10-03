import logging
from typing import Any

from app.models.connection import Connection
from app.models.base import ConnectionStatus

logger = logging.getLogger(__name__)


class ConnectionRepository:

    @staticmethod
    async def find_connection(requester_id: str, receiver_id: str) -> Connection | None:
        return await Connection.find_one(
            Connection.sender_id == requester_id,
            Connection.receiver_id == receiver_id,
        )

    @staticmethod
    async def get_user_connections(
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Connection]:
        filters: dict[str, Any] = {
            "$or": [
                {"sender_id": user_id, "status": ConnectionStatus.ACCEPTED},
                {"receiver_id": user_id, "status": ConnectionStatus.ACCEPTED},
            ]
        }
        return await Connection.find(filters).skip(skip).limit(limit).sort("-created_at").to_list()

    @staticmethod
    async def get_pending_requests(
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Connection]:
        return await Connection.find(
            Connection.receiver_id == user_id,
            Connection.status == ConnectionStatus.PENDING,
        ).skip(skip).limit(limit).sort("-created_at").to_list()

    @staticmethod
    async def count_connections(user_id: str) -> int:
        filters: dict[str, Any] = {
            "$or": [
                {"sender_id": user_id, "status": ConnectionStatus.ACCEPTED},
                {"receiver_id": user_id, "status": ConnectionStatus.ACCEPTED},
            ]
        }
        return await Connection.find(filters).count()
