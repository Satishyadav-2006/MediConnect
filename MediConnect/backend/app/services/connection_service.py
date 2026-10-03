import logging
import secrets
from typing import Any
from app.models.connection import Connection, Follow, ConnectionStatus
from app.models.block import Block
from app.models.base import AccountStatus
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError, ValidationAppError
from app.services.notification_helper import (
    notify_connection_request,
    notify_connection_accepted,
    notify_followed,
    clear_connection_request_notifications,
)
from app.utils.pagination import paginate_response
from beanie.odm.operators.find.logical import And, Or
from beanie.odm.operators.find.comparison import In

logger = logging.getLogger(__name__)


class ConnectionService:

    @staticmethod
    async def get_status(user_id: str, other_id: str) -> dict[str, str]:
        if user_id == other_id:
            return {"status": "self"}
        conn = await Connection.find_one(
            Or(
                And(Connection.sender_id == user_id, Connection.receiver_id == other_id),
                And(Connection.sender_id == other_id, Connection.receiver_id == user_id),
            )
        )
        if not conn:
            return {"status": "none"}
        if conn.status == ConnectionStatus.ACCEPTED:
            return {"status": "accepted", "connection_id": str(conn.id)}
        if conn.status == ConnectionStatus.PENDING:
            return {
                "status": "pending_sent" if conn.sender_id == user_id else "pending_received",
                "connection_id": str(conn.id),
            }
        return {"status": "none"}

    @staticmethod
    async def send_request(requester_id: str, receiver_id: str) -> dict[str, str]:
        if requester_id == receiver_id:
            raise AuthorizationError("Cannot connect with yourself")
        receiver = await UserRepository.find_by_user_id(receiver_id)
        if not receiver:
            raise NotFoundError("User not found")
        existing = await Connection.find_one(
            Connection.sender_id == requester_id,
            Connection.receiver_id == receiver_id,
        )
        if existing:
            if existing.status == ConnectionStatus.ACCEPTED:
                raise ConflictError("Already connected")
            if existing.status == ConnectionStatus.PENDING:
                raise ConflictError("Request already pending")
            existing.status = ConnectionStatus.PENDING
            existing.sender_id = requester_id
            existing.receiver_id = receiver_id
            await existing.save()
            return {"message": "Connection request sent"}
        conn = Connection(
            connection_id=secrets.token_hex(16),
            sender_id=requester_id,
            receiver_id=receiver_id,
            status=ConnectionStatus.PENDING,
        )
        await conn.insert()
        await notify_connection_request(receiver_id, requester_id)
        return {"message": "Connection request sent"}

    @staticmethod
    async def accept_request(user_id: str, requester_id: str) -> dict[str, str]:
        conn = await Connection.find_one(
            Connection.sender_id == requester_id,
            Connection.receiver_id == user_id,
            Connection.status == ConnectionStatus.PENDING,
        )
        if not conn:
            raise NotFoundError("Connection request not found")
        conn.status = ConnectionStatus.ACCEPTED
        await conn.save()
        await clear_connection_request_notifications(user_id, requester_id)
        await notify_connection_accepted(requester_id, user_id)
        return {"message": "Connection accepted"}

    @staticmethod
    async def reject_request(user_id: str, requester_id: str) -> dict[str, str]:
        conn = await Connection.find_one(
            Connection.sender_id == requester_id,
            Connection.receiver_id == user_id,
            Connection.status == ConnectionStatus.PENDING,
        )
        if not conn:
            raise NotFoundError("Connection request not found")
        conn.status = ConnectionStatus.REJECTED
        await conn.save()
        await clear_connection_request_notifications(user_id, requester_id)
        return {"message": "Connection rejected"}

    @staticmethod
    async def remove_connection(user_id: str, other_id: str) -> dict[str, str]:
        conn = await Connection.find_one(
            Or(
                And(Connection.sender_id == user_id, Connection.receiver_id == other_id),
                And(Connection.sender_id == other_id, Connection.receiver_id == user_id),
            ),
            Connection.status == ConnectionStatus.ACCEPTED,
        )
        if not conn:
            raise NotFoundError("Connection not found")
        await conn.delete()
        return {"message": "Connection removed"}

    @staticmethod
    async def follow_user(follower_id: str, following_id: str, following_type: str = "user") -> dict[str, str]:
        if follower_id == following_id:
            raise AuthorizationError("Cannot follow yourself")
        existing = await Follow.find_one(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
            Follow.following_type == following_type,
        )
        if existing:
            raise ConflictError("Already following")
        follow = Follow(
            follower_id=follower_id,
            following_id=following_id,
            following_type=following_type,
        )
        await follow.insert()
        await notify_followed(following_id, follower_id)
        return {"message": "Now following"}

    @staticmethod
    async def unfollow_user(follower_id: str, following_id: str) -> dict[str, str]:
        follow = await Follow.find_one(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
        )
        if not follow:
            raise NotFoundError("Follow relationship not found")
        await follow.delete()
        return {"message": "Unfollowed"}

    @staticmethod
    async def block_user(user_id: str, blocked_id: str) -> dict[str, str]:
        if user_id == blocked_id:
            raise ValidationAppError("You cannot block yourself")
        blocked_user = await UserRepository.find_by_user_id(blocked_id)
        if not blocked_user:
            raise NotFoundError("User not found")
        existing = await Block.find_one(Block.user_id == user_id, Block.blocked_id == blocked_id)
        if existing:
            raise ConflictError("User is already blocked")
        block = Block(user_id=user_id, blocked_id=blocked_id)
        await block.insert()
        return {"message": "User blocked successfully"}

    @staticmethod
    async def unblock_user(user_id: str, blocked_id: str) -> dict[str, str]:
        block = await Block.find_one(Block.user_id == user_id, Block.blocked_id == blocked_id)
        if not block:
            raise NotFoundError("Block not found")
        await block.delete()
        return {"message": "User unblocked successfully"}

    @staticmethod
    async def get_blocked_users(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        total = await Block.find(Block.user_id == user_id).count()
        blocks = await Block.find(Block.user_id == user_id).skip(skip).limit(per_page).to_list()

        items = []
        for block in blocks:
            blocked = await UserRepository.find_by_user_id(block.blocked_id)
            if not blocked:
                continue
            items.append({
                "_id": str(block.id),
                "user_id": blocked.user_id,
                "user": {
                    "_id": blocked.user_id,
                    "fullName": f"{blocked.first_name} {blocked.last_name}".strip(),
                    "profilePhoto": blocked.profile_photo,
                    "headline": blocked.headline,
                },
                "blocked_at": block.created_at,
                "blockedAt": block.created_at,
            })
        return paginate_response(items, total, page, per_page)

    @staticmethod
    async def _user_summary(user) -> dict[str, Any] | None:
        if not user:
            return None
        return {
            "_id": user.user_id,
            "user_id": user.user_id,
            "username": user.username,
            "fullName": f"{user.first_name} {user.last_name}".strip(),
            "profilePhoto": user.profile_photo,
            "profile_photo": user.profile_photo,
            "headline": user.headline,
            "specialization": user.specialization,
            "accountStatus": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
        }

    @staticmethod
    async def get_connections(user_id: str, status: str = "accepted", page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        status_enum = ConnectionStatus(status) if status in [e.value for e in ConnectionStatus] else ConnectionStatus.ACCEPTED
        query = And(
            Or(Connection.sender_id == user_id, Connection.receiver_id == user_id),
            Connection.status == status_enum,
        )
        total = await Connection.find(query).count()
        connections = await Connection.find(query).skip(skip).limit(per_page).to_list()

        items = []
        for conn in connections:
            requester = await UserRepository.find_by_user_id(conn.sender_id)
            recipient = await UserRepository.find_by_user_id(conn.receiver_id)
            items.append({
                "_id": str(conn.id),
                "connection_id": str(conn.id),
                "requester": await ConnectionService._user_summary(requester),
                "recipient": await ConnectionService._user_summary(recipient),
                "status": conn.status.value if hasattr(conn.status, 'value') else conn.status,
                "created_at": conn.created_at,
            })
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_pending_requests(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        query = And(
            Connection.receiver_id == user_id,
            Connection.status == ConnectionStatus.PENDING,
        )
        total = await Connection.find(query).count()
        connections = await Connection.find(query).sort("-created_at").skip(skip).limit(per_page).to_list()

        items = []
        for conn in connections:
            sender = await UserRepository.find_by_user_id(conn.sender_id)
            items.append({
                "_id": str(conn.id),
                "connection_id": str(conn.id),
                "requester": await ConnectionService._user_summary(sender),
                "status": conn.status.value if hasattr(conn.status, 'value') else conn.status,
                "created_at": conn.created_at,
            })
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def get_sent_requests(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        query = And(
            Connection.sender_id == user_id,
            Connection.status == ConnectionStatus.PENDING,
        )
        total = await Connection.find(query).count()
        connections = await Connection.find(query).sort("-created_at").skip(skip).limit(per_page).to_list()

        items = []
        for conn in connections:
            receiver = await UserRepository.find_by_user_id(conn.receiver_id)
            items.append({
                "_id": str(conn.id),
                "connection_id": str(conn.id),
                "recipient": await ConnectionService._user_summary(receiver),
                "status": conn.status.value if hasattr(conn.status, 'value') else conn.status,
                "created_at": conn.created_at,
            })
        return paginate_response(items, total, page, per_page, "created_at")

    @staticmethod
    async def accept_request_by_id(connection_id: str, user_id: str) -> dict[str, str]:
        from bson import ObjectId
        try:
            conn = await Connection.get(ObjectId(connection_id))
        except Exception:
            raise NotFoundError("Connection request not found")
        if not conn:
            raise NotFoundError("Connection request not found")
        if conn.receiver_id != user_id:
            raise AuthorizationError("Only the recipient can accept this request")
        if conn.status != ConnectionStatus.PENDING:
            raise AuthorizationError("This request has already been processed")
        conn.status = ConnectionStatus.ACCEPTED
        await conn.save()
        await clear_connection_request_notifications(conn.receiver_id, conn.sender_id)
        await notify_connection_accepted(conn.sender_id, user_id)
        return {"message": "Connection accepted"}

    @staticmethod
    async def reject_request_by_id(connection_id: str, user_id: str) -> dict[str, str]:
        from bson import ObjectId
        try:
            conn = await Connection.get(ObjectId(connection_id))
        except Exception:
            raise NotFoundError("Connection request not found")
        if not conn:
            raise NotFoundError("Connection request not found")
        if conn.receiver_id != user_id:
            raise AuthorizationError("Only the recipient can decline this request")
        conn.status = ConnectionStatus.REJECTED
        await conn.save()
        await clear_connection_request_notifications(conn.receiver_id, conn.sender_id)
        return {"message": "Connection rejected"}

    @staticmethod
    async def delete_connection(connection_id: str, user_id: str) -> dict[str, str]:
        from bson import ObjectId
        try:
            conn = await Connection.get(ObjectId(connection_id))
        except Exception:
            raise NotFoundError("Connection not found")
        if not conn:
            raise NotFoundError("Connection not found")
        if conn.sender_id != user_id and conn.receiver_id != user_id:
            raise AuthorizationError("Only the involved users can remove this connection")
        await conn.delete()
        return {"message": "Connection removed"}

    @staticmethod
    async def cancel_request_by_id(connection_id: str, user_id: str) -> dict[str, str]:
        from bson import ObjectId
        try:
            conn = await Connection.get(ObjectId(connection_id))
        except Exception:
            raise NotFoundError("Connection request not found")
        if not conn:
            raise NotFoundError("Connection request not found")
        if conn.sender_id != user_id:
            raise AuthorizationError("Only the sender can cancel this request")
        await clear_connection_request_notifications(conn.receiver_id, conn.sender_id)
        await conn.delete()
        return {"message": "Connection request cancelled"}

    @staticmethod
    async def get_suggestions(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page

        connected = await Connection.find(
            And(
                Or(Connection.sender_id == user_id, Connection.receiver_id == user_id),
                Connection.status == ConnectionStatus.ACCEPTED,
            )
        ).to_list()
        connected_ids = {
            c.sender_id if c.receiver_id == user_id else c.receiver_id
            for c in connected
        }
        followed = await Follow.find(Follow.follower_id == user_id).to_list()
        followed_ids = {f.following_id for f in followed}

        excluded = connected_ids | followed_ids | {user_id}

        active_statuses = [
            AccountStatus.ACTIVE.value,
            AccountStatus.PENDING_PROFESSIONAL_VERIFICATION.value,
        ]
        users = await User.find(
            User.user_id != user_id,
            In(User.account_status, active_statuses),
        ).skip(skip).limit(per_page * 2).to_list()
        candidates = [u for u in users if u.user_id not in excluded][:per_page]
        total = await User.find(
            User.user_id != user_id,
            In(User.account_status, active_statuses),
        ).count()

        items = [
            {
                "_id": u.user_id,
                "user_id": u.user_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "fullName": f"{u.first_name} {u.last_name}".strip(),
                "username": u.username,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "headline": u.headline,
                "specialization": u.specialization,
                "profile_photo": u.profile_photo,
                "profilePhoto": u.profile_photo,
                "accountStatus": u.account_status.value if hasattr(u.account_status, 'value') else u.account_status,
                "created_at": u.created_at,
            }
            for u in candidates
        ]
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
            "has_more": page * per_page < total,
            "next_cursor": None,
            "prev_cursor": None,
        }

    @staticmethod
    async def get_followers(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        follows = await Follow.find(Follow.following_id == user_id, Follow.following_type == "user").skip(skip).limit(per_page).to_list()
        total = await Follow.find(Follow.following_id == user_id, Follow.following_type == "user").count()
        return paginate_response(follows, total, page, per_page, "created_at")

    @staticmethod
    async def get_following(user_id: str, page: int = 1, per_page: int = 20) -> dict[str, Any]:
        skip = (page - 1) * per_page
        follows = await Follow.find(Follow.follower_id == user_id).skip(skip).limit(per_page).to_list()
        total = await Follow.find(Follow.follower_id == user_id).count()
        return paginate_response(follows, total, page, per_page, "created_at")
