from datetime import datetime, timezone
from pydantic import Field
from app.models.base import BaseDocument


class PlatformSettings(BaseDocument):
    """Global application configuration. Single document collection."""
    class Settings:
        name = "platform_settings"

    registration_enabled: bool = True
    verification_required: bool = True
    maintenance_mode: bool = False
    max_upload_size: int = 10485760  # 10MB default
    allowed_file_types: list[str] = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
