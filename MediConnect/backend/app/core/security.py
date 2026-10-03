import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any

import pyotp
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

revoked_tokens: set[str] = set()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str, expire_days: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=expire_days or settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": secrets.token_urlsafe(32),
    }
    return jwt.encode(payload, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    if token in revoked_tokens:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> dict[str, Any] | None:
    if token in revoked_tokens:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def revoke_token(token: str) -> None:
    revoked_tokens.add(token)


def generate_numeric_otp() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


def generate_otp_secret() -> str:
    return pyotp.random_base32()


def verify_otp(secret: str, otp: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(otp, valid_window=1)


def generate_reset_token() -> str:
    return secrets.token_urlsafe(64)


def generate_session_id() -> str:
    return secrets.token_urlsafe(32)


COMMON_PASSWORDS: set[str] = {
    "password", "password1", "password123", "123456", "12345678", "123456789",
    "qwerty", "abc123", "monkey", "master", "dragon", "login", "princess",
    "football", "shadow", "sunshine", "trustno1", "iloveyou", "batman",
    "access", "hello", "charlie", "letmein", "welcome", "password12",
    "admin", "admin123", "passw0rd", "p@ssword", "p@ssw0rd", "pass123",
    "1234567890", "000000", "111111", "abcdef", "password1!", "qwerty123",
    "1234qwer", "welcome1", "summer", "winter", "spring", "fall",
}


def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > 64:
        return False, "Password must be at most 64 characters long"
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common. Please choose a stronger password"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    if not any(not c.isalnum() for c in password):
        return False, "Password must contain at least one special character"
    return True, "Password is strong"
