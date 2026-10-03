import base64
import json
from typing import Any
from datetime import datetime


def encode_cursor(data: dict[str, Any]) -> str:
    return base64.urlsafe_b64encode(json.dumps(data, default=str).encode()).decode()


def decode_cursor(cursor: str) -> dict[str, Any]:
    try:
        return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
    except Exception:
        return {}


def build_cursor_query(field: str, cursor_value: Any, direction: str = "after") -> dict:
    if direction == "after":
        return {field: {"$gt": cursor_value}}
    return {field: {"$lt": cursor_value}}


def paginate_response(
    items: list,
    total: int,
    page: int,
    per_page: int,
    cursor_field: str = "_id",
    has_more: bool | None = None,
) -> dict[str, Any]:
    if has_more is None:
        has_more = page * per_page < total

    next_cursor = None
    prev_cursor = None

    if items and has_more:
        last_item = items[-1]
        cursor_data: dict[str, Any] = {"page": page + 1}
        if hasattr(last_item, cursor_field):
            cursor_data[cursor_field] = str(getattr(last_item, cursor_field))
        elif isinstance(last_item, dict) and cursor_field in last_item:
            cursor_data[cursor_field] = str(last_item[cursor_field])
        next_cursor = encode_cursor(cursor_data)

    if page > 1:
        prev_cursor = encode_cursor({"page": page - 1})

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        "has_more": has_more,
        "next_cursor": next_cursor,
        "prev_cursor": prev_cursor,
    }
