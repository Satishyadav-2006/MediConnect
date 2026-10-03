import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestSearchService:
    @pytest.mark.asyncio
    async def test_record_and_get_recent_searches(self):
        from app.services.search_service import SearchService, _search_history
        _search_history.clear()
        await SearchService.record_search("user1", "cardiology jobs")
        await SearchService.record_search("user1", "remote work")
        recent = await SearchService.get_recent_searches("user1")
        assert len(recent) == 2
        assert recent[0]["query"] == "remote work"
        assert recent[1]["query"] == "cardiology jobs"

    @pytest.mark.asyncio
    async def test_clear_recent_searches(self):
        from app.services.search_service import SearchService, _search_history
        _search_history.clear()
        await SearchService.record_search("user2", "test query")
        await SearchService.clear_recent_searches("user2")
        recent = await SearchService.get_recent_searches("user2")
        assert len(recent) == 0

    @pytest.mark.asyncio
    async def test_recent_searches_max_limit(self):
        from app.services.search_service import SearchService, _search_history, MAX_RECENT
        _search_history.clear()
        for i in range(MAX_RECENT + 5):
            await SearchService.record_search("user3", f"query {i}")
        recent = await SearchService.get_recent_searches("user3")
        assert len(recent) == MAX_RECENT

    @pytest.mark.asyncio
    async def test_get_recommendations_returns_empty_for_unknown_user(self):
        from app.services.search_service import SearchService
        with patch("app.services.search_service.User") as mock_user:
            mock_user.find_one = AsyncMock(return_value=None)
            result = await SearchService.get_recommendations("unknown-user")
            assert "jobs" in result
            assert "events" in result
            assert "mentors" in result
