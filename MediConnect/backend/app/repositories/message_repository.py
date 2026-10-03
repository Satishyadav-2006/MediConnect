import logging
from datetime import datetime, timezone

from app.models.message import Message
from app.models.base import MessageStatus

logger = logging.getLogger(__name__)


class MessageRepository:

    @staticmethod
    async def find_by_id(message_id: str) -> Message | None:
        return await Message.find_one(Message.message_id == message_id, Message.is_deleted == False)

    @staticmethod
    async def create(message: Message) -> Message:
        await message.insert()
        return message

    @staticmethod
    async def get_conversation_messages(
        conversation_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Message]:
        return await Message.find(
            Message.conversation_id == conversation_id,
            Message.is_deleted == False,
        ).skip(skip).limit(limit).sort("-created_at").to_list()

    @staticmethod
    async def update(message: Message) -> Message:
        message.updated_at = datetime.now(timezone.utc)
        await message.save()
        return message

    @staticmethod
    async def delete(message: Message) -> None:
        message.is_deleted = True
        message.status = MessageStatus.DELETED
        await message.save()
