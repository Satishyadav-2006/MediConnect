from datetime import datetime, timezone
from beanie import Indexed
from pymongo import ASCENDING, IndexModel
from pydantic import Field
from app.models.base import BaseDocument, CategoryType


class Category(BaseDocument):
    """Reusable master data used throughout the platform."""
    class Settings:
        name = "categories"
        indexes = [
            "category_name",
            "status",
            IndexModel(
                [("category_type", ASCENDING), ("category_name", ASCENDING)],
                unique=True,
                name="category_type_name_unique",
            ),
        ]

    category_type: CategoryType = Indexed()
    category_name: str = ""
    description: str = ""
    display_order: int = 0
    status: str = "active"  # active, inactive
