import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.services.achievement_service import AchievementService, ACHIEVEMENT_DEFINITIONS


def _make_user(**overrides):
    user = MagicMock()
    user.user_id = "user-1"
    user.profile_completion = 100
    user.verification_status = MagicMock()
    user.verification_status.value = "approved"
    user.connections_count = 5
    user.posts_count = 2
    user.maximum_mentees = 1
    user.research_publications = []
    for k, v in overrides.items():
        setattr(user, k, v)
    return user


def _make_achievement(**overrides):
    a = MagicMock()
    a.achievement_id = overrides.get("achievement_id", "profile_completed")
    a.name = overrides.get("name", "Profile Completed")
    a.slug = overrides.get("slug", "profile_completed")
    a.description = overrides.get("description", "Completed profile")
    a.category = overrides.get("category", "profile")
    a.icon = overrides.get("icon", "user-check")
    a.points = overrides.get("points", 50)
    a.tier = overrides.get("tier", "bronze")
    a.metric = overrides.get("metric", "profile_completion")
    a.threshold = overrides.get("threshold", 100)
    a.is_active = overrides.get("is_active", True)
    return a


def _make_user_achievement(**overrides):
    ua = MagicMock()
    ua.user_id = overrides.get("user_id", "user-1")
    ua.achievement_id = overrides.get("achievement_id", "profile_completed")
    ua.progress = overrides.get("progress", 100)
    ua.max_progress = overrides.get("max_progress", 100)
    ua.earned = overrides.get("earned", True)
    ua.earned_at = overrides.get("earned_at", datetime.now(timezone.utc))
    return ua


class TestAchievementDefinitions:
    def test_achievement_definitions_count(self):
        assert len(ACHIEVEMENT_DEFINITIONS) >= 14

    def test_achievement_definitions_have_required_keys(self):
        required = {"achievement_id", "name", "slug", "description", "category", "icon", "points", "tier", "metric", "threshold"}
        for defn in ACHIEVEMENT_DEFINITIONS:
            assert required.issubset(defn.keys()), f"Missing keys in {defn['achievement_id']}"

    def test_achievement_definitions_unique_ids(self):
        ids = [d["achievement_id"] for d in ACHIEVEMENT_DEFINITIONS]
        assert len(ids) == len(set(ids))


class TestSeedAchievements:
    @pytest.mark.asyncio
    async def test_seed_achievements_inserts_new(self):
        with patch("app.services.achievement_service.Achievement") as MockAch:
            MockAch.find_one = AsyncMock(return_value=None)
            mock_instance = MagicMock()
            mock_instance.insert = AsyncMock()
            MockAch.side_effect = lambda **kwargs: mock_instance
            await AchievementService.seed_achievements()
            assert mock_instance.insert.call_count == len(ACHIEVEMENT_DEFINITIONS)

    @pytest.mark.asyncio
    async def test_seed_achievements_skips_existing(self):
        with patch("app.services.achievement_service.Achievement") as MockAch:
            existing = _make_achievement()
            MockAch.find_one = AsyncMock(return_value=existing)
            await AchievementService.seed_achievements()


class TestGetAllAchievements:
    @pytest.mark.asyncio
    async def test_get_all_achievements(self):
        achievements = [_make_achievement(achievement_id=f"ach-{i}") for i in range(3)]
        with patch("app.services.achievement_service.Achievement") as MockAch:
            mock_query = MagicMock()
            mock_query.to_list = AsyncMock(return_value=achievements)
            MockAch.find = MagicMock(return_value=mock_query)
            result = await AchievementService.get_all_achievements()
            assert len(result) == 3
            assert result[0]["achievement_id"] == "ach-0"


class TestGetUserAchievements:
    @pytest.mark.asyncio
    async def test_get_user_achievements_empty(self):
        with patch("app.services.achievement_service.UserAchievement") as MockUA, \
             patch("app.services.achievement_service.Achievement") as MockAch:
            MockUA.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))
            MockAch.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))
            result = await AchievementService.get_user_achievements("user-1")
            assert result == []

    @pytest.mark.asyncio
    async def test_get_user_achievements_with_all(self):
        ach = _make_achievement()
        ua = _make_user_achievement()
        with patch("app.services.achievement_service.Achievement") as MockAch, \
             patch("app.services.achievement_service.UserAchievement") as MockUA:
            MockAch.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[ach])))
            MockUA.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[ua])))
            result = await AchievementService.get_user_achievements_with_all("user-1")
            assert len(result) >= 1
            assert result[0]["earned"] is True


class TestCheckAchievements:
    @pytest.mark.asyncio
    async def test_check_profile_completed_achievement(self):
        user = _make_user(profile_completion=100)
        ach = _make_achievement(metric="profile_completion", threshold=100)
        with patch("app.services.achievement_service.UserRepository") as repo, \
             patch("app.services.achievement_service.Achievement") as MockAch, \
             patch("app.services.achievement_service.UserAchievement") as MockUA:
            repo.find_by_user_id = AsyncMock(return_value=user)
            MockAch.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[ach])))
            MockUA.find_one = AsyncMock(return_value=None)
            mock_ua = MagicMock()
            mock_ua.insert = AsyncMock()
            MockUA.side_effect = lambda **kwargs: mock_ua
            import app.services.achievement_service as _ach_mod
            _mock_settings = MagicMock()
            _mock_settings._get_metric_values = MagicMock(return_value={"profile_completion": 100})
            _ach_mod.SettingsService = _mock_settings
            try:
                result = await AchievementService.check_and_award_achievements("user-1")
                assert "profile_completed" in result
            finally:
                del _ach_mod.SettingsService

    @pytest.mark.asyncio
    async def test_check_first_connection_achievement(self):
        user = _make_user(profile_completion=50, connections_count=1, verification_status=MagicMock(value="pending"))
        ach = _make_achievement(
            achievement_id="first_connection", slug="first_connection",
            metric="connections_count", threshold=1,
        )
        import app.services.achievement_service as _ach_mod
        mock_settings = MagicMock()
        mock_settings._get_metric_values = MagicMock(return_value={"connections_count": 1})
        _ach_mod.SettingsService = mock_settings
        try:
            with patch("app.services.achievement_service.UserRepository") as repo, \
                 patch("app.services.achievement_service.Achievement") as MockAch, \
                 patch("app.services.achievement_service.UserAchievement") as MockUA:
                repo.find_by_user_id = AsyncMock(return_value=user)
                MockAch.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[ach])))
                MockAch.is_active = True
                MockUA.find_one = AsyncMock(return_value=None)
                mock_ua = MagicMock()
                mock_ua.insert = AsyncMock()
                MockUA.side_effect = lambda **kwargs: mock_ua
                result = await AchievementService.check_and_award_achievements("user-1")
                assert "first_connection" in result
        finally:
            del _ach_mod.SettingsService

    @pytest.mark.asyncio
    async def test_achievement_award_prevents_duplicates(self):
        user = _make_user()
        ach = _make_achievement()
        ua = _make_user_achievement(earned=True)
        import app.services.achievement_service as _ach_mod
        _mock_settings = MagicMock()
        _mock_settings._get_metric_values = MagicMock(return_value={"profile_completion": 100})
        _ach_mod.SettingsService = _mock_settings
        try:
            with patch("app.services.achievement_service.UserRepository") as repo, \
                 patch("app.services.achievement_service.Achievement") as MockAch, \
                 patch("app.services.achievement_service.UserAchievement") as MockUA:
                repo.find_by_user_id = AsyncMock(return_value=user)
                MockAch.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[ach])))
                MockUA.find_one = AsyncMock(return_value=ua)
                result = await AchievementService.check_and_award_achievements("user-1")
                assert result == []
        finally:
            del _ach_mod.SettingsService

    @pytest.mark.asyncio
    async def test_achievement_progress_calculation(self):
        user = _make_user(profile_completion=50)
        ach = _make_achievement(metric="profile_completion", threshold=100)
        import app.services.achievement_service as _ach_mod
        _mock_settings = MagicMock()
        _mock_settings._get_metric_values = MagicMock(return_value={"profile_completion": 50})
        _ach_mod.SettingsService = _mock_settings
        try:
            with patch("app.services.achievement_service.UserRepository") as repo, \
                 patch("app.services.achievement_service.Achievement") as MockAch, \
                 patch("app.services.achievement_service.UserAchievement") as MockUA:
                repo.find_by_user_id = AsyncMock(return_value=user)
                MockAch.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[ach])))
                MockUA.find_one = AsyncMock(return_value=None)
                mock_ua = MagicMock()
                mock_ua.insert = AsyncMock()
                MockUA.side_effect = lambda **kwargs: mock_ua
                result = await AchievementService.check_and_award_achievements("user-1")
                assert result == []
        finally:
            del _ach_mod.SettingsService

    @pytest.mark.asyncio
    async def test_check_achievements_user_not_found(self):
        with patch("app.services.achievement_service.UserRepository") as repo:
            repo.find_by_user_id = AsyncMock(return_value=None)
            result = await AchievementService.check_and_award_achievements("missing")
            assert result == []


class TestLeaderboard:
    @pytest.mark.asyncio
    async def test_leaderboard_empty(self):
        with patch("app.core.database.get_database", new_callable=AsyncMock) as mock_get_db:
            mock_db = AsyncMock()
            mock_pipeline = MagicMock()
            mock_pipeline.to_list = AsyncMock(return_value=[])
            mock_db.user_achievements = MagicMock()
            mock_db.user_achievements.aggregate = MagicMock(return_value=mock_pipeline)
            mock_get_db.return_value = mock_db
            result = await AchievementService.get_leaderboard(limit=20)
            assert result == []
