import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.schemas.job import JobCreateRequest, JobUpdateRequest, JobApplicationRequest
from app.models.base import JobStatus, ApplicationStatus


def _make_job(**overrides):
    j = MagicMock()
    j.job_id = overrides.get("job_id", "job-1")
    j.recruiter_id = overrides.get("recruiter_id", "user-1")
    j.organization_id = overrides.get("organization_id", "org-1")
    j.title = "Test Job"
    j.description = "Desc"
    j.department = "Cardiology"
    j.location = "NYC"
    j.work_mode = MagicMock(value="hybrid")
    j.employment_type = MagicMock(value="full_time")
    j.status = JobStatus.PUBLISHED
    j.vacancies = 1
    j.application_count = 0
    j.deleted = False
    j.benefits = []
    j.salary = MagicMock()
    j.salary.model_dump.return_value = {"minimum_salary": 50000, "maximum_salary": 100000}
    j.specialization_required = ""
    j.qualification_required = ""
    j.skills = []
    j.responsibilities = []
    j.requirements = []
    j.education = ""
    j.deadline = None
    j.organization_id = None
    j.search_keywords = []
    j.created_at = datetime.now(timezone.utc)
    j.updated_at = datetime.now(timezone.utc)
    j.save = AsyncMock()
    j.insert = AsyncMock()
    return j


class TestCreateJob:
    @pytest.mark.asyncio
    async def test_create_job(self):
        from app.services.job_service import JobService
        data = JobCreateRequest(
            title="Surgeon",
            description="Looking for a surgeon",
            department="Surgery",
            location="Boston",
        )
        with patch("app.services.job_service.Job") as MockJob, \
             patch("app.services.job_service.Organization") as MockOrg, \
             patch("app.services.job_service.UserRepository") as repo, \
             patch("app.services.job_service.sanitize_string", side_effect=lambda x: x), \
             patch("app.services.job_service.notify_job_posted", new_callable=AsyncMock), \
             patch("app.services.job_service.cache_delete_pattern", new_callable=AsyncMock):
            mock_j = MagicMock()
            mock_j.insert = AsyncMock()
            mock_j.job_id = "new-job"
            MockJob.side_effect = lambda **kw: mock_j
            MockOrg.find_one = AsyncMock(return_value=None)
            user = MagicMock()
            user.posts_count = 0
            user.save = AsyncMock()
            repo.find_by_user_id = AsyncMock(return_value=user)
            result = await JobService.create_job("user-1", data)
            assert "job_id" in result
            assert result["message"] == "Job posted successfully"


class TestGetJob:
    @pytest.mark.asyncio
    async def test_get_job(self):
        from app.services.job_service import JobService
        job = _make_job()
        with patch("app.services.job_service.cache_get", new_callable=AsyncMock, return_value=None), \
             patch("app.services.job_service.JobRepository") as repo, \
             patch("app.services.job_service.cache_set", new_callable=AsyncMock):
            repo.find_by_job_id = AsyncMock(return_value=job)
            result = await JobService.get_job("job-1")
            assert job.save.called

    @pytest.mark.asyncio
    async def test_get_job_not_found(self):
        from app.services.job_service import JobService
        with patch("app.services.job_service.cache_get", new_callable=AsyncMock, return_value=None), \
             patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_job_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await JobService.get_job("missing")


class TestUpdateJob:
    @pytest.mark.asyncio
    async def test_update_job(self):
        from app.services.job_service import JobService
        job = _make_job(recruiter_id="user-1")
        data = JobUpdateRequest(title="Updated Title")
        with patch("app.services.job_service.JobRepository") as repo, \
             patch("app.services.job_service.sanitize_string", side_effect=lambda x: x), \
             patch("app.services.job_service.cache_delete_pattern", new_callable=AsyncMock), \
             patch("app.services.job_service.cache_delete", new_callable=AsyncMock, create=True):
            repo.find_by_job_id = AsyncMock(return_value=job)
            result = await JobService.update_job("job-1", "user-1", data)
            assert result["message"] == "Job updated successfully"

    @pytest.mark.asyncio
    async def test_update_job_wrong_poster(self):
        from app.services.job_service import JobService
        job = _make_job(recruiter_id="user-1")
        data = JobUpdateRequest(title="Hacked")
        with patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_job_id = AsyncMock(return_value=job)
            with pytest.raises(AuthorizationError):
                await JobService.update_job("job-1", "user-2", data)


class TestDeleteJob:
    @pytest.mark.asyncio
    async def test_delete_job(self):
        from app.services.job_service import JobService
        job = _make_job(recruiter_id="user-1")
        with patch("app.services.job_service.JobRepository") as repo, \
             patch("app.services.job_service.cache_delete_pattern", new_callable=AsyncMock), \
             patch("app.services.job_service.cache_delete", new_callable=AsyncMock, create=True):
            repo.find_by_job_id = AsyncMock(return_value=job)
            result = await JobService.delete_job("job-1", "user-1")
            assert result["message"] == "Job deleted successfully"


class TestApplyToJob:
    @pytest.mark.asyncio
    async def test_apply_to_job(self):
        from app.services.job_service import JobService
        job = _make_job()
        data = JobApplicationRequest(cover_letter="I am interested", resume_url="http://example.com/cv.pdf")
        with patch("app.services.job_service.JobRepository") as repo, \
             patch("app.services.job_service.JobApplication") as MockApp:
            repo.find_by_job_id = AsyncMock(return_value=job)
            repo.find_application = AsyncMock(return_value=None)
            mock_app = MagicMock()
            mock_app.insert = AsyncMock()
            MockApp.side_effect = lambda **kw: mock_app
            result = await JobService.apply_to_job("job-1", "user-2", data)
            assert "application_id" in result

    @pytest.mark.asyncio
    async def test_cannot_apply_twice(self):
        from app.services.job_service import JobService
        job = _make_job()
        data = JobApplicationRequest(cover_letter="Again", resume_url="")
        with patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_job_id = AsyncMock(return_value=job)
            repo.find_application = AsyncMock(return_value=MagicMock())
            with pytest.raises(ConflictError):
                await JobService.apply_to_job("job-1", "user-2", data)

    @pytest.mark.asyncio
    async def test_cannot_apply_to_closed_job(self):
        from app.services.job_service import JobService
        job = _make_job()
        job.status = JobStatus.CLOSED
        data = JobApplicationRequest(cover_letter="Hi", resume_url="")
        with patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_job_id = AsyncMock(return_value=job)
            with pytest.raises(AuthorizationError):
                await JobService.apply_to_job("job-1", "user-2", data)


class TestGetApplications:
    @pytest.mark.asyncio
    async def test_get_applications(self):
        from app.services.job_service import JobService
        job = _make_job(recruiter_id="user-1")
        MockApp = MagicMock()
        MockApp.find.return_value.count = AsyncMock(return_value=0)
        with patch("app.services.job_service.JobApplication", MockApp), \
             patch("app.services.job_service.enrich", new_callable=AsyncMock, return_value=[]), \
             patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_job_id = AsyncMock(return_value=job)
            repo.get_applications = AsyncMock(return_value=[])
            repo.count_applications = AsyncMock(return_value=0)
            result = await JobService.get_job_applications("job-1", "user-1")
            assert "items" in result

    @pytest.mark.asyncio
    async def test_get_applications_rejects_non_poster(self):
        from app.services.job_service import JobService
        job = _make_job(recruiter_id="owner-1")
        with patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_job_id = AsyncMock(return_value=job)
            with pytest.raises(AuthorizationError):
                await JobService.get_job_applications("job-1", "someone-else")


class TestUpdateApplicationStatus:
    @pytest.mark.asyncio
    async def test_update_application_status(self):
        from app.services.job_service import JobService
        app = MagicMock()
        app.application_id = "app-1"
        app.job_id = "job-1"
        app.applicant_id = "user-2"
        app.status = "pending"
        app.reviewed = False
        app.save = AsyncMock()
        job = _make_job(recruiter_id="user-1")
        with patch("app.services.job_service.JobApplication") as MockApp, \
             patch("app.services.job_service.JobRepository") as repo, \
             patch("app.services.job_service.notify_application_update", new_callable=AsyncMock):
            MockApp.find_one = AsyncMock(return_value=app)
            repo.find_by_job_id = AsyncMock(return_value=job)
            result = await JobService.update_application_status("app-1", "user-1", "reviewed")
            assert result["message"] == "Application status updated to reviewed"


class TestGetRecommended:
    @pytest.mark.asyncio
    async def test_get_recommended(self):
        from app.services.job_service import JobService
        with patch("app.services.job_service.cache_get", new_callable=AsyncMock, return_value=None), \
             patch("app.services.job_service.Job") as MockJob, \
             patch("app.services.job_service.cache_set", new_callable=AsyncMock):
            mock_q = MagicMock()
            mock_q.sort.return_value = mock_q
            mock_q.skip.return_value = mock_q
            mock_q.limit.return_value = mock_q
            mock_q.to_list = AsyncMock(return_value=[])
            mock_q.count = AsyncMock(return_value=0)
            MockJob.find = MagicMock(return_value=mock_q)
            result = await JobService.get_recommended(1, 3)
            assert "items" in result
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_recommended_query_uses_valid_fields(self):
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1500)
        try:
            await client.admin.command("ping")
        except Exception:
            pytest.skip("MongoDB not available")
        from beanie import init_beanie
        from app.models.job import Job, JobApplication
        await init_beanie(database=client[os.environ["DATABASE_NAME"]], document_models=[Job, JobApplication])
        rows = await Job.find(Job.is_deleted == False, Job.status == "active").limit(1).to_list()
        client.close()
        assert isinstance(rows, list)


class TestGetPostedJobs:
    @pytest.mark.asyncio
    async def test_get_my_posted_jobs(self):
        from app.services.job_service import JobService
        with patch("app.services.job_service.JobRepository") as repo:
            repo.find_by_poster = AsyncMock(return_value=[])
            repo.count_by_poster = AsyncMock(return_value=0)
            result = await JobService.get_user_posted_jobs("user-1")
            assert "items" in result
