import re
from typing import Tuple
from bson import ObjectId


def validate_object_id(value: str) -> Tuple[bool, str]:
    if not ObjectId.is_valid(value):
        return False, "Invalid ObjectId format"
    return True, ""


def validate_url(url: str) -> Tuple[bool, str]:
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    if not re.match(pattern, url):
        return False, "Invalid URL format"
    return True, ""


ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]


def validate_file_type(content_type: str, allowed_types: list[str] | None = None) -> Tuple[bool, str]:
    allowed = allowed_types or (ALLOWED_IMAGE_TYPES + ALLOWED_VIDEO_TYPES + ALLOWED_DOCUMENT_TYPES)
    if content_type not in allowed:
        return False, f"File type {content_type} is not allowed"
    return True, ""


def validate_file_size(size_bytes: int, max_mb: float = 10) -> Tuple[bool, str]:
    max_bytes = int(max_mb * 1024 * 1024)
    if size_bytes > max_bytes:
        return False, f"File size must be at most {max_mb}MB"
    return True, ""


def validate_date(date_str: str) -> Tuple[bool, str]:
    from datetime import datetime
    try:
        datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return True, ""
    except (ValueError, AttributeError):
        return False, "Invalid date format"
