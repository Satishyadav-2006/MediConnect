import logging
from datetime import datetime, timezone, timedelta
from typing import Any
from app.models.user import User
from app.models.post import Post
from app.models.connection import Connection
from app.models.job import Job, JobApplication
from app.models.internship import Internship, InternshipApplication
from app.models.event import Event, EventRegistration
from app.models.mentorship import MentorshipRequest, MentorshipSession
from app.models.report import Report, AuditLog
from app.models.base import JobStatus, InternshipStatus, EventStatus, AttendanceStatus

logger = logging.getLogger(__name__)


class AnalyticsService:

    @staticmethod
    async def get_dashboard_stats(period: str = "monthly") -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        total_users = await User.count()
        new_users_week = await User.find(User.created_at >= week_ago).count()
        new_users_month = await User.find(User.created_at >= month_ago).count()

        total_posts = await Post.find(Post.is_deleted == False).count()
        posts_week = await Post.find(Post.created_at >= week_ago, Post.is_deleted == False).count()

        active_jobs = await Job.find(Job.status == JobStatus.PUBLISHED, Job.is_deleted == False).count()
        active_internships = await Internship.find(Internship.status == InternshipStatus.PUBLISHED, Internship.is_deleted == False).count()
        upcoming_events = await Event.find(Event.status == EventStatus.PUBLISHED, Event.start_datetime >= now, Event.is_deleted == False).count()
        active_mentorships = await MentorshipRequest.find(MentorshipRequest.status == "accepted").count()

        total_connections = await Connection.find(Connection.status == "accepted").count()

        return {
            "users": {"total": total_users, "new_week": new_users_week, "new_month": new_users_month},
            "posts": {"total": total_posts, "new_week": posts_week},
            "jobs": {"active": active_jobs},
            "internships": {"active": active_internships},
            "events": {"upcoming": upcoming_events},
            "mentorships": {"active": active_mentorships},
            "connections": {"total": total_connections},
        }

    PERIOD_DAYS = {"daily": 1, "weekly": 7, "monthly": 30, "quarterly": 90, "yearly": 365}

    @staticmethod
    def _period_days(period: str) -> int:
        return AnalyticsService.PERIOD_DAYS.get((period or "").lower(), 30)

    @staticmethod
    def _growth_pct(current: int, previous: int) -> float:
        if previous <= 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    @staticmethod
    async def get_admin_platform_analytics(period: str = "monthly") -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        days = AnalyticsService._period_days(period)
        period_ago = now - timedelta(days=days)
        prev_start = period_ago - timedelta(days=days)

        total_users = await User.count()
        total_posts = await Post.find(Post.is_deleted == False).count()
        active_jobs = await Job.find(Job.status == JobStatus.PUBLISHED, Job.is_deleted == False).count()
        active_internships = await Internship.find(Internship.status == InternshipStatus.PUBLISHED, Internship.is_deleted == False).count()
        total_events = await Event.find(Event.is_deleted == False).count()
        upcoming_events = await Event.find(
            Event.status == EventStatus.PUBLISHED, Event.start_datetime >= now, Event.is_deleted == False
        ).count()
        total_connections = await Connection.find(Connection.status == "accepted").count()
        active_mentorships = await MentorshipRequest.find(MentorshipRequest.status == "accepted").count()

        prev_users = await User.find(User.created_at >= prev_start, User.created_at < period_ago).count()
        prev_posts = await Post.find(Post.created_at >= prev_start, Post.created_at < period_ago, Post.is_deleted == False).count()
        prev_jobs = await Job.find(
            Job.created_at >= prev_start, Job.created_at < period_ago, Job.is_deleted == False
        ).count()
        prev_events = await Event.find(
            Event.created_at >= prev_start, Event.created_at < prev_start + timedelta(days=days), Event.is_deleted == False
        ).count()

        new_signups = await User.find(User.created_at >= period_ago).count()
        active_since_period = await User.find(User.last_login >= period_ago).count()

        growth_points = min(days, 30)
        user_growth: list[dict[str, Any]] = []
        for i in range(growth_points):
            day_start = now - timedelta(days=growth_points - i)
            day_end = day_start + timedelta(days=1)
            count = await User.find(User.created_at >= day_start, User.created_at < day_end).count()
            user_growth.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "label": day_start.strftime("%d %b"),
                "count": count,
            })

        role_counts: dict[str, int] = {}
        for role in await User.distinct("role"):
            role_counts[str(role)] = await User.find(User.role == role).count()
        users_by_role = [
            {"role": role, "count": count}
            for role, count in sorted(role_counts.items(), key=lambda kv: kv[1], reverse=True)
        ]

        users_coll = User.get_motor_collection()

        location_counts: dict[str, int] = {}
        async for row in users_coll.aggregate([
            {
                "$group": {
                    "_id": {
                        "city": {"$ifNull": ["$city", ""]},
                        "state": {"$ifNull": ["$state", ""]},
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 8},
        ]):
            parts = [str(p).strip() for p in (row["_id"].get("city"), row["_id"].get("state")) if p and str(p).strip()]
            label = " / ".join(parts) or "Unknown"
            location_counts[label] = row["count"]
        top_locations = [{"location": loc, "count": cnt} for loc, cnt in location_counts.items()]

        spec_counts: dict[str, int] = {}
        async for row in users_coll.aggregate([
            {
                "$group": {
                    "_id": {"$ifNull": ["$specialization", ""]},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 8},
        ]):
            name = str(row["_id"]).strip() or "Unspecified"
            spec_counts[name] = row["count"]
        top_specializations = [{"name": name, "count": cnt} for name, cnt in spec_counts.items()]

        return {
            "period": period,
            "period_days": days,
            "totals": {
                "totalUsers": total_users,
                "totalPosts": total_posts,
                "activeJobs": active_jobs,
                "activeInternships": active_internships,
                "totalEvents": total_events,
                "upcomingEvents": upcoming_events,
                "totalConnections": total_connections,
                "activeMentorships": active_mentorships,
            },
            "growth": {
                "usersGrowth": AnalyticsService._growth_pct(new_signups, prev_users),
                "postsGrowth": AnalyticsService._growth_pct(
                    await Post.find(Post.created_at >= period_ago, Post.is_deleted == False).count(), prev_posts
                ),
                "jobsGrowth": AnalyticsService._growth_pct(
                    await Job.find(Job.created_at >= period_ago, Job.is_deleted == False).count(), prev_jobs
                ),
                "eventsGrowth": AnalyticsService._growth_pct(
                    await Event.find(Event.created_at >= period_ago, Event.is_deleted == False).count(), prev_events
                ),
            },
            "userGrowthData": user_growth,
            "usersByRole": users_by_role,
            "topLocations": top_locations,
            "topSpecializations": top_specializations,
            "platformHealth": {
                "dailyActiveUsers": active_since_period,
                "newSignups": new_signups,
                "retentionRate": round((active_since_period / total_users) * 100, 1) if total_users else 0.0,
                "avgSessionDuration": "N/A",
            },
        }

    @staticmethod
    async def get_user_analytics(user_id: str) -> dict[str, Any]:
        from app.models.post import Reaction, Bookmark
        from app.models.comment import Comment

        user = await User.find_one(User.user_id == user_id)
        if not user:
            return {}

        posts = await Post.find(Post.author_id == user_id, Post.is_deleted == False).count()
        reactions = await Reaction.find(Reaction.user_id == user_id).count()
        bookmarks = await Bookmark.find(Bookmark.user_id == user_id).count()
        comments = await Comment.find(Comment.author_id == user_id, Comment.is_deleted == False).count()
        job_apps = await JobApplication.find(JobApplication.applicant_id == user_id).count()
        internship_apps = await InternshipApplication.find(InternshipApplication.applicant_id == user_id).count()
        event_regs = await EventRegistration.find(EventRegistration.user_id == user_id).count()
        mentorships = await MentorshipRequest.find(MentorshipRequest.mentee_id == user_id).count()

        from app.models.connection import Follow
        followers = await Follow.find(Follow.following_id == user_id, Follow.following_type == "user").count()
        following = await Follow.find(Follow.follower_id == user_id).count()
        connections = await Connection.find(
            Connection.status == "accepted",
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        ).count()

        return {
            "profile_views": 0,
            "posts": posts,
            "reactions_given": reactions,
            "bookmarks": bookmarks,
            "comments": comments,
            "job_applications": job_apps,
            "internship_applications": internship_apps,
            "event_registrations": event_regs,
            "mentorships": mentorships,
            "followers": followers,
            "following": following,
            "connections": connections,
        }

    @staticmethod
    async def get_profile_analytics(user_id: str, period: str | None = None) -> dict[str, Any]:
        from app.models.profile_view import ProfileView
        from app.models.connection import Follow

        days = 30
        if period:
            try:
                days = max(1, min(365, int(str(period).replace("d", ""))))
            except (TypeError, ValueError):
                days = 30

        now = datetime.now(timezone.utc)
        since = now - timedelta(days=days)
        prev_start = since - timedelta(days=days)

        def trend(current: int, previous: int) -> int:
            if previous <= 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100)

        profile_views = await ProfileView.find(
            ProfileView.profile_user_id == user_id,
            ProfileView.viewed_at >= since,
        ).count()
        profile_views_prev = await ProfileView.find(
            ProfileView.profile_user_id == user_id,
            ProfileView.viewed_at >= prev_start,
            ProfileView.viewed_at < since,
        ).count()

        posts = await Post.find(Post.author_id == user_id, Post.is_deleted == False).to_list()
        post_impressions = sum(p.view_count or 0 for p in posts)

        new_followers = await Follow.find(
            Follow.following_id == user_id,
            Follow.following_type == "user",
            Follow.created_at >= since,
        ).count()
        new_followers_prev = await Follow.find(
            Follow.following_id == user_id,
            Follow.following_type == "user",
            Follow.created_at >= prev_start,
            Follow.created_at < since,
        ).count()
        new_connections = await Connection.find(
            Connection.status == "accepted",
            Connection.created_at >= since,
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        ).count()
        new_connections_prev = await Connection.find(
            Connection.status == "accepted",
            Connection.created_at >= prev_start,
            Connection.created_at < since,
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        ).count()

        connection_growth = new_followers + new_connections
        connection_growth_prev = new_followers_prev + new_connections_prev

        top_posts = sorted(
            posts,
            key=lambda p: (p.reaction_count or 0) * 3
            + (p.comment_count or 0) * 4
            + (p.share_count or 0) * 5
            + (p.view_count or 0) * 0.1,
            reverse=True,
        )[:5]
        top_posts_dto = [
            {
                "_id": p.post_id,
                "post_id": p.post_id,
                "author_id": p.author_id,
                "content": p.content,
                "createdAt": p.created_at.isoformat() if p.created_at else None,
                "likesCount": p.reaction_count or 0,
                "commentsCount": p.comment_count or 0,
                "sharesCount": p.share_count or 0,
                "viewCount": p.view_count or 0,
            }
            for p in top_posts
        ]

        views_in_period = await ProfileView.find(
            ProfileView.profile_user_id == user_id,
            ProfileView.viewed_at >= since,
        ).to_list()
        by_date: dict[str, int] = {}
        by_country: dict[str, int] = {}
        for v in views_in_period:
            day = v.viewed_at.strftime("%Y-%m-%d") if v.viewed_at else ""
            if day:
                by_date[day] = by_date.get(day, 0) + 1
            country = v.viewer_country or "Unknown"
            by_country[country] = by_country.get(country, 0) + 1

        views_by_date = [{"date": d, "count": c} for d, c in sorted(by_date.items())]
        viewer_demographics = [
            {"location": loc, "count": c}
            for loc, c in sorted(by_country.items(), key=lambda kv: kv[1], reverse=True)[:5]
        ]

        return {
            "profileViews": profile_views,
            "profileViewsTrend": trend(profile_views, profile_views_prev),
            "postImpressions": post_impressions,
            "postImpressionsTrend": 0,
            "searchAppearances": 0,
            "searchAppearancesTrend": 0,
            "connectionGrowth": connection_growth,
            "connectionGrowthTrend": trend(connection_growth, connection_growth_prev),
            "topPosts": top_posts_dto,
            "viewsByDate": views_by_date,
            "viewerDemographics": viewer_demographics,
        }

    @staticmethod
    async def get_post_analytics(user_id: str) -> dict[str, Any]:
        from app.models.post import Reaction
        from app.models.comment import Comment
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        posts = await Post.find(Post.author_id == user_id, Post.is_deleted == False).to_list()
        total_posts = len(posts)
        posts_week = sum(
            1 for p in posts
            if p.created_at
            and p.created_at.replace(tzinfo=timezone.utc) >= week_ago
        )
        total_reactions = sum(p.reaction_count for p in posts)
        total_comments = sum(p.comment_count for p in posts)
        total_views = sum(p.view_count for p in posts)
        post_ids = [p.post_id for p in posts]

        reactions_week = await Reaction.find(
            Reaction.created_at >= week_ago,
            {"post_id": {"$in": post_ids}},
        ).count() if post_ids else 0

        return {
            "total_posts": total_posts,
            "posts_this_week": posts_week,
            "total_reactions": total_reactions,
            "total_comments": total_comments,
            "total_views": total_views,
            "reactions_this_week": reactions_week,
        }

    @staticmethod
    async def get_connection_analytics(user_id: str) -> dict[str, Any]:
        from app.models.connection import Follow
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        followers = await Follow.find(Follow.following_id == user_id, Follow.following_type == "user").count()
        following = await Follow.find(Follow.follower_id == user_id).count()
        connections = await Connection.find(
            Connection.status == "accepted",
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        ).count()
        new_followers_week = await Follow.find(
            Follow.following_id == user_id, Follow.following_type == "user", Follow.created_at >= week_ago
        ).count()
        new_connections_week = await Connection.find(
            Connection.status == "accepted",
            Connection.created_at >= week_ago,
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        ).count()

        return {
            "followers": followers,
            "following": following,
            "connections": connections,
            "new_followers_week": new_followers_week,
            "new_connections_week": new_connections_week,
        }

    @staticmethod
    async def get_search_appearances(user_id: str) -> dict[str, Any]:
        return {
            "total": 0,
            "searches": [],
            "top_keywords": [],
        }

    @staticmethod
    async def get_content_analytics() -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        total_posts = await Post.find(Post.is_deleted == False).count()
        posts_week = await Post.find(Post.created_at >= week_ago, Post.is_deleted == False).count()

        from app.models.post import Reaction
        total_reactions = await Reaction.count()

        from app.models.comment import Comment
        total_comments = await Comment.find(Comment.is_deleted == False).count()

        return {
            "posts": {"total": total_posts, "this_week": posts_week},
            "reactions": {"total": total_reactions},
            "comments": {"total": total_comments},
        }

    @staticmethod
    async def get_engagement_stats() -> dict[str, Any]:
        from app.models.post import Reaction
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        reactions_week = await Reaction.find(Reaction.created_at >= week_ago).count()
        from app.models.comment import Comment
        comments_week = await Comment.find(Comment.created_at >= week_ago, Comment.is_deleted == False).count()
        from app.models.connection import Connection
        connections_week = await Connection.find(Connection.created_at >= week_ago, Connection.status == "accepted").count()

        return {
            "reactions_this_week": reactions_week,
            "comments_this_week": comments_week,
            "new_connections_this_week": connections_week,
        }

    @staticmethod
    async def get_recruitment_analytics() -> dict[str, Any]:
        total_jobs = await Job.find(Job.is_deleted == False).count()
        active_jobs = await Job.find(Job.status == JobStatus.PUBLISHED, Job.is_deleted == False).count()
        total_applications = await JobApplication.count()
        pending_applications = await JobApplication.find(JobApplication.status == "pending").count()
        offered_applications = await JobApplication.find(JobApplication.status == "offered").count()
        accepted_applications = await JobApplication.find(JobApplication.status == "accepted").count()
        rejected_applications = await JobApplication.find(JobApplication.status == "rejected").count()

        total_internships = await Internship.find(Internship.is_deleted == False).count()
        active_internships = await Internship.find(Internship.status == InternshipStatus.PUBLISHED, Internship.is_deleted == False).count()
        internship_apps = await InternshipApplication.count()

        return {
            "jobs": {"total": total_jobs, "active": active_jobs},
            "applications": {
                "total": total_applications,
                "pending": pending_applications,
                "offered": offered_applications,
                "accepted": accepted_applications,
                "rejected": rejected_applications,
            },
            "internships": {"total": total_internships, "active": active_internships, "applications": internship_apps},
        }

    @staticmethod
    async def get_event_analytics() -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        total_events = await Event.find(Event.is_deleted == False).count()
        upcoming_events = await Event.find(Event.status == EventStatus.PUBLISHED, Event.start_datetime >= now, Event.is_deleted == False).count()
        completed_events = await Event.find(Event.status == "completed", Event.is_deleted == False).count()
        total_registrations = await EventRegistration.count()
        checked_in = await EventRegistration.find(EventRegistration.attendance_status == AttendanceStatus.PRESENT).count()
        certificates_issued = await EventRegistration.find(EventRegistration.certificate_issued == True).count()

        return {
            "events": {"total": total_events, "upcoming": upcoming_events, "completed": completed_events},
            "registrations": {"total": total_registrations, "checked_in": checked_in},
            "certificates_issued": certificates_issued,
        }

    @staticmethod
    async def get_mentorship_analytics() -> dict[str, Any]:
        total_mentorships = await MentorshipRequest.count()
        active_mentorships = await MentorshipRequest.find(MentorshipRequest.status == "accepted").count()
        completed_mentorships = await MentorshipRequest.find(MentorshipRequest.status == "completed").count()

        from motor.motor_asyncio import AsyncIOMotorDatabase
        from app.core.database import get_database
        db = await get_database()
        pipeline = [
            {"$match": {"status": "completed", "rating": {"$gt": 0}}},
            {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "total_sessions": {"$sum": 1}}}
        ]
        result = await db.mentorship_sessions.aggregate(pipeline).to_list(1)
        avg_rating = result[0]["avg_rating"] if result else 0
        total_sessions_completed = result[0]["total_sessions"] if result else 0

        return {
            "mentorships": {"total": total_mentorships, "active": active_mentorships, "completed": completed_mentorships},
            "sessions": {"completed": total_sessions_completed, "average_rating": round(avg_rating, 2)},
        }

    @staticmethod
    async def get_security_analytics() -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        failed_logins_week = await AuditLog.find(
            AuditLog.action == "failed_login",
            AuditLog.created_at >= week_ago,
        ).count()
        failed_logins_month = await AuditLog.find(
            AuditLog.action == "failed_login",
            AuditLog.created_at >= month_ago,
        ).count()
        suspended_users = await User.find(User.account_status == "suspended").count()
        pending_reports = await Report.find(Report.status == "pending").count()
        resolved_reports_week = await Report.find(
            Report.status == "resolved",
            Report.reviewed_at >= week_ago,
        ).count()

        return {
            "failed_logins": {"this_week": failed_logins_week, "this_month": failed_logins_month},
            "suspended_users": suspended_users,
            "reports": {"pending": pending_reports, "resolved_this_week": resolved_reports_week},
        }
