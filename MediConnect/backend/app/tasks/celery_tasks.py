import logging
from datetime import datetime, timezone
from typing import Any
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.expire_jobs")
def expire_jobs_task(self):
    async def _run():
        from app.models.job import Job
        from app.models.base import JobStatus
        expired = await Job.find(
            Job.status == JobStatus.ACTIVE,
            Job.deadline != None,
            Job.deadline < datetime.now(timezone.utc),
        ).to_list()
        for job in expired:
            job.status = JobStatus.EXPIRED
            job.updated_at = datetime.now(timezone.utc)
            await job.save()
        logger.info("Expired %d jobs", len(expired))
        return {"expired_jobs": len(expired)}
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.expire_otps")
def expire_otps_task(self):
    async def _run():
        from app.models.user import User
        now = datetime.now(timezone.utc)
        users = await User.find(
            User.otp_expires_at != None,
            User.otp_expires_at < now,
            User.otp_secret != None,
        ).to_list()
        for user in users:
            user.otp_secret = None
            user.otp_code = None
            user.otp_expires_at = None
            user.updated_at = now
            await user.save()
        logger.info("Expired OTPs for %d users", len(users))
        return {"expired_otps": len(users)}
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.cleanup_tokens")
def cleanup_tokens_task(self):
    async def _run():
        from app.models.user import User
        now = datetime.now(timezone.utc)
        users = await User.find(User.refresh_tokens != []).to_list()
        cleaned = 0
        for user in users:
            original_count = len(user.refresh_tokens or [])
            user.refresh_tokens = [
                t for t in (user.refresh_tokens or [])
                if hasattr(t, "expires_at") and t.expires_at > now
            ]
            if len(user.refresh_tokens) != original_count:
                await user.save()
                cleaned += 1
        logger.info("Cleaned tokens for %d users", cleaned)
        return {"cleaned_users": cleaned}
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.event_reminders")
def event_reminders_task(self):
    async def _run():
        from app.models.event import Event
        from app.services.notification_helper import notify_event_reminder
        now = datetime.now(timezone.utc)
        from datetime import timedelta
        tomorrow = now + timedelta(days=1)
        events = await Event.find(
            Event.start_datetime > now,
            Event.start_datetime < tomorrow,
            Event.is_deleted == False,
        ).to_list()
        for event in events:
            logger.info("Event reminder: %s", event.title)
        return {"reminders_sent": len(events)}
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.send_email")
def send_email_task(self, to: str, subject: str, body: str):
    async def _run():
        from app.emails.service import EmailService
        await EmailService.send_email(to, subject, body)
        logger.info("Email sent to %s", to)
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.send_otp_email")
def send_otp_email_task(self, to: str, otp: str):
    async def _run():
        from app.emails.service import EmailService
        await EmailService.send_otp_email(to, otp)
        logger.info("OTP email sent to %s", to)
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.send_welcome_email")
def send_welcome_email_task(self, to: str, name: str):
    async def _run():
        from app.emails.service import EmailService
        await EmailService.send_welcome_email(to, name)
        logger.info("Welcome email sent to %s", to)
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.push_notification")
def push_notification_task(self, user_id: str, title: str, body: str, data: dict | None = None):
    async def _run():
        from app.services.push_notification_service import PushNotificationService
        await PushNotificationService.send_to_user(user_id, title, body, data or {})
        logger.info("Push notification sent to %s", user_id)
    import asyncio
    return asyncio.run(_run())


@celery_app.task(bind=True, name="tasks.analytics_aggregation")
def analytics_aggregation_task(self):
    async def _run():
        from app.models.user import User
        from app.models.post import Post
        from app.models.job import Job
        from app.models.event import Event
        total_users = await User.count()
        total_posts = await Post.find(Post.is_deleted == False).count()
        total_jobs = await Job.find(Job.is_deleted == False).count()
        total_events = await Event.find(Event.is_deleted == False).count()
        logger.info("Analytics: users=%d posts=%d jobs=%d events=%d", total_users, total_posts, total_jobs, total_events)
        return {"total_users": total_users, "total_posts": total_posts, "total_jobs": total_jobs, "total_events": total_events}
    import asyncio
    return asyncio.run(_run())
