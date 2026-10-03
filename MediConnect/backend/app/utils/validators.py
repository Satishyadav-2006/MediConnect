import re
from typing import Any
from bson import ObjectId


def validate_object_id(value: str) -> bool:
    return ObjectId.is_valid(value)


def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    pattern = r"^\+?[1-9]\d{6,14}$"
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    return bool(re.match(pattern, cleaned))


def validate_url(url: str) -> bool:
    pattern = r"^https?://[^\s/$.?#].[^\s]*$"
    return bool(re.match(pattern, url, re.IGNORECASE))


def validate_username(username: str) -> tuple[bool, str]:
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 30:
        return False, "Username must be at most 30 characters"
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return False, "Username can only contain letters, numbers, and underscores"
    reserved = {"admin", "moderator", "system", "support", "help", "api", "www", "mail"}
    if username.lower() in reserved:
        return False, "This username is reserved"
    return True, "Username is valid"


def sanitize_string(value: str) -> str:
    value = value.strip()
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"javascript:", "", value, flags=re.IGNORECASE)
    value = re.sub(r"on\w+\s*=", "", value, flags=re.IGNORECASE)
    return value


def validate_file_type(content_type: str, allowed_types: list[str]) -> bool:
    return content_type in allowed_types


def validate_file_size(size_bytes: int, max_size_bytes: int) -> bool:
    return 0 < size_bytes <= max_size_bytes


def extract_hashtags(text: str) -> list[str]:
    return list(set(re.findall(r"#(\w+)", text)))


def extract_mentions(text: str) -> list[str]:
    return list(set(re.findall(r"@(\w+)", text)))


def truncate_text(text: str, max_length: int = 200) -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
