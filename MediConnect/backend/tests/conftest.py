import os
import asyncio
from typing import Generator, AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio


os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ENVIRONMENT"] = "testing"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def mock_db():
    db = AsyncMock()
    db.command = AsyncMock(return_value={"ok": 1})
    return db


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.user_id = "test-user-123"
    user.first_name = "John"
    user.last_name = "Doe"
    user.email = "john.doe@test.com"
    user.username = "johndoe"
    user.role.value = "doctor"
    user.account_status.value = "verified"
    user.email_verified = True
    user.verification_status.value = "approved"
    user.profile_photo = None
    user.cover_photo = None
    user.headline = "Test Doctor"
    user.bio = "Test bio"
    user.phone = "+1234567890"
    user.country = "US"
    user.state = "California"
    user.city = "San Francisco"
    user.organization_id = None
    user.department = "Cardiology"
    user.designation = "Attending"
    user.experience_years = 5
    user.privacy_settings = MagicMock()
    user.notification_settings = MagicMock()
    user.social_links = MagicMock()
    user.professional_details = MagicMock()
    user.otp_secret = None
    user.otp_code = None
    user.otp_attempts = 0
    user.otp_expires_at = None
    user.otp_last_sent_at = None
    user.password_reset_token = None
    user.password_reset_expires = None
    user.refresh_tokens = []
    user.password_history = []
    user.sessions = []
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = None
    user.posts_count = 0
    user.followers_count = 0
    user.following_count = 0
    user.connections_count = 0
    return user


@pytest.fixture
def mock_post():
    post = MagicMock()
    post.post_id = "test-post-123"
    post.author_id = "test-user-123"
    post.author_type = "user"
    post.content = "Test post content"
    post.post_type.value = "text"
    post.visibility.value = "public"
    post.reaction_count = 0
    post.comment_count = 0
    post.share_count = 0
    post.is_pinned = False
    post.is_featured = False
    post.is_deleted = False
    post.media = []
    post.hashtags = []
    post.mentions = []
    return post


@pytest.fixture
def mock_job():
    job = MagicMock()
    job.job_id = "test-job-123"
    job.posted_by = "test-user-123"
    job.title = "Test Job"
    job.description = "Test job description"
    job.department = "Cardiology"
    job.location = "New York"
    job.work_mode.value = "hybrid"
    job.job_type.value = "full_time"
    job.experience_level.value = "mid"
    job.status.value = "active"
    job.vacancies = 1
    job.application_count = 0
    job.views_count = 0
    job.is_urgent = False
    job.deleted = False
    return job
