import logging
from datetime import datetime, timezone

from app.models.user import User, UserRole
from app.core.database import get_database
from app.models.base import AccountStatus

logger = logging.getLogger(__name__)


class AuthRepository:

    @staticmethod
    async def find_by_email(email: str) -> User | None:
        return await User.find_one(User.email == email.lower().strip())

    @staticmethod
    async def find_by_username(username: str) -> User | None:
        return await User.find_one(User.username == username.lower().strip())

    @staticmethod
    async def find_by_user_id(user_id: str) -> User | None:
        return await User.find_one(User.user_id == user_id)

    @staticmethod
    async def find_by_password_reset_token(token: str) -> User | None:
        return await User.find_one(User.password_reset_token == token)

    @staticmethod
    async def create_user(user: User) -> User:
        await user.insert()
        logger.info("User created: %s (%s)", user.email, user.user_id)
        return user

    @staticmethod
    async def update_user(user: User) -> User:
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        return user

    @staticmethod
    async def increment_failed_login(user: User) -> None:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            from datetime import timedelta
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            logger.warning("Account locked: %s (5 failed attempts)", user.email)
        await user.save()

    @staticmethod
    async def reset_failed_login(user: User) -> None:
        user.failed_login_attempts = 0
        user.locked_until = None
        await user.save()

    @staticmethod
    async def verify_email(user: User) -> None:
        user.email_verified = True
        user.otp_secret = None
        user.otp_code = None
        if user.account_status == AccountStatus.PENDING_EMAIL_VERIFICATION:
            STAFF_ROLES = {
                UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR,
            }
            if user.role in STAFF_ROLES:
                user.account_status = AccountStatus.ACTIVE
            else:
                user.account_status = AccountStatus.PENDING_PROFESSIONAL_VERIFICATION
        await user.save()
        logger.info("Email verified: %s", user.email)

    @staticmethod
    async def set_password_reset_token(user: User, token: str, expires: datetime) -> None:
        user.password_reset_token = token
        user.password_reset_expires = expires
        await user.save()

    @staticmethod
    async def reset_password(user: User, new_password_hash: str) -> None:
        user.password_hash = new_password_hash
        user.password_reset_token = None
        user.password_reset_expires = None
        user.refresh_tokens = []
        user.sessions = []
        await user.save()
        logger.info("Password reset: %s", user.email)

    @staticmethod
    async def change_password(user: User, new_password_hash: str) -> None:
        user.password_hash = new_password_hash
        await user.save()
        logger.info("Password changed: %s", user.email)

    @staticmethod
    async def add_refresh_token(user: User, token: str) -> None:
        if user.refresh_tokens is None:
            user.refresh_tokens = []
        user.refresh_tokens.append(token)
        await user.save()

    @staticmethod
    async def remove_refresh_token(user: User, token: str) -> None:
        if user.refresh_tokens and token in user.refresh_tokens:
            user.refresh_tokens.remove(token)
            await user.save()

    @staticmethod
    async def remove_all_refresh_tokens(user: User) -> None:
        user.refresh_tokens = []
        user.sessions = []
        await user.save()

    @staticmethod
    async def is_email_taken(email: str, exclude_user_id: str | None = None) -> bool:
        db = await get_database()
        filt = {"email": email.lower().strip()}
        if exclude_user_id:
            filt["user_id"] = {"$ne": exclude_user_id}
        count = await db["users"].count_documents(filt)
        return count > 0

    @staticmethod
    async def is_username_taken(username: str, exclude_user_id: str | None = None) -> bool:
        db = await get_database()
        filt = {"username": username.lower().strip()}
        if exclude_user_id:
            filt["user_id"] = {"$ne": exclude_user_id}
        count = await db["users"].count_documents(filt)
        return count > 0
