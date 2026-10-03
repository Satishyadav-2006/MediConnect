from typing import Tuple
import re


def validate_post_content(content: str, max_length: int = 10000) -> Tuple[bool, str]:
    if not content or not content.strip():
        return False, "Post content cannot be empty"
    if len(content) > max_length:
        return False, f"Post content must be at most {max_length} characters"
    return True, ""


def validate_hashtags(hashtags: list[str]) -> Tuple[bool, str]:
    for tag in hashtags:
        if not re.match(r'^#[a-zA-Z0-9_]+$', tag):
            return False, f"Invalid hashtag format: {tag}"
        if len(tag) > 50:
            return False, f"Hashtag too long: {tag}"
    return True, ""


def validate_mentions(mentions: list[str]) -> Tuple[bool, str]:
    for mention in mentions:
        if not mention.startswith('@'):
            return False, f"Mention must start with @: {mention}"
        if len(mention) > 50:
            return False, f"Mention too long: {mention}"
    return True, ""
