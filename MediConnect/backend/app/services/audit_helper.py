"""Audit logging helper for recording security and admin events."""

import logging
import secrets
from datetime import datetime, timezone
from app.models.report import AuditLog

logger = logging.getLogger(__name__)


async def log_audit_event(
    actor_id: str,
    action: str,
    resource: str,
    target_id: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    ip_address: str = "",
    device_information: str = "",
) -> None:
    try:
        audit = AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource,
            resource_id=target_id or None,
            old_value={"value": old_value} if old_value else None,
            new_value={"value": new_value} if new_value else None,
            ip_address=ip_address,
            device_information=device_information,
        )
        await audit.insert()
    except Exception as e:
        logger.error("Failed to create audit log: %s", e)


async def log_registration(user_id: str, email: str) -> None:
    await log_audit_event(user_id, "registration", "user", user_id, new_value=email)


async def log_login(user_id: str, ip: str = "", device_information: str = "") -> None:
    await log_audit_event(user_id, "login", "session", user_id, ip_address=ip, device_information=device_information)


async def log_logout(user_id: str, ip: str = "") -> None:
    await log_audit_event(user_id, "logout", "session", user_id, ip_address=ip)


async def log_password_change(user_id: str) -> None:
    await log_audit_event(user_id, "password_change", "user", user_id)


async def log_password_reset(user_id: str) -> None:
    await log_audit_event(user_id, "password_reset", "user", user_id)


async def log_otp_request(user_id: str, email: str) -> None:
    await log_audit_event(user_id, "otp_request", "verification", user_id, new_value=email)


async def log_verification_status_change(actor_id: str, target_id: str, old_status: str, new_status: str) -> None:
    await log_audit_event(actor_id, "verification_status_change", "user", target_id, old_value=old_status, new_value=new_status)


async def log_role_change(actor_id: str, target_id: str, old_role: str, new_role: str) -> None:
    await log_audit_event(actor_id, "role_change", "user", target_id, old_value=old_role, new_value=new_role)


async def log_account_suspend(actor_id: str, target_id: str, reason: str = "") -> None:
    await log_audit_event(actor_id, "account_suspend", "user", target_id, new_value=reason)


async def log_account_delete(actor_id: str, target_id: str) -> None:
    await log_audit_event(actor_id, "account_delete", "user", target_id)


async def log_failed_login(email: str, ip: str = "") -> None:
    await log_audit_event("system", "failed_login", "auth", None, new_value=email, ip_address=ip)


async def log_permission_change(actor_id: str, target_id: str, old_perm: str, new_perm: str) -> None:
    await log_audit_event(actor_id, "permission_change", "user", target_id, old_value=old_perm, new_value=new_perm)


async def log_settings_update(actor_id: str, setting_key: str) -> None:
    await log_audit_event(actor_id, "settings_update", "platform_settings", None, new_value=setting_key)


async def log_announcement_create(actor_id: str, announcement_id: str) -> None:
    await log_audit_event(actor_id, "announcement_create", "announcement", announcement_id)
