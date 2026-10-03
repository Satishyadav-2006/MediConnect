import logging
from typing import Any

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


class CloudinaryService:

    @staticmethod
    async def upload_image(
        file: UploadFile,
        folder: str = "uploads",
        max_size_mb: int = 10,
    ) -> str:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise ValueError("File must be an image")

        contents = await file.read()
        max_bytes = max_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise ValueError(f"File size exceeds {max_size_mb}MB limit")

        result = cloudinary.uploader.upload(
            contents,
            folder=f"mediconnect/{folder}",
            resource_type="image",
            transformation=[
                {"width": 800, "height": 800, "crop": "limit", "quality": "auto"}
            ],
        )
        logger.info("Image uploaded to Cloudinary: %s", result.get("secure_url"))
        return result["secure_url"]

    @staticmethod
    async def upload_video(
        file: UploadFile,
        folder: str = "uploads",
        max_size_mb: int = 50,
    ) -> str:
        contents = await file.read()
        max_bytes = max_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise ValueError(f"File size exceeds {max_size_mb}MB limit")

        result = cloudinary.uploader.upload(
            contents,
            folder=f"mediconnect/{folder}",
            resource_type="video",
        )
        logger.info("Video uploaded to Cloudinary: %s", result.get("secure_url"))
        return result["secure_url"]

    @staticmethod
    async def upload_document(
        file: UploadFile,
        folder: str = "documents",
        max_size_mb: int = 20,
    ) -> str:
        contents = await file.read()
        max_bytes = max_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise ValueError(f"File size exceeds {max_size_mb}MB limit")

        result = cloudinary.uploader.upload(
            contents,
            folder=f"mediconnect/{folder}",
            resource_type="raw",
        )
        logger.info("Document uploaded to Cloudinary: %s", result.get("secure_url"))
        return result["secure_url"]

    @staticmethod
    def delete_file(public_id: str) -> bool:
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            logger.error("Failed to delete file: %s", e)
            return False
