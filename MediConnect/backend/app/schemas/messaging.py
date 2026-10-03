from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MessageCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    conversation_id: str | None = None
    recipient_id: str | None = None
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: str = "text"
    reply_to: str | None = None
    mentions: list[str] = Field(default_factory=list)


class MessageUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    content: str = Field(..., min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    message_id: str
    conversation_id: str
    sender_id: str
    message_type: str
    content: str
    attachments: list[dict] = Field(default_factory=list)
    reply_to: str | None = None
    status: str
    edited: bool
    deleted: bool
    read_by: list[str] = Field(default_factory=list)
    reactions: list[dict] = Field(default_factory=list)
    is_pinned: bool
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    conversation_id: str
    conversation_type: str
    participants: list[str]
    title: str
    last_message: str
    last_message_time: datetime | None = None
    last_message_sender: str | None = None
    unread_counts: dict[str, int] = Field(default_factory=dict)
    created_at: datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    notification_id: str
    sender_id: str | None = None
    notification_type: str
    title: str
    message: str
    reference_id: str | None = None
    reference_type: str | None = None
    read: bool
    priority: str
    created_at: datetime


class DeviceRegisterRequest(BaseModel):
    device_name: str = ""
    platform: str = ""
    fcm_token: str = Field(..., min_length=1)


class ConversationCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    conversation_type: str = "direct"
    participant_ids: list[str] = Field(..., min_length=1)
    title: str = ""
