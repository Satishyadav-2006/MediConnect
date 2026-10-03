import logging
from datetime import datetime, timedelta, timezone
from typing import Any
import secrets

from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    AccountLockedError,
    VerificationPendingError,
    AuthorizationError,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    revoke_token,
    generate_reset_token,
    generate_session_id,
    validate_password_strength,
)
from app.repositories.auth_repository import AuthRepository
from app.models.user import User, UserRole, AccountStatus, VerificationStatus
from app.models.conversation import Conversation
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    VerifyEmailRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MeResponse,
    SessionResponse,
)
from app.services.audit_helper import log_registration, log_login, log_logout, log_password_change, log_password_reset, log_otp_request, log_failed_login
from app.emails.service import EmailService

logger = logging.getLogger(__name__)

OTP_MAX_ATTEMPTS = 5
OTP_COOLDOWN_SECONDS = 60
OTP_EXPIRY_MINUTES = 5


def _get_role_permissions(role) -> list[str]:
    role_val = role.value if hasattr(role, 'value') else role
    base = ["read", "write", "delete_own"]
    admin_perms = ["moderate_content", "manage_users", "manage_organizations", "view_analytics", "manage_settings"]
    owner_perms = admin_perms + ["manage_roles", "system_admin"]
    if role_val in ("owner",):
        return base + owner_perms
    if role_val in ("super_admin",):
        return base + admin_perms + ["manage_roles"]
    if role_val in ("admin", "moderator"):
        return base + admin_perms
    if role_val in ("hospital", "clinic", "medical_college", "nursing_college", "pharmacy_college", "allied_health_college"):
        return base + ["manage_organization", "post_jobs", "post_events", "verify_members"]
    if role_val in ("hr", "recruiter", "placement_officer"):
        return base + ["post_jobs", "view_applications", "manage_recruitment"]
    return base


class AuthService:

    @staticmethod
    async def register(data: RegisterRequest) -> dict[str, Any]:
        # Validate unique email
        if await AuthRepository.is_email_taken(data.email):
            raise ConflictError("Email is already registered")
        
        # Validate unique username
        if await AuthRepository.is_username_taken(data.username):
            raise ConflictError("Username is already taken")

        # Validate password strength
        is_valid, msg = validate_password_strength(data.password)
        if not is_valid:
            raise AuthenticationError(msg)

        # Determine account status and role
        role = data.role.lower()
        try:
            user_role = UserRole(role)
        except ValueError:
            raise AuthenticationError(f"Invalid role: {role}")

        account_status = AccountStatus.PENDING_EMAIL_VERIFICATION
        org_roles = {UserRole.HOSPITAL, UserRole.CLINIC, UserRole.MEDICAL_COLLEGE, UserRole.NURSING_COLLEGE, UserRole.PHARMACY_COLLEGE, UserRole.ALLIED_HEALTH_COLLEGE}
        is_org = user_role in org_roles

        # Generate user_id
        user_id = secrets.token_hex(16)

        # Generate OTP secret
        from app.core.security import generate_otp_secret
        otp_secret = generate_otp_secret()

        # Generate TOTP-based OTP
        import pyotp
        totp = pyotp.TOTP(otp_secret)
        otp = totp.now()

        # Build user
        user = User(
            user_id=user_id,
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=data.email.lower().strip(),
            username=data.username.lower().strip(),
            phone=data.phone,
            password_hash=hash_password(data.password),
            role=user_role,
            country=data.country.strip(),
            state=data.state.strip(),
            city=data.city.strip(),
            professional_category=data.professional_category,
            registration_number=data.registration_number,
            license_number=data.license_number,
            specialization=data.specialization,
            experience_years=data.experience_years,
            account_status=account_status,
            email_verified=False,
            verification_status=VerificationStatus.PENDING,
            profile_completion=0,
            otp_secret=otp_secret,
            otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES),
            otp_last_sent_at=datetime.now(timezone.utc),
            otp_code=otp,
        )

        # Set organization name for org roles
        if is_org and data.organization_name:
            user.headline = data.organization_name

        user = await AuthRepository.create_user(user)

        email_sent = await EmailService.send_otp_email(data.email, otp, data.first_name)
        await log_registration(user.user_id, data.email)
        await log_otp_request(user.user_id, data.email)

        result = {
            "user_id": user.user_id,
            "email": user.email,
            "otp_secret": otp_secret,
            "email_sent": email_sent,
            "message": "Registration successful. Please verify your email.",
        }
        if not email_sent:
            result["otp"] = otp
        return result

    @staticmethod
    async def verify_email(data: VerifyEmailRequest) -> dict[str, Any]:
        user = await AuthRepository.find_by_email(data.email)
        if not user:
            raise NotFoundError("User not found")

        if user.email_verified:
            return {"message": "Email already verified"}

        if not user.otp_secret:
            raise AuthenticationError("No OTP secret found. Please request a new OTP.")

        expires = user.otp_expires_at
        if expires and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires and datetime.now(timezone.utc) > expires:
            raise AuthenticationError("OTP has expired. Please request a new one.")

        if user.otp_attempts >= OTP_MAX_ATTEMPTS:
            raise AuthenticationError("Too many OTP attempts. Please request a new OTP.")

        stored_code = user.otp_code
        if not stored_code:
            raise AuthenticationError("No OTP code found. Please request a new one.")
        if data.otp.strip() != stored_code:
            user.otp_attempts += 1
            await user.save()
            remaining = max(0, OTP_MAX_ATTEMPTS - user.otp_attempts)
            raise AuthenticationError(f"Invalid OTP code. {remaining} attempts remaining.")

        await AuthRepository.verify_email(user)
        await log_login(user.user_id, "", "")

        # Auto-login: generate tokens
        extra_claims = {
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "email_verified": True,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
        }
        access_token = create_access_token(user.user_id, extra_claims)
        refresh_token = create_refresh_token(user.user_id)
        await AuthRepository.add_refresh_token(user, refresh_token)

        user_data = {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "username": user.username,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "profile_photo": user.profile_photo,
            "email_verified": True,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
            "verification_status": user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status,
            "permissions": _get_role_permissions(user.role),
        }

        return {
            "message": "Email verified successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user_data,
        }

    @staticmethod
    async def resend_otp(email: str) -> dict[str, Any]:
        user = await AuthRepository.find_by_email(email)
        if not user:
            raise NotFoundError("User not found")

        if user.email_verified:
            return {"message": "Email already verified"}

        if hasattr(user, 'otp_last_sent_at') and user.otp_last_sent_at:
            last_sent = user.otp_last_sent_at
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            elapsed = (datetime.now(timezone.utc) - last_sent).total_seconds()
            if elapsed < OTP_COOLDOWN_SECONDS:
                remaining = int(OTP_COOLDOWN_SECONDS - elapsed)
                raise AuthenticationError(f"Please wait {remaining} seconds before requesting a new OTP.")

        from app.core.security import generate_otp_secret
        user.otp_secret = generate_otp_secret()
        user.otp_attempts = 0
        user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
        user.otp_last_sent_at = datetime.now(timezone.utc)

        import pyotp
        totp = pyotp.TOTP(user.otp_secret)
        otp = totp.now()
        user.otp_code = otp
        await AuthRepository.update_user(user)

        email_sent = await EmailService.send_otp_email(email, otp, user.first_name)
        await log_otp_request(user.user_id, email)

        result = {"message": "OTP sent successfully", "email_sent": email_sent}
        if not email_sent:
            result["otp"] = otp
        return result

    @staticmethod
    async def login(data: LoginRequest, ip_address: str = "", device_info: str = "") -> TokenResponse:
        user = await AuthRepository.find_by_email(data.email)
        if not user:
            raise AuthenticationError("Invalid email or password")

        # Check account status
        if user.account_status == AccountStatus.SUSPENDED:
            raise AccountLockedError("Account has been suspended")
        if user.account_status == AccountStatus.DELETED:
            raise AuthenticationError("Account not found")
        if user.account_status == AccountStatus.DELETED:
            raise AuthenticationError("Account is deactivated")
        if not user.email_verified:
            raise AuthenticationError("Please verify your email before logging in")

        # Check lock — auto-unlock if cooldown expired
        
        if user.locked_until:
            locked_until = user.locked_until

            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc) > locked_until:
                user.locked_until = None
                user.failed_login_attempts = 0
                await AuthRepository.update_user(user)
            else:
                remaining = int((locked_until - datetime.now(timezone.utc)).total_seconds() // 60)
                raise AccountLockedError(f"Account is locked. Try again in {remaining} minutes")  
                  
        # Verify password
        if not verify_password(data.password, user.password_hash):
            await AuthRepository.increment_failed_login(user)
            await log_failed_login(data.email, ip_address)
            remaining_attempts = max(0, 5 - user.failed_login_attempts)
            if remaining_attempts == 0:
                raise AccountLockedError("Account is locked due to too many failed attempts")
            raise AuthenticationError(f"Invalid email or password. {remaining_attempts} attempts remaining")

        # Reset failed attempts on success
        if user.failed_login_attempts > 0:
            await AuthRepository.reset_failed_login(user)

        # Generate tokens
        extra_claims = {
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "email_verified": user.email_verified,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
        }
        access_token = create_access_token(user.user_id, extra_claims)
        refresh_token = create_refresh_token(
            user.user_id,
            expire_days=settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS if data.remember_me else None,
        )

        # Store refresh token
        await AuthRepository.add_refresh_token(user, refresh_token)

        # Add session
        session_id = generate_session_id()
        session = {
            "session_id": session_id,
            "device_name": device_info or "Unknown Device",
            "browser": "Unknown",
            "os": "Unknown",
            "ip_address": ip_address or "Unknown",
            "login_at": datetime.now(timezone.utc),
            "last_activity": datetime.now(timezone.utc),
        }
        if user.sessions is None:
            user.sessions = []
        user.sessions.append(session)
        user.last_login = datetime.now(timezone.utc)
        await AuthRepository.update_user(user)
        await log_login(user.user_id, ip_address, device_info)

        counts = await AuthService._get_social_counts(user.user_id)
        user_data = {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "username": user.username,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "profile_photo": user.profile_photo,
            "email_verified": user.email_verified,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
            "verification_status": user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status,
            "permissions": _get_role_permissions(user.role),
            **counts,
        }

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_data,
        )

    @staticmethod
    async def refresh_token(data: RefreshTokenRequest) -> TokenResponse:
        payload = decode_refresh_token(data.refresh_token)
        if not payload:
            raise AuthenticationError("Invalid or expired refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")

        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise AuthenticationError("User not found")

        if data.refresh_token not in (user.refresh_tokens or []):
            raise AuthenticationError("Refresh token has been revoked")

        # Rotate: remove old, issue new
        await AuthRepository.remove_refresh_token(user, data.refresh_token)

        # Preserve remaining lifetime of the original refresh token
        old_exp = payload.get("exp")
        remaining_days = None
        if isinstance(old_exp, (int, float)):
            remaining = int(old_exp - datetime.now(timezone.utc).timestamp())
            if remaining > 0:
                remaining_days = max(1, remaining // 86400)

        extra_claims = {
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "email_verified": user.email_verified,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
        }
        new_access = create_access_token(user.user_id, extra_claims)
        new_refresh = create_refresh_token(user.user_id, expire_days=remaining_days)

        await AuthRepository.add_refresh_token(user, new_refresh)

        user_data = {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "username": user.username,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "profile_photo": user.profile_photo,
        }

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_data,
        )

    @staticmethod
    async def logout(user_id: str, refresh_token: str) -> dict[str, str]:
        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        await AuthRepository.remove_refresh_token(user, refresh_token)
        revoke_token(refresh_token)
        await log_logout(user_id)

        return {"message": "Logged out successfully"}

    @staticmethod
    async def logout_all(user_id: str) -> dict[str, str]:
        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Revoke all refresh tokens
        for token in (user.refresh_tokens or []):
            revoke_token(token)

        await AuthRepository.remove_all_refresh_tokens(user)

        return {"message": "Logged out from all devices"}

    @staticmethod
    async def forgot_password(data: ForgotPasswordRequest) -> dict[str, str]:
        user = await AuthRepository.find_by_email(data.email)
        if not user:
            # Don't reveal if email exists
            return {"message": "If the email exists, a reset link has been sent"}

        token = generate_reset_token()
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await AuthRepository.set_password_reset_token(user, token, expires)

        await EmailService.send_password_reset_email(data.email, token, user.first_name)
        return {"message": "If the email exists, a reset link has been sent"}

    @staticmethod
    async def reset_password(data: ResetPasswordRequest) -> dict[str, str]:
        user = await AuthRepository.find_by_password_reset_token(data.token)
        if not user:
            raise AuthenticationError("Invalid or expired reset token")

        expires = user.password_reset_expires

        if expires:
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)

            if expires < datetime.now(timezone.utc):
                raise AuthenticationError("Reset token has expired")
            
        if data.new_password != data.confirm_password:
            raise AuthenticationError("Passwords do not match")

        is_valid, msg = validate_password_strength(data.new_password)
        if not is_valid:
            raise AuthenticationError(msg)

        new_hash = hash_password(data.new_password)
        await AuthRepository.reset_password(user, new_hash)

        user.refresh_tokens = []
        user.sessions = []

        if not hasattr(user, "password_history") or user.password_history is None:
            user.password_history = []

        user.password_history.append(user.password_hash)

        if len(user.password_history) > 5:
            user.password_history = user.password_history[-5:]

        await user.save()

        await log_password_reset(user.user_id)

        return {"message": "Password reset successfully. All sessions invalidated."}

    @staticmethod
    async def change_password(user_id: str, data: ChangePasswordRequest) -> dict[str, str]:
        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        if not verify_password(data.current_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")

        if data.current_password == data.new_password:
            raise AuthenticationError("New password must be different from current password")

        is_valid, msg = validate_password_strength(data.new_password)
        if not is_valid:
            raise AuthenticationError(msg)

        if hasattr(user, 'password_history') and user.password_history:
            for old_hash in user.password_history[-5:]:
                if verify_password(data.new_password, old_hash):
                    raise AuthenticationError("Cannot reuse a recent password")

        new_hash = hash_password(data.new_password)

        if not hasattr(user, 'password_history'):
            user.password_history = []
        user.password_history.append(user.password_hash)
        if len(user.password_history) > 5:
            user.password_history = user.password_history[-5:]

        await AuthRepository.change_password(user, new_hash)

        user.refresh_tokens = []
        user.sessions = []
        await user.save()

        await log_password_change(user_id)
        return {"message": "Password changed successfully. All sessions invalidated."}

    @staticmethod
    async def _get_social_counts(user_id: str) -> dict[str, int]:
        from app.models.connection import Connection, Follow, ConnectionStatus
        from app.models.post import Post
        from beanie.odm.operators.find.logical import And, Or

        followers = await Follow.find(
            Follow.following_id == user_id,
            Follow.following_type == "user",
        ).count()
        following = await Follow.find(Follow.follower_id == user_id).count()
        connections = await Connection.find(
            And(
                Or(Connection.sender_id == user_id, Connection.receiver_id == user_id),
                Connection.status == ConnectionStatus.ACCEPTED,
            )
        ).count()
        posts = await Post.find(Post.author_id == user_id, Post.is_deleted == False).count()
        return {
            "followers_count": followers,
            "following_count": following,
            "connections_count": connections,
            "posts_count": posts,
        }

    @staticmethod
    async def get_me(user_id: str) -> dict[str, Any]:
        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        convs = await Conversation.find(
            {"participant_ids": user_id},
            Conversation.is_deleted == False,
        ).to_list()
        unread_messages = sum(int((c.unread_counts or {}).get(user_id, 0)) for c in convs)
        counts = await AuthService._get_social_counts(user_id)

        return {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "country": user.country,
            "state": user.state,
            "city": user.city,
            "profile_photo": user.profile_photo,
            "cover_photo": user.cover_photo,
            "headline": user.headline,
            "bio": user.bio,
            "verification_status": user.verification_status.value if hasattr(user.verification_status, 'value') else user.verification_status,
            "email_verified": user.email_verified,
            "account_status": user.account_status.value if hasattr(user.account_status, 'value') else user.account_status,
            "profile_completion": user.profile_completion,
            "unread_messages_count": unread_messages,
            "created_at": user.created_at,
            **counts,
        }

    @staticmethod
    async def get_sessions(user_id: str) -> list[dict[str, Any]]:
        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user.sessions or []

    @staticmethod
    async def delete_session(user_id: str, session_id: str) -> dict[str, str]:
        user = await AuthRepository.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        if user.sessions:
            user.sessions = [s for s in user.sessions if s.get("session_id") != session_id]
            await AuthRepository.update_user(user)

        return {"message": "Session terminated"}
