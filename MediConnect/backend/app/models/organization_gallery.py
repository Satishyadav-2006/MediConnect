from datetime import datetime, timezone
from beanie import Indexed
from app.models.base import BaseDocument


class OrganizationGalleryItem(BaseDocument):
    """Media items uploaded to an organization's public gallery."""

    class Settings:
        name = "organization_gallery"
        indexes = [
            "gallery_item_id",
            "organization_id",
            "uploaded_by",
            "media_type",
            [("organization_id", 1), ("created_at", -1)],
        ]

    gallery_item_id: str = Indexed(unique=True)
    organization_id: str = Indexed()
    uploaded_by: str = ""
    url: str = ""
    public_id: str | None = None
    media_type: str = "image"  # image, video, certificate, document
    caption: str = ""
    file_name: str = ""
    content_type: str = ""
    size_bytes: int = 0
    status: str = "active"  # active, removed
