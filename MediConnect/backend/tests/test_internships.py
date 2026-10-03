import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-32chars!!")
os.environ.setdefault("JWT_REFRESH_SECRET_KEY", "test-refresh-secret-key-for-testing-only-32")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "mediconnect_test")

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.models.base import InternshipStatus, WorkMode


def _make_internship(**overrides):
    i = MagicMock()
    i.internship_id = overrides.get("internship_id", "internship-1")
    i.mentor_id = overrides.get("mentor_id", "poster-1")
    i.organization_id = overrides.get("organization_id", None)
    i.title = overrides.get("title", "Cardiology Internship")
    i.description = "Shadow senior cardiologists"
    i.department = "Cardiology"
    i.location = "NYC"
    i.status = overrides.get("status", InternshipStatus.PUBLISHED)
    i.is_deleted = overrides.get("is_deleted", False)
    i.application_count = overrides.get("application_count", 0)
    i.views_count = 0
    i.skills = []
    i.vacancies = 1
    i.stipend = MagicMock()
    i.stipend.maximum_stipend = 0
    i.stipend.currency = "INR"
    i.insert = AsyncMock()
    i.save = AsyncMock()
    return i


def _make_application(**overrides):
    a = MagicMock()
    a.application_id = overrides.get("application_id", "app-1")
    a.internship_id = overrides.get("internship_id", "internship-1")
    a.applicant_id = overrides.get("applicant_id", "applicant-1")
    a.status = overrides.get("status", "applied")
    a.cover_letter = "I am keen"
    a.resume_url = "https://example.com/cv.pdf"
    a.answers = {}
    a.reviewed_by = None
    a.reviewed_at = None
    a.applied_at = None
    a.created_at = None
    a.updated_at = None
    a.is_deleted = False
    a.insert = AsyncMock()
    a.save = AsyncMock()
    return a


class TestCreateInternship:
    @pytest.mark.asyncio
    async def test_create_internship_success(self):
        from app.services.internship_service import InternshipService

        data = MagicMock()
        data.organization_id = None
        data.title = "Cardiology Internship"
        data.description = "Shadow senior cardiologists"
        data.department = "Cardiology"
        data.location = "NYC"
        data.work_mode = "onsite"
        data.internship_type = "clinical"
        data.duration_weeks = 12
        data.stipend = 5000
        data.currency = "INR"
        data.skills_required = ["ECG"]
        data.eligibility = "MBBS"
        data.max_participants = 2
        data.is_paid = True
        data.start_date = None
        data.end_date = None
        data.application_deadline = None

        created = _make_internship()
        with patch("app.services.internship_service.Internship", return_value=created), \
             patch("app.services.internship_service._resolve_organization_id", new_callable=AsyncMock, return_value=None), \
             patch("app.services.internship_service.sanitize_string", side_effect=lambda x: x):
            result = await InternshipService.create_internship("poster-1", data)

        assert result["message"] == "Internship posted successfully"
        assert result["internship_id"] == "internship-1"
        created.insert.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_internship_defaults_to_onsite_and_clinical(self):
        from app.services.internship_service import InternshipService

        data = MagicMock()
        for attr in ("organization_id", "duration_weeks", "eligibility",
                     "max_participants", "is_paid", "start_date", "end_date", "application_deadline"):
            setattr(data, attr, None)
        data.title = "T"
        data.description = "D"
        data.department = "D"
        data.location = "L"
        data.work_mode = "not-a-real-mode"
        data.internship_type = "not-a-real-type"
        data.skills_required = []
        data.stipend = 0
        data.currency = "INR"

        created = _make_internship()
        with patch("app.services.internship_service.Internship") as MockInternship, \
             patch("app.services.internship_service._resolve_organization_id", new_callable=AsyncMock, return_value=None), \
             patch("app.services.internship_service.sanitize_string", side_effect=lambda x: x):
            MockInternship.return_value = created
            await InternshipService.create_internship("poster-1", data)

        kwargs = MockInternship.call_args.kwargs
        assert kwargs["work_mode"] == WorkMode.ONSITE
        assert kwargs["status"] == InternshipStatus.PUBLISHED


class TestGetInternships:
    @pytest.mark.asyncio
    async def test_get_internships_returns_paginated(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship()
        with patch("app.services.internship_service.InternshipRepository") as repo, \
             patch("app.services.search_service._internship_dict", return_value={"internship_id": "internship-1"}):
            repo.find_active = AsyncMock(return_value=[intern])
            repo.count_active = AsyncMock(return_value=1)
            result = await InternshipService.get_internships(page=1, per_page=10)

        assert result["total"] == 1
        assert len(result["items"]) == 1

    @pytest.mark.asyncio
    async def test_get_internship_not_found(self):
        from app.services.internship_service import InternshipService

        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await InternshipService.get_internship("missing")

    @pytest.mark.asyncio
    async def test_get_internship_increments_views(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship()
        with patch("app.services.internship_service.InternshipRepository") as repo, \
             patch("app.services.search_service._internship_dict", return_value={"internship_id": "internship-1"}):
            repo.find_by_id = AsyncMock(return_value=intern)
            result = await InternshipService.get_internship("internship-1")

        assert result["internship_id"] == "internship-1"
        intern.save.assert_awaited()


class TestUpdateAndDeleteInternship:
    @pytest.mark.asyncio
    async def test_update_rejects_non_poster(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship(mentor_id="owner-1")
        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=intern)
            with pytest.raises(AuthorizationError):
                await InternshipService.update_internship("internship-1", "someone-else", MagicMock())

    @pytest.mark.asyncio
    async def test_update_success(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship(mentor_id="owner-1")
        data = MagicMock()
        data.title = "New Title"
        data.description = None
        data.department = None
        data.location = None
        data.work_mode = None
        data.internship_type = None
        data.duration_weeks = None
        data.stipend = None
        data.skills_required = None
        data.eligibility = None
        data.max_participants = None
        data.status = None
        data.start_date = None
        data.end_date = None
        data.application_deadline = None

        with patch("app.services.internship_service.InternshipRepository") as repo, \
             patch("app.services.internship_service.sanitize_string", side_effect=lambda x: x):
            repo.find_by_id = AsyncMock(return_value=intern)
            result = await InternshipService.update_internship("internship-1", "owner-1", data)

        assert result["message"] == "Internship updated successfully"
        assert intern.title == "New Title"

    @pytest.mark.asyncio
    async def test_delete_rejects_non_poster(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship(mentor_id="owner-1")
        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=intern)
            with pytest.raises(AuthorizationError):
                await InternshipService.delete_internship("internship-1", "intruder")

    @pytest.mark.asyncio
    async def test_delete_soft_deletes(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship(mentor_id="owner-1")
        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=intern)
            result = await InternshipService.delete_internship("internship-1", "owner-1")

        assert intern.is_deleted is True
        assert result["message"] == "Internship deleted successfully"


class TestApplyToInternship:
    @pytest.mark.asyncio
    async def test_apply_not_found(self):
        from app.services.internship_service import InternshipService

        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await InternshipService.apply_to_internship("x", "u1", MagicMock())

    @pytest.mark.asyncio
    async def test_apply_rejected_when_not_published(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship(status=InternshipStatus.CLOSED)
        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=intern)
            with pytest.raises(AuthorizationError):
                await InternshipService.apply_to_internship("internship-1", "u1", MagicMock())

    @pytest.mark.asyncio
    async def test_apply_rejected_when_duplicate(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship()
        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=intern)
            repo.find_application = AsyncMock(return_value=_make_application())
            with pytest.raises(ConflictError):
                await InternshipService.apply_to_internship("internship-1", "u1", MagicMock())

    @pytest.mark.asyncio
    async def test_apply_success_increments_count_and_notifies(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship(application_count=0)
        application = _make_application()
        data = MagicMock(cover_letter="Keen", resume_url="r")

        with patch("app.services.internship_service.InternshipRepository") as repo, \
             patch("app.services.internship_service.InternshipApplication", return_value=application), \
             patch("app.services.internship_service._applicant_name", new_callable=AsyncMock, return_value="Jane"), \
             patch("app.services.internship_service.resolve_posting_recipients", new_callable=AsyncMock, return_value=["owner-1"]), \
             patch("app.services.internship_service.notify_internship_application_received", new_callable=AsyncMock) as notify:
            repo.find_by_id = AsyncMock(return_value=intern)
            repo.find_application = AsyncMock(return_value=None)
            result = await InternshipService.apply_to_internship("internship-1", "applicant-1", data)

        assert result["message"] == "Application submitted successfully"
        assert intern.application_count == 1
        application.insert.assert_awaited_once()
        notify.assert_awaited_once()


class TestApplicationStatus:
    @pytest.mark.asyncio
    async def test_update_status_not_found(self):
        from app.services.internship_service import InternshipService

        with patch("app.services.internship_service.InternshipApplication") as MockApp:
            MockApp.find_one = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await InternshipService.update_application_status("app-1", "poster-1", "shortlisted")

    @pytest.mark.asyncio
    async def test_update_status_rejects_non_poster(self):
        from app.services.internship_service import InternshipService

        application = _make_application()
        intern = _make_internship(mentor_id="owner-1")
        with patch("app.services.internship_service.InternshipApplication") as MockApp, \
             patch("app.services.internship_service.InternshipRepository") as repo:
            MockApp.find_one = AsyncMock(return_value=application)
            repo.find_by_id = AsyncMock(return_value=intern)
            with pytest.raises(AuthorizationError):
                await InternshipService.update_application_status("app-1", "not-owner", "shortlisted")

    @pytest.mark.asyncio
    async def test_update_status_success_notifies_applicant(self):
        from app.services.internship_service import InternshipService

        application = _make_application(applicant_id="applicant-1")
        intern = _make_internship(mentor_id="owner-1")
        with patch("app.services.internship_service.InternshipApplication") as MockApp, \
             patch("app.services.internship_service.InternshipRepository") as repo, \
             patch("app.services.internship_service.notify_internship_application_update", new_callable=AsyncMock) as notify:
            MockApp.find_one = AsyncMock(return_value=application)
            repo.find_by_id = AsyncMock(return_value=intern)
            result = await InternshipService.update_application_status("app-1", "owner-1", "shortlisted")

        assert "shortlisted" in result["message"]
        assert application.status == "shortlisted"
        notify.assert_awaited_once_with("applicant-1", "internship-1", "shortlisted")


class TestSaveInternship:
    @pytest.mark.asyncio
    async def test_save_not_found(self):
        from app.services.internship_service import InternshipService

        with patch("app.services.internship_service.InternshipRepository") as repo:
            repo.find_by_id = AsyncMock(return_value=None)
            with pytest.raises(NotFoundError):
                await InternshipService.save_internship("x", "u1")

    @pytest.mark.asyncio
    async def test_save_adds_once(self):
        from app.services.internship_service import InternshipService

        intern = _make_internship()
        user = MagicMock()
        user.saved_internships = []
        user.save = AsyncMock()
        with patch("app.services.internship_service.InternshipRepository") as repo, \
             patch("app.services.internship_service.UserRepository") as urepo:
            repo.find_by_id = AsyncMock(return_value=intern)
            urepo.find_by_user_id = AsyncMock(return_value=user)
            await InternshipService.save_internship("internship-1", "u1")

        assert user.saved_internships == ["internship-1"]
        user.save.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unsave_removes(self):
        from app.services.internship_service import InternshipService

        user = MagicMock()
        user.saved_internships = ["internship-1", "internship-2"]
        user.save = AsyncMock()
        with patch("app.services.internship_service.UserRepository") as urepo:
            urepo.find_by_user_id = AsyncMock(return_value=user)
            await InternshipService.unsave_internship("internship-1", "u1")

        assert user.saved_internships == ["internship-2"]
