import logging
import secrets
from datetime import datetime, timezone
from typing import Any
from app.models.conversation import Conversation
from app.models.message import Message, MessageAttachment, MessageStatus
from app.models.notification import Notification, Device
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.messaging import ConversationCreateRequest, MessageCreateRequest, MessageUpdateRequest
from app.models.base import NotificationType
from app.utils.pagination import paginate_response
from app.websocket.manager import manager
from beanie.odm.operators.find.comparison import In

logger = logging.getLogger(__name__)


def _to_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

online_users: dict[str, dict[str, Any]] = {}
typing_users: dict[str, dict[str, datetime]] = {}


class MessageService:

    @staticmethod
    async def _user_to_dict(u: User | None) -> dict[str, Any]:
        if u is None:
            return {}
        return {
            "_id": u.user_id,
            "user_id": u.user_id,
            "username": u.username,
            "fullName": f"{u.first_name} {u.last_name}".strip(),
            "first_name": u.first_name,
            "last_name": u.last_name,
            "profilePhoto": u.profile_photo,
            "profile_photo": u.profile_photo,
            "headline": u.headline,
            "specialization": u.specialization,
            "currentOrganization": u.organization_id or "",
            "accountStatus": u.account_status.value if hasattr(u.account_status, "value") else u.account_status,
            "account_status": u.account_status.value if hasattr(u.account_status, "value") else u.account_status,
            "updatedAt": _to_iso(u.updated_at),
            "updated_at": _to_iso(u.updated_at),
        }

    @staticmethod
    async def _message_to_dict(m: Message, sender: User | None = None) -> dict[str, Any]:
        if sender is None:
            sender = await UserRepository.find_by_user_id(m.sender_id)
        reply = None
        if m.reply_to:
            rm = await Message.find_one(Message.message_id == m.reply_to, Message.is_deleted == False)
            if rm:
                rsender = await UserRepository.find_by_user_id(rm.sender_id)
                reply = {
                    "_id": rm.message_id,
                    "sender": await MessageService._user_to_dict(rsender),
                    "content": rm.content,
                }
        first = m.attachments[0] if m.attachments else None
        return {
            "_id": m.message_id,
            "message_id": m.message_id,
            "conversation": m.conversation_id,
            "conversation_id": m.conversation_id,
            "sender": await MessageService._user_to_dict(sender) or {"_id": m.sender_id},
            "content": m.content,
            "type": m.message_type,
            "fileUrl": first.cloudinary_url if first else None,
            "fileName": first.file_name if first else None,
            "replyTo": reply,
            "readBy": m.read_by or [],
            "deliveredTo": m.delivered_to or [],
            "isEdited": m.is_edited,
            "isDeleted": m.is_deleted,
            "isPinned": m.is_pinned,
            "reactions": m.reactions or [],
            "createdAt": _to_iso(m.created_at),
            "created_at": _to_iso(m.created_at),
            "updatedAt": _to_iso(m.updated_at),
            "updated_at": _to_iso(m.updated_at),
        }

    @staticmethod
    async def get_or_create_conversation(user1_id: str, user2_id: str) -> Conversation:
        existing = await Conversation.find_one(
            Conversation.conversation_type == "private",
            {"$and": [
                {"participant_ids": {"$all": [user1_id, user2_id]}},
                {"participant_ids": {"$size": 2}},
            ]},
        )
        if existing:
            return existing
        conv_id = secrets.token_hex(16)
        conv = Conversation(
            conversation_id=conv_id,
            conversation_type="private",
            participant_ids=[user1_id, user2_id],
            created_by=user1_id,
        )
        await conv.insert()
        return conv

    @staticmethod
    async def create_conversation(user_id: str, data: ConversationCreateRequest) -> dict[str, Any]:
        if data.conversation_type == "direct":
            if len(data.participant_ids) != 1:
                raise NotFoundError("Direct conversations require exactly one participant")
            conv = await MessageService.get_or_create_conversation(user_id, data.participant_ids[0])
        else:
            participant_ids = list(dict.fromkeys([user_id] + data.participant_ids))
            conv = Conversation(
                conversation_id=secrets.token_hex(16),
                conversation_type=data.conversation_type,
                participant_ids=participant_ids,
                created_by=user_id,
            )
            await conv.insert()
        return {
            "conversation_id": conv.conversation_id,
            "conversation_type": conv.conversation_type,
            "participant_ids": conv.participant_ids,
            "title": data.title,
        }

    @staticmethod
    async def send_message(sender_id: str, data: MessageCreateRequest) -> dict[str, Any]:
        if data.conversation_id:
            conv = await Conversation.find_one(Conversation.conversation_id == data.conversation_id)
            if not conv:
                raise NotFoundError("Conversation not found")
            if sender_id not in conv.participant_ids:
                raise AuthorizationError("Not a participant")
        elif data.recipient_id:
            conv = await MessageService.get_or_create_conversation(sender_id, data.recipient_id)
        else:
            raise NotFoundError("Either conversation_id or recipient_id is required")

        msg_id = secrets.token_hex(16)
        recipients = [p for p in conv.participant_ids if p != sender_id]
        # The sender always has their own message (delivered). The message becomes
        # "delivered" to the recipient only when they are online (socket connected),
        # so the sender sees a single tick until then and a double tick once
        # delivered to the recipient's device.
        delivered = [sender_id]
        for p in recipients:
            if manager.is_online(p):
                delivered.append(p)
        message = Message(
            message_id=msg_id,
            conversation_id=conv.conversation_id,
            sender_id=sender_id,
            message_type=data.message_type,
            content=data.content,
            reply_to=data.reply_to,
            mentions=data.mentions,
            status=MessageStatus.SENT,
            read_by=[sender_id],
            delivered_to=delivered,
        )
        await message.insert()
        conv.last_message_preview = data.content[:200]
        conv.last_activity = datetime.now(timezone.utc)
        conv.last_message_id = msg_id
        total_unread = 0
        for p in conv.participant_ids:
            if p == sender_id:
                continue
            counts = dict(conv.unread_counts or {})
            counts[p] = counts.get(p, 0) + 1
            conv.unread_counts = counts
            total_unread += 1
        conv.unread_count = total_unread
        await conv.save()
        await MessageService._create_notification(
            sender_id=sender_id,
            recipient_id=data.recipient_id or "",
            notification_type=NotificationType.NEW_MESSAGE,
            title="New Message",
            message=data.content[:200],
            reference_id=conv.conversation_id,
            reference_type="conversation",
        )
        return {
            "message_id": message.message_id,
            "conversation_id": conv.conversation_id,
            "content": message.content,
            "created_at": _to_iso(message.created_at),
            "readBy": message.read_by,
            "deliveredTo": message.delivered_to,
        }

    @staticmethod
    async def get_conversations(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        convs = await Conversation.find(
            {"participant_ids": user_id},
            Conversation.is_deleted == False,
        ).sort("-last_activity").skip(skip).limit(per_page).to_list()
        total = await Conversation.find({"participant_ids": user_id}, Conversation.is_deleted == False).count()

        participant_ids = {pid for c in convs for pid in c.participant_ids}
        users = await User.find(In(User.user_id, list(participant_ids))).to_list() if participant_ids else []
        user_map = {u.user_id: u for u in users}

        results: list[dict[str, Any]] = []
        for c in convs:
            participants = [user_map[pid] for pid in c.participant_ids if pid in user_map]
            other = next((u for u in participants if u.user_id != user_id), None)
            name = getattr(c, "title", "") or ""
            if not name and other:
                name = f"{other.first_name} {other.last_name}".strip() or other.username
            last_msg = None
            if c.last_message_id:
                lm = await Message.find_one(Message.message_id == c.last_message_id, Message.is_deleted == False)
                if lm:
                    last_msg = await MessageService._message_to_dict(lm)
            results.append({
                "_id": c.conversation_id,
                "type": c.conversation_type,
                "participants": [await MessageService._user_to_dict(u) for u in participants],
                "lastMessage": last_msg,
                "unreadCount": (c.unread_counts or {}).get(user_id, c.unread_count if not (c.unread_counts or {}) else 0),
                "name": name,
                "avatar": other.profile_photo if other else None,
                "createdAt": _to_iso(c.created_at),
                "updatedAt": _to_iso(c.last_activity or c.updated_at),
            })
        return paginate_response(results, total, page, per_page, "last_activity")

    @staticmethod
    async def get_messages(conversation_id: str, user_id: str, page: int = 1, per_page: int = 50) -> dict[str, Any]:
        conv = await Conversation.find_one(Conversation.conversation_id == conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        skip = (page - 1) * per_page
        messages = await Message.find(
            Message.conversation_id == conversation_id,
            Message.is_deleted == False,
        ).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Message.find(
            Message.conversation_id == conversation_id,
            Message.is_deleted == False,
        ).count()

        # Persist the delivery receipt for inbound messages. Fetching a
        # conversation means the requesting user has received the messages, which
        # is what drives the double-tick state on the sender's UI. Read receipts
        # (blue tick) are handled separately by mark_as_read when the recipient
        # actually opens the conversation.
        changed = False
        for m in messages:
            if m.sender_id == user_id:
                continue
            if user_id not in m.delivered_to:
                m.delivered_to.append(user_id)
                changed = True
            if m.status == MessageStatus.SENT:
                m.status = MessageStatus.DELIVERED
                changed = True
        if changed:
            for m in messages:
                if m.sender_id != user_id:
                    await m.save()

        sender_ids = {m.sender_id for m in messages}
        senders = await User.find(In(User.user_id, list(sender_ids))).to_list() if sender_ids else []
        sender_map = {u.user_id: u for u in senders}

        items: list[dict[str, Any]] = []
        for m in messages:
            item = await MessageService._message_to_dict(m, sender_map.get(m.sender_id))
            items.append(item)
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def mark_as_read(conversation_id: str, user_id: str) -> dict[str, str]:
        conv = await Conversation.find_one(Conversation.conversation_id == conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        conv.unread_count = 0
        counts = dict(conv.unread_counts or {})
        if user_id in counts:
            counts[user_id] = 0
        conv.unread_counts = counts
        await conv.save()
        messages = await Message.find(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
        ).to_list()
        for m in messages:
            m.status = MessageStatus.READ
            if user_id not in m.read_by:
                m.read_by.append(user_id)
            await m.save()
        return {"message": "Marked as read"}

    @staticmethod
    async def mark_delivered(user_id: str) -> dict[str, str]:
        """Mark all messages addressed to `user_id` as delivered (drives the
        double-tick state on the sender's UI). Called when the recipient's
        device comes online / connects, before they open the conversation."""
        messages = await Message.find(
            Message.sender_id != user_id,
        ).to_list()
        changed = False
        for m in messages:
            if user_id not in m.delivered_to and user_id not in m.read_by:
                m.delivered_to.append(user_id)
                changed = True
        if changed:
            for m in messages:
                if user_id in m.delivered_to and user_id not in m.read_by:
                    await m.save()
        return {"message": "Marked as delivered"}

    @staticmethod
    async def edit_message(message_id: str, user_id: str, data: MessageUpdateRequest) -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id)
        if not msg:
            raise NotFoundError("Message not found")
        if msg.sender_id != user_id:
            raise AuthorizationError("Only sender can edit")
        msg.content = data.content
        msg.is_edited = True
        await msg.save()
        return {"message": "Message edited"}

    @staticmethod
    async def delete_message(message_id: str, user_id: str, mode: str = "everyone") -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id)
        if not msg:
            raise NotFoundError("Message not found")
        if mode == "everyone":
            if msg.sender_id != user_id:
                raise AuthorizationError("Only sender can delete for everyone")
            msg.is_deleted = True
        else:
            if user_id not in msg.deleted_for:
                msg.deleted_for.append(user_id)
        await msg.save()
        return {"message": "Message deleted"}

    @staticmethod
    async def pin_message(message_id: str, user_id: str) -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id)
        if not msg:
            raise NotFoundError("Message not found")
        conv = await Conversation.find_one(Conversation.conversation_id == msg.conversation_id)
        if not conv or user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        msg.is_pinned = True
        await msg.save()
        return {"message": "Message pinned"}

    @staticmethod
    async def unpin_message(message_id: str, user_id: str) -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id)
        if not msg:
            raise NotFoundError("Message not found")
        conv = await Conversation.find_one(Conversation.conversation_id == msg.conversation_id)
        if not conv or user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        msg.is_pinned = False
        await msg.save()
        return {"message": "Message unpinned"}

    @staticmethod
    async def get_pinned_messages(conversation_id: str, user_id: str) -> dict[str, Any]:
        conv = await Conversation.find_one(Conversation.conversation_id == conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        messages = await Message.find(
            Message.conversation_id == conversation_id,
            Message.is_pinned == True,
            Message.is_deleted == False,
        ).sort("-created_at").to_list()
        sender_ids = {m.sender_id for m in messages}
        senders = await User.find(In(User.user_id, list(sender_ids))).to_list() if sender_ids else []
        sender_map = {u.user_id: u for u in senders}
        items = [await MessageService._message_to_dict(m, sender_map.get(m.sender_id)) for m in messages]
        return {"items": items, "total": len(items)}

    @staticmethod
    async def get_shared_files(conversation_id: str, user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        conv = await Conversation.find_one(Conversation.conversation_id == conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        skip = (page - 1) * per_page
        messages = await Message.find(
            Message.conversation_id == conversation_id,
            Message.attachments != [],
            Message.is_deleted == False,
        ).sort("-created_at").skip(skip).limit(per_page).to_list()
        total = await Message.find(
            Message.conversation_id == conversation_id,
            Message.attachments != [],
            Message.is_deleted == False,
        ).count()
        items: list[dict[str, Any]] = []
        for m in messages:
            for a in m.attachments or []:
                items.append({
                    "_id": m.message_id,
                    "fileName": a.file_name or "file",
                    "fileUrl": a.cloudinary_url,
                    "type": a.mime_type or a.attachment_type,
                    "createdAt": m.created_at,
                    "created_at": m.created_at,
                })
        return paginate_response(items[:per_page], total, page, per_page, "created_at")

    @staticmethod
    async def forward_message(message_id: str, user_id: str, target_conversation_id: str) -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id, Message.is_deleted == False)
        if not msg:
            raise NotFoundError("Message not found")
        conv = await Conversation.find_one(Conversation.conversation_id == target_conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        new_msg_id = secrets.token_hex(16)
        forwarded = Message(
            message_id=new_msg_id,
            conversation_id=target_conversation_id,
            sender_id=user_id,
            message_type=msg.message_type,
            content=msg.content,
            attachments=[MessageAttachment(**a.model_dump()) for a in (msg.attachments or [])],
            mentions=[],
            status=MessageStatus.SENT,
            read_by=[user_id],
        )
        await forwarded.insert()
        conv.last_message_preview = msg.content[:200]
        conv.last_activity = datetime.now(timezone.utc)
        conv.last_message_id = new_msg_id
        total_unread = 0
        for p in conv.participant_ids:
            if p == user_id:
                continue
            counts = dict(conv.unread_counts or {})
            counts[p] = counts.get(p, 0) + 1
            conv.unread_counts = counts
            total_unread += 1
        conv.unread_count = total_unread
        await conv.save()
        return {"message": "Message forwarded"}

    @staticmethod
    async def react_to_message(message_id: str, user_id: str, emoji: str) -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id)
        if not msg:
            raise NotFoundError("Message not found")
        reactions = [dict(r) for r in (msg.reactions or [])]
        found = next((r for r in reactions if r.get("emoji") == emoji), None)
        if found:
            if user_id not in found["users"]:
                found["users"].append(user_id)
        else:
            reactions.append({"emoji": emoji, "users": [user_id]})
        msg.reactions = reactions
        await msg.save()
        return {"message": "Reaction updated"}

    @staticmethod
    async def remove_reaction(message_id: str, user_id: str, emoji: str) -> dict[str, str]:
        msg = await Message.find_one(Message.message_id == message_id)
        if not msg:
            raise NotFoundError("Message not found")
        reactions = [dict(r) for r in (msg.reactions or [])]
        updated: list[dict[str, Any]] = []
        for r in reactions:
            if r.get("emoji") == emoji:
                users = [u for u in r.get("users", []) if u != user_id]
                if users:
                    updated.append({"emoji": emoji, "users": users})
            else:
                updated.append(r)
        msg.reactions = updated
        await msg.save()
        return {"message": "Reaction removed"}

    @staticmethod
    async def archive_conversation(conversation_id: str, user_id: str) -> dict[str, str]:
        conv = await Conversation.find_one(Conversation.conversation_id == conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        conv.is_archived = True
        await conv.save()
        return {"message": "Conversation archived"}

    @staticmethod
    async def unarchive_conversation(conversation_id: str, user_id: str) -> dict[str, str]:
        conv = await Conversation.find_one(Conversation.conversation_id == conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if user_id not in conv.participant_ids:
            raise AuthorizationError("Not a participant")
        conv.is_archived = False
        await conv.save()
        return {"message": "Conversation restored"}

    @staticmethod
    async def restore_conversation(conversation_id: str, user_id: str) -> dict[str, str]:
        return await MessageService.unarchive_conversation(conversation_id, user_id)

    @staticmethod
    async def search_messages(user_id: str, query: str, conversation_id: str | None = None, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        filters: dict[str, Any] = {"is_deleted": False}
        if conversation_id:
            filters["conversation_id"] = conversation_id
        if query:
            filters["content"] = {"$regex": query, "$options": "i"}
        total = await Message.find(filters).count()
        skip = (page - 1) * per_page
        messages = await Message.find(filters).sort("-created_at").skip(skip).limit(per_page).to_list()
        sender_ids = {m.sender_id for m in messages}
        senders = await User.find(In(User.user_id, list(sender_ids))).to_list() if sender_ids else []
        sender_map = {u.user_id: u for u in senders}
        items = [await MessageService._message_to_dict(m, sender_map.get(m.sender_id)) for m in messages]
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def _create_notification(
        sender_id: str,
        recipient_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        reference_id: str | None = None,
        reference_type: str | None = None,
    ) -> None:
        if not recipient_id or sender_id == recipient_id:
            return
        notif = Notification(
            notification_id=secrets.token_hex(16),
            recipient_id=recipient_id,
            sender_id=sender_id,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        await notif.insert()