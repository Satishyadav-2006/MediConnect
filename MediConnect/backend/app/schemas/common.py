from typing import Any, Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: T | None = None
    errors: Any = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: List[T] = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False
    errors: Any = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str = "An error occurred"
    data: None = None
    errors: Any = None


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.per_page


class CursorPaginationParams(BaseModel):
    cursor: str | None = None
    limit: int = Field(default=20, ge=1, le=100)


class MessageResponse(BaseModel):
    success: bool = True
    message: str
    data: None = None
    errors: Any = None
