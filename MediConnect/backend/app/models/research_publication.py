from datetime import datetime, timezone
from beanie import Indexed
from pydantic import Field
from app.models.base import BaseDocument, Visibility


class ResearchPublication(BaseDocument):
    """Research papers shared by users."""
    class Settings:
        name = "research_publications"
        indexes = [
            "publication_id",
            "author_ids",
            "organization_id",
            "publication_date",
            "status",
            "doi",
            [("title", "text"), ("abstract", "text"), ("keywords", "text")],
        ]

    publication_id: str = Indexed(unique=True)
    author_ids: list[str] = []  # list of user_ids
    organization_id: str | None = Indexed(default=None)
    title: str = ""
    abstract: str = ""
    journal: str = ""
    conference: str = ""
    doi: str | None = Indexed(unique=True, default=None)
    publication_date: datetime | None = None
    keywords: list[str] = []
    pdf_url: str | None = None
    visibility: Visibility = Visibility.PUBLIC
    citation_count: int = 0
    view_count: int = 0
    download_count: int = 0
    status: str = "active"  # active, archived, removed
