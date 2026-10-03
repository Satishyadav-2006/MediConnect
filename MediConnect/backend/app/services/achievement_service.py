import logging
import secrets
from datetime import datetime, timezone
from typing import Any

from app.models.achievement import Achievement, UserAchievement
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundError

logger = logging.getLogger(__name__)

ACHIEVEMENT_DEFINITIONS: list[dict[str, Any]] = [
    {
        "achievement_id": "profile_completed",
        "name": "Profile Completed",
        "slug": "profile_completed",
        "description": "Completed your professional profile to 100%",
        "category": "profile",
        "icon": "user-check",
        "points": 50,
        "tier": "bronze",
        "metric": "profile_completion",
        "threshold": 100,
    },
    {
        "achievement_id": "verified_professional",
        "name": "Verified Professional",
        "slug": "verified_professional",
        "description": "Professional verification approved by MediConnect",
        "category": "profile",
        "icon": "shield-check",
        "points": 100,
        "tier": "silver",
        "metric": "verification_approved",
        "threshold": 1,
    },
    {
        "achievement_id": "first_connection",
        "name": "First Connection",
        "slug": "first_connection",
        "description": "Made your first professional connection",
        "category": "networking",
        "icon": "link",
        "points": 10,
        "tier": "bronze",
        "metric": "connections_count",
        "threshold": 1,
    },
    {
        "achievement_id": "100_connections",
        "name": "100 Connections",
        "slug": "100_connections",
        "description": "Built a network of 100 professional connections",
        "category": "networking",
        "icon": "users",
        "points": 100,
        "tier": "silver",
        "metric": "connections_count",
        "threshold": 100,
    },
    {
        "achievement_id": "500_connections",
        "name": "500 Connections",
        "slug": "500_connections",
        "description": "Built a network of 500 professional connections",
        "category": "networking",
        "icon": "network",
        "points": 250,
        "tier": "gold",
        "metric": "connections_count",
        "threshold": 500,
    },
    {
        "achievement_id": "first_post",
        "name": "First Post",
        "slug": "first_post",
        "description": "Published your first post on MediConnect",
        "category": "engagement",
        "icon": "edit",
        "points": 10,
        "tier": "bronze",
        "metric": "posts_count",
        "threshold": 1,
    },
    {
        "achievement_id": "100_likes",
        "name": "100 Likes",
        "slug": "100_likes",
        "description": "Received 100 likes across all your posts",
        "category": "engagement",
        "icon": "heart",
        "points": 75,
        "tier": "silver",
        "metric": "total_likes_received",
        "threshold": 100,
    },
    {
        "achievement_id": "1000_profile_views",
        "name": "1000 Profile Views",
        "slug": "1000_profile_views",
        "description": "Your profile has been viewed 1000 times",
        "category": "engagement",
        "icon": "eye",
        "points": 100,
        "tier": "silver",
        "metric": "profile_views",
        "threshold": 1000,
    },
    {
        "achievement_id": "top_contributor",
        "name": "Top Contributor",
        "slug": "top_contributor",
        "description": "Recognized as a top contributor on the platform",
        "category": "recognition",
        "icon": "trophy",
        "points": 200,
        "tier": "gold",
        "metric": "posts_count",
        "threshold": 50,
    },
    {
        "achievement_id": "mentor_approved",
        "name": "Mentor Approved",
        "slug": "mentor_approved",
        "description": "Approved as a mentor on MediConnect",
        "category": "mentorship",
        "icon": "graduation-cap",
        "points": 150,
        "tier": "silver",
        "metric": "mentor_status",
        "threshold": 1,
    },
    {
        "achievement_id": "research_published",
        "name": "Research Published",
        "slug": "research_published",
        "description": "Published a research paper or article on MediConnect",
        "category": "research",
        "icon": "book-open",
        "points": 150,
        "tier": "silver",
        "metric": "research_publications_count",
        "threshold": 1,
    },
    {
        "achievement_id": "event_speaker",
        "name": "Event Speaker",
        "slug": "event_speaker",
        "description": "Listed as a speaker at a medical event",
        "category": "events",
        "icon": "mic",
        "points": 100,
        "tier": "silver",
        "metric": "event_speaker_count",
        "threshold": 1,
    },
    {
        "achievement_id": "organization_verified",
        "name": "Organization Verified",
        "slug": "organization_verified",
        "description": "Your organization has been verified on MediConnect",
        "category": "organization",
        "icon": "building-check",
        "points": 200,
        "tier": "gold",
        "metric": "organization_verified",
        "threshold": 1,
    },
    {
        "achievement_id": "recruitment_milestone",
        "name": "Recruitment Milestone",
        "slug": "recruitment_milestone",
        "description": "Successfully recruited or placed 10 candidates",
        "category": "recruitment",
        "icon": "briefcase",
        "points": 150,
        "tier": "silver",
        "metric": "recruitment_count",
        "threshold": 10,
    },
]


class AchievementService:

    @staticmethod
    async def seed_achievements() -> None:
        for defn in ACHIEVEMENT_DEFINITIONS:
            existing = await Achievement.find_one(Achievement.slug == defn["slug"])
            if not existing:
                achievement = Achievement(**defn)
                await achievement.insert()

    @staticmethod
    async def get_all_achievements() -> list[dict[str, Any]]:
        achievements = await Achievement.find(Achievement.is_active == True).to_list()
        return [
            {
                "achievement_id": a.achievement_id,
                "name": a.name,
                "slug": a.slug,
                "description": a.description,
                "category": a.category,
                "icon": a.icon,
                "points": a.points,
                "tier": a.tier,
            }
            for a in achievements
        ]

    @staticmethod
    async def get_user_achievements(user_id: str) -> list[dict[str, Any]]:
        user_achievements = await UserAchievement.find(
            UserAchievement.user_id == user_id
        ).to_list()

        achievement_ids = [ua.achievement_id for ua in user_achievements]
        achievements = await Achievement.find(
            {"achievement_id": {"$in": achievement_ids}}
        ).to_list()
        achievement_map = {a.achievement_id: a for a in achievements}

        ua_map = {ua.achievement_id: ua for ua in user_achievements}

        result = []
        for aid, ua in ua_map.items():
            a = achievement_map.get(aid)
            if a:
                result.append({
                    "achievement_id": a.achievement_id,
                    "name": a.name,
                    "slug": a.slug,
                    "description": a.description,
                    "category": a.category,
                    "icon": a.icon,
                    "points": a.points,
                    "tier": a.tier,
                    "progress": ua.progress,
                    "max_progress": ua.max_progress,
                    "earned": ua.earned,
                    "earned_at": ua.earned_at,
                })

        result.sort(key=lambda x: (-x["earned"], -x["progress"]))
        return result

    @staticmethod
    async def get_user_achievements_with_all(user_id: str) -> list[dict[str, Any]]:
        all_achievements = await Achievement.find(Achievement.is_active == True).to_list()
        user_achievements = await UserAchievement.find(
            UserAchievement.user_id == user_id
        ).to_list()

        ua_map = {ua.achievement_id: ua for ua in user_achievements}

        result = []
        for a in all_achievements:
            ua = ua_map.get(a.achievement_id)
            result.append({
                "achievement_id": a.achievement_id,
                "name": a.name,
                "slug": a.slug,
                "description": a.description,
                "category": a.category,
                "icon": a.icon,
                "points": a.points,
                "tier": a.tier,
                "progress": ua.progress if ua else 0,
                "max_progress": ua.max_progress if ua else 1,
                "earned": ua.earned if ua else False,
                "earned_at": ua.earned_at if ua else None,
            })

        result.sort(key=lambda x: (-x["earned"], x["name"]))
        return result

    @staticmethod
    async def get_leaderboard(limit: int = 20) -> list[dict[str, Any]]:
        from app.models.achievement import UserAchievement as UA

        pipeline = [
            {"$match": {"earned": True}},
            {"$group": {
                "_id": "$user_id",
                "total_points": {"$sum": 1},
                "achievements_count": {"$sum": 1},
            }},
            {"$sort": {"total_points": -1, "achievements_count": -1}},
            {"$limit": limit},
        ]

        from app.core.database import get_database
        db = await get_database()
        raw = await db.user_achievements.aggregate(pipeline).to_list(length=limit)

        entries = []
        for entry in raw:
            uid = entry["_id"]
            user = await UserRepository.find_by_user_id(uid)
            if user:
                total_points = 0
                user_achs = await UA.find(
                    UA.user_id == uid, UA.earned == True
                ).to_list()
                ach_ids = [ua.achievement_id for ua in user_achs]
                if ach_ids:
                    achs = await Achievement.find(
                        {"achievement_id": {"$in": ach_ids}}
                    ).to_list()
                    total_points = sum(a.points for a in achs)

                entries.append({
                    "user_id": uid,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "profile_photo": user.profile_photo,
                    "total_points": total_points,
                    "achievements_count": entry["achievements_count"],
                })

        return entries

    @staticmethod
    async def check_and_award_achievements(user_id: str) -> list[str]:
        user = await UserRepository.find_by_user_id(user_id)
        if not user:
            return []

        earned_slugs: list[str] = []

        metric_values = SettingsService._get_metric_values(user)

        all_achievements = await Achievement.find(Achievement.is_active == True).to_list()

        for achievement in all_achievements:
            ua = await UserAchievement.find_one(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.achievement_id,
            )

            current_value = metric_values.get(achievement.metric, 0)
            threshold = achievement.threshold

            if ua:
                if ua.earned:
                    continue
                ua.progress = min(current_value, threshold)
                if current_value >= threshold:
                    ua.earned = True
                    ua.earned_at = datetime.now(timezone.utc)
                    earned_slugs.append(achievement.slug)
                await ua.save()
            else:
                is_earned = current_value >= threshold
                ua = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.achievement_id,
                    progress=min(current_value, threshold),
                    max_progress=threshold,
                    earned=is_earned,
                    earned_at=datetime.now(timezone.utc) if is_earned else None,
                )
                await ua.insert()
                if is_earned:
                    earned_slugs.append(achievement.slug)

        return earned_slugs

    @staticmethod
    def _get_metric_values(user: Any) -> dict[str, int]:
        return {
            "profile_completion": user.profile_completion or 0,
            "verification_approved": 1 if (
                hasattr(user.verification_status, "value")
                and user.verification_status.value == "approved"
            ) or user.verification_status == "approved" else 0,
            "connections_count": getattr(user, "connections_count", 0) or 0,
            "posts_count": getattr(user, "posts_count", 0) or 0,
            "total_likes_received": sum(
                getattr(p, "reaction_count", 0)
                for p in []
            ),
            "profile_views": 0,
            "mentor_status": 1 if getattr(user, "maximum_mentees", None) and user.maximum_mentees > 0 else 0,
            "research_publications_count": len(user.research_publications or []),
            "event_speaker_count": 0,
            "organization_verified": 0,
            "recruitment_count": 0,
        }
