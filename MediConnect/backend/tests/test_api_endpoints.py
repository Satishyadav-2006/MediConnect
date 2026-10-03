import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def mock_settings():
    settings = MagicMock()
    settings.APP_NAME = "MediConnect"
    settings.APP_VERSION = "1.0.0"
    settings.DEBUG = True
    settings.ENVIRONMENT = "testing"
    settings.CORS_ORIGINS = ["http://localhost:3000"]
    settings.is_production = False
    settings.is_development = True
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = 15
    settings.RATE_LIMIT_PER_MINUTE = 60
    settings.RATE_LIMIT_AUTH_PER_MINUTE = 10
    settings.SMTP_HOST = ""
    settings.SMTP_PORT = 587
    settings.SMTP_USERNAME = ""
    settings.FIREBASE_CREDENTIALS_PATH = "./firebase-credentials.json"
    settings.MAX_FILE_SIZE_MB = 50
    return settings


class TestHealthEndpoints:
    def test_health_check(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "healthy"
            assert data["service"] == "MediConnect API"

    def test_liveness(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/health/live")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "alive"

    def test_readiness_returns_status(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            data = resp.json()
            assert "status" in data
            assert "database" in data


class TestSearchEndpoints:
    def test_search_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/search?q=test")
            assert resp.status_code in (401, 403, 422)

    def test_trending_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/search/trending")
            assert resp.status_code in (401, 403, 422)

    def test_recent_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/search/recent")
            assert resp.status_code in (401, 403, 422)

    def test_recommendations_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/search/recommendations")
            assert resp.status_code in (401, 403, 422)


class TestAdminEndpoints:
    def test_admin_dashboard_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/admin/dashboard")
            assert resp.status_code in (401, 403, 422)

    def test_admin_security_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/admin/security")
            assert resp.status_code in (401, 403, 422)

    def test_admin_analytics_recruitment_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/admin/analytics/recruitment")
            assert resp.status_code in (401, 403, 422)

    def test_admin_analytics_events_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/admin/analytics/events")
            assert resp.status_code in (401, 403, 422)

    def test_admin_analytics_mentorship_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/admin/analytics/mentorship")
            assert resp.status_code in (401, 403, 422)

    def test_admin_security_logs_requires_auth(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/api/v1/admin/security/logs")
            assert resp.status_code in (401, 403, 422)


class TestOpenAPITags:
    def test_openapi_schema_has_tags(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/openapi.json")
            if resp.status_code == 200:
                schema = resp.json()
                tag_names = [t["name"] for t in schema.get("tags", [])]
                assert "Auth" in tag_names
                assert "Search" in tag_names
                assert "Admin" in tag_names
                assert "Health" in tag_names
