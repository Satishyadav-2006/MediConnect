from typing import AsyncGenerator

from fastapi import Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_access_token


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    db = await get_database()
    yield db


async def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise AuthenticationError("Missing or invalid authorization header")

    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)

    if payload is None:
        raise AuthenticationError("Invalid or expired access token")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload")

    request.state.user_id = user_id
    request.state.token_payload = payload
    return user_id


async def get_optional_user_id(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)

    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id:
        request.state.user_id = user_id
        request.state.token_payload = payload
    return user_id


async def get_current_user_role(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if not role:
        raise AuthorizationError("Role not found in token")
    return role


def require_role(*allowed_roles: str):
    async def role_checker(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> str:
        role = getattr(request.state, "token_payload", {}).get("role")
        if role not in allowed_roles:
            raise AuthorizationError(
                f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return role

    return role_checker


async def get_current_verified_user(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    email_verified = getattr(
        request.state, "token_payload", {}
    ).get("email_verified", False)
    if not email_verified:
        raise AuthorizationError("Email verification required")
    return user_id


async def get_current_organization(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if role not in ("hospital", "clinic", "medical_college", "nursing_college", "pharmacy_college", "allied_health_college", "owner"):
        raise AuthorizationError("Organization account required")
    return user_id


async def get_current_recruiter(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if role not in ("hr", "recruiter", "placement_officer", "admin", "super_admin", "owner"):
        raise AuthorizationError("Recruiter role required")
    return user_id


async def get_current_recruiter_or_organization(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if role not in (
        "hospital", "clinic", "medical_college", "nursing_college", "pharmacy_college", "allied_health_college",
        "hr", "recruiter", "placement_officer",
        "moderator", "admin", "super_admin", "owner",
    ):
        raise AuthorizationError("Recruiter or organization role required")
    return user_id


async def get_current_admin(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if role not in ("admin", "super_admin", "owner"):
        raise AuthorizationError("Admin role required")
    return user_id


async def get_current_super_admin(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if role not in ("super_admin", "owner"):
        raise AuthorizationError("Super Admin role required")
    return user_id


async def get_current_owner(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> str:
    role = getattr(request.state, "token_payload", {}).get("role")
    if role != "owner":
        raise AuthorizationError("Owner role required")
    return user_id
