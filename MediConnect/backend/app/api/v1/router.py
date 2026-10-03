from fastapi import APIRouter, Depends

from app.api.v1.auth.router import router as auth_router
from app.api.v1.users.router import router as users_router
from app.api.v1.organizations.router import router as organizations_router
from app.api.v1.posts.router import router as posts_router
from app.api.v1.posts.router import comments_router
from app.api.v1.connections.router import router as connections_router
from app.api.v1.search.router import router as search_router
from app.api.v1.messages.router import router as messages_router
from app.api.v1.notifications.router import router as notifications_router
from app.api.v1.notifications.router import devices_router
from app.api.v1.settings.router import router as settings_router
from app.api.v1.jobs.router import router as jobs_router
from app.api.v1.internships.router import router as internships_router
from app.api.v1.events.router import router as events_router
from app.api.v1.mentorship.router import router as mentorship_router
from app.api.v1.mentorship.router import router2 as mentors_router
from app.api.v1.admin.router import router as admin_router
from app.api.v1.achievements.router import router as achievements_router
from app.api.v1.analytics.router import router as analytics_router
from app.api.v1.uploads.router import router as uploads_router
from app.api.v1.research.router import router as research_router
from app.api.v1.channels.router import router as channels_router
from app.api.v1.hashtags.router import router as hashtags_router
from app.api.v1.recommendations.router import router as recommendations_router
from app.websocket.router import router as ws_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(organizations_router)
api_router.include_router(posts_router)
api_router.include_router(comments_router)
api_router.include_router(connections_router)
api_router.include_router(search_router)
api_router.include_router(messages_router)
api_router.include_router(notifications_router)
api_router.include_router(devices_router)
api_router.include_router(settings_router)
api_router.include_router(jobs_router)
api_router.include_router(internships_router)
api_router.include_router(events_router)
api_router.include_router(mentorship_router)
api_router.include_router(mentors_router)
api_router.include_router(admin_router)
api_router.include_router(achievements_router)
api_router.include_router(analytics_router)
api_router.include_router(uploads_router)
api_router.include_router(research_router)
api_router.include_router(channels_router)
api_router.include_router(hashtags_router)
api_router.include_router(recommendations_router)

ws_api_router = APIRouter()
ws_api_router.include_router(ws_router)


@api_router.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "healthy", "service": "MediConnect API", "version": "1.0.0"}


@api_router.get("/health/ready", tags=["Health"])
async def readiness_check() -> dict:
    from app.core.database import get_database
    checks = {"status": "ready"}
    try:
        db = await get_database()
        await db.command("ping")
        checks["database"] = "connected"
    except Exception:
        checks["database"] = "disconnected"
        checks["status"] = "not_ready"

    try:
        from app.core.config import settings
        if settings.SMTP_HOST and settings.SMTP_USERNAME:
            import socket
            sock = socket.create_connection((settings.SMTP_HOST, settings.SMTP_PORT), timeout=5)
            sock.close()
            checks["smtp"] = "connected"
        else:
            checks["smtp"] = "not_configured"
    except Exception:
        checks["smtp"] = "disconnected"

    try:
        import os
        from app.core.config import settings
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            checks["firebase"] = "configured"
        else:
            checks["firebase"] = "not_configured"
    except Exception:
        checks["firebase"] = "error"

    try:
        from app.tasks.background import _background_tasks_enabled
        checks["background_worker"] = "running" if _background_tasks_enabled else "stopped"
    except Exception:
        checks["background_worker"] = "unknown"

    return checks


@api_router.get("/health/live", tags=["Health"])
async def liveness_check() -> dict:
    return {"status": "alive"}


@api_router.get("/health/database", tags=["Health"])
async def health_database() -> dict:
    try:
        from app.core.database import get_database
        db = await get_database()
        await db.command("ping")
        return {"status": "healthy", "service": "database", "details": "MongoDB connection active"}
    except Exception as e:
        return {"status": "unhealthy", "service": "database", "error": str(e)}


@api_router.get("/health/storage", tags=["Health"])
async def health_storage() -> dict:
    try:
        from app.core.config import settings
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            return {"status": "healthy", "service": "storage", "details": "Cloudinary configured"}
        return {"status": "not_configured", "service": "storage", "details": "Cloudinary credentials missing"}
    except Exception as e:
        return {"status": "unhealthy", "service": "storage", "error": str(e)}


@api_router.get("/health/email", tags=["Health"])
async def health_email() -> dict:
    try:
        from app.core.config import settings
        if settings.SMTP_HOST and settings.SMTP_USERNAME:
            import socket
            sock = socket.create_connection((settings.SMTP_HOST, settings.SMTP_PORT), timeout=5)
            sock.close()
            return {"status": "healthy", "service": "email", "details": f"SMTP reachable at {settings.SMTP_HOST}:{settings.SMTP_PORT}"}
        return {"status": "not_configured", "service": "email", "details": "SMTP credentials missing"}
    except Exception as e:
        return {"status": "unhealthy", "service": "email", "error": str(e)}


@api_router.get("/health/firebase", tags=["Health"])
async def health_firebase() -> dict:
    try:
        import os
        from app.core.config import settings
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            return {"status": "healthy", "service": "firebase", "details": "Firebase credentials found"}
        return {"status": "not_configured", "service": "firebase", "details": "Firebase credentials file missing"}
    except Exception as e:
        return {"status": "unhealthy", "service": "firebase", "error": str(e)}
