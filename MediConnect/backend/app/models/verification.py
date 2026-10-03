from datetime import datetime, timezone
from beanie import Indexed
from pydantic import BaseModel, Field
from app.models.base import BaseDocument, VerificationStatus


class VerificationDocument(BaseModel):
    """Embedded document for verification supporting documents."""
    cloudinary_url: str = ""
    original_filename: str = ""
    document_type: str = ""
    file_size: int = 0
    mime_type: str = ""
    upload_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VerificationHistory(BaseModel):
    """Embedded document for verification status change history."""
    status: str = ""
    reviewer: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    remarks: str = ""


class VerificationRequest(BaseDocument):
    """Healthcare verification requests submitted by users."""
    class Settings:
        name = "verification_requests"
        indexes = [
            "status",
            "submitted_at",
            "registration_number",
            "verification_type",
            "reviewed_by",
        ]

    verification_id: str = Indexed(unique=True)
    user_id: str = Indexed()
    registration_number: str | None = None
    license_number: str | None = None
    verification_type: str = ""
    supporting_documents: list[VerificationDocument] = []
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: datetime | None = None
    reviewed_by: str | None = None
    status: VerificationStatus = VerificationStatus.PENDING
    remarks: str = ""
    history: list[VerificationHistory] = []
