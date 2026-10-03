from pydantic import BaseModel
from typing import Optional

class AdminUserUpdateRequest(BaseModel):
    status: Optional[str] = None
    role: Optional[str] = None
    reason: Optional[str] = None

class ReportUpdateRequest(BaseModel):
    status: str
    action: Optional[str] = None
    notes: Optional[str] = None

class AnnouncementCreateRequest(BaseModel):
    title: str
    message: str
    target_roles: list[str] = []
    priority: str = "normal"

class RoleUpdateRequest(BaseModel):
    role: str
