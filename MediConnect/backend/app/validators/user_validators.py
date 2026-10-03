import re
from typing import Tuple


def validate_email(email: str) -> Tuple[bool, str]:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    if len(email) > 254:
        return False, "Email too long"
    return True, ""


def validate_phone(phone: str) -> Tuple[bool, str]:
    cleaned = re.sub(r'[\s\-\(\)+]', '', phone)
    if not cleaned.isdigit() or len(cleaned) < 7 or len(cleaned) > 15:
        return False, "Invalid phone number"
    return True, ""


def validate_password_strength(password: str) -> Tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > 64:
        return False, "Password must be at most 64 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain an uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain a lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain a number"
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]', password):
        return False, "Password must contain a special character"
    return True, ""


def validate_username(username: str) -> Tuple[bool, str]:
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 30:
        return False, "Username must be at most 30 characters"
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    reserved = ['admin', 'root', 'system', 'support', 'moderator', 'owner', 'superadmin']
    if username.lower() in reserved:
        return False, "This username is reserved"
    return True, ""
