import asyncio
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.database import connect_db, disconnect_db, init_beanie_models
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import register_middleware
from app.api.v1.router import api_router, ws_api_router
from app.tasks.background import process_background_tasks
from app.core.cache import close_redis
from app.models.user import User
from app.models.organization import Organization
from app.models.post import Post, Reaction, Bookmark
from app.models.comment import Comment, CommentReaction
from app.models.connection import Connection, Follow
from app.models.block import Block
from app.models.report import Report, AuditLog, Announcement
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.notification import Notification, Device
from app.models.job import Job, JobApplication
from app.models.internship import Internship, InternshipApplication
from app.models.event import Event, EventRegistration
from app.models.mentorship import MentorshipRequest, MentorshipSession, MentorProfile
from app.models.achievement import Achievement, UserAchievement
from app.models.verification import VerificationRequest
from app.models.organization_members import OrganizationMember, Department, OrganizationVerification
from app.models.organization_gallery import OrganizationGalleryItem
from app.models.search_history import SearchHistory
from app.models.categories import Category
from app.models.platform_settings import PlatformSettings
from app.models.research_publication import ResearchPublication
from app.models.profile_view import ProfileView

logger = logging.getLogger(__name__)

DOCUMENT_MODELS = [
    User, Organization, Post, Reaction, Bookmark, Comment, CommentReaction,
    Connection, Follow, Block, Report, AuditLog, Announcement,
    Conversation, Message, Notification, Device, Job, JobApplication,
    Internship, InternshipApplication, Event, EventRegistration,
MentorshipRequest, MentorshipSession, MentorProfile,
    Achievement, UserAchievement,
    VerificationRequest, OrganizationMember, Department,
    OrganizationVerification, OrganizationGalleryItem, SearchHistory, Category,
    PlatformSettings, ResearchPublication, ProfileView,
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)

    await connect_db()
    await init_beanie_models(DOCUMENT_MODELS)

    bg_task = asyncio.create_task(process_background_tasks())

    yield

    bg_task.cancel()
    await close_redis()
    logger.info("Shutting down %s", settings.APP_NAME)
    await disconnect_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Professional Healthcare Networking, Recruitment & Career Platform API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Auth", "description": "Registration, login, OTP verification, password management, sessions"},
        {"name": "Users", "description": "User profiles, education, experience, skills, certifications, privacy settings"},
        {"name": "Organizations", "description": "Organization profiles, departments, employees, verification"},
        {"name": "Posts", "description": "Create, read, update, delete posts with reactions, comments, bookmarks"},
        {"name": "Connections", "description": "Connection requests, accept/reject, followers, following, blocks"},
        {"name": "Search", "description": "Full-text search across users, jobs, events, organizations; trending, recent, recommendations"},
        {"name": "Messages", "description": "Direct messaging, conversations, message status, typing indicators"},
        {"name": "Notifications", "description": "In-app notifications, push notification device registration"},
        {"name": "Jobs", "description": "Job postings, applications, application status management"},
        {"name": "Internships", "description": "Internship postings, applications, eligibility"},
        {"name": "Events", "description": "Medical events, conferences, workshops, webinars, registrations"},
        {"name": "Mentorship", "description": "Mentorship matching, requests, sessions, progress tracking"},
        {"name": "Admin", "description": "Platform administration, user management, reports, announcements, analytics, security"},
        {"name": "Analytics", "description": "Platform analytics, user engagement, recruitment, event, mentorship metrics"},
        {"name": "Settings", "description": "User account settings, privacy, notification preferences"},
        {"name": "Uploads", "description": "File upload for images, videos, documents, resumes, certificates"},
        {"name": "Health", "description": "Health checks: liveness, readiness, dependency checks"},
        {"name": "WebSocket", "description": "Real-time chat, notifications, presence, organization channels"},
        {"name": "Devices", "description": "Device registration for push notifications"},
        {"name": "Comments", "description": "Post comments and replies"},
        {"name": "Mentors", "description": "Browse available mentors and mentor profiles"},
    ],
)

register_middleware(app)
register_exception_handlers(app)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_api_router, prefix="/api/v1")
