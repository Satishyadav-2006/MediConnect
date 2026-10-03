"""Shared helpers for building employer/organizer-facing applicant and
registrant lists for jobs, internships and events."""

from typing import Any, Iterable

from beanie.odm.operators.find.comparison import In

from app.models.user import User


async def fetch_user_map(user_ids: Iterable[str]) -> dict[str, User]:
    ids = [uid for uid in dict.fromkeys(user_ids) if uid]
    if not ids:
        return {}
    users = await User.find(In(User.user_id, ids)).to_list()
    return {u.user_id: u for u in users}


def user_brief(user: User | None) -> dict[str, Any] | None:
    if not user:
        return None
    return {
        "user_id": user.user_id,
        "full_name": " ".join(
            part for part in (user.first_name, user.middle_name, user.last_name) if part
        ).strip() or user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "profile_photo": user.profile_photo,
        "headline": user.headline,
        "role": user.role,
        "specialization": user.specialization,
    }


async def enrich(rows: list[dict[str, Any]], user_key: str = "applicant_id") -> list[dict[str, Any]]:
    """Attach a `user` brief to each row, batching the user lookups."""
    users = await fetch_user_map(r.get(user_key) for r in rows)
    for row in rows:
        row["user"] = user_brief(users.get(row.get(user_key)))
    return rows
