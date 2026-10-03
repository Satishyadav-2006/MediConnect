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
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = 15
    return settings


class TestWebSocketRoutes:
    def test_chat_ws_route_exists(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            routes = [r.path for r in app.routes]
            ws_routes = [r.path for r in app.routes if hasattr(r, "path") and "ws" in r.path]
            assert any("chat" in r for r in ws_routes)

    def test_notifications_ws_route_exists(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            ws_routes = [r.path for r in app.routes if hasattr(r, "path") and "ws" in r.path]
            assert any("notification" in r for r in ws_routes)

    def test_presence_ws_route_exists(self, mock_settings):
        with patch("app.core.config.settings", mock_settings):
            from app.main import app
            ws_routes = [r.path for r in app.routes if hasattr(r, "path") and "ws" in r.path]
            assert any("presence" in r for r in ws_routes)


class TestConnectionManager:
    def test_manager_has_required_methods(self):
        from app.websocket.manager import ConnectionManager
        manager = ConnectionManager()
        assert hasattr(manager, "connect")
        assert hasattr(manager, "disconnect")
        assert hasattr(manager, "send_to_user")
        assert hasattr(manager, "send_to_conversation")
        assert hasattr(manager, "send_to_room")
        assert hasattr(manager, "broadcast")
        assert hasattr(manager, "is_online")
        assert hasattr(manager, "get_online_users")
