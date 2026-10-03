from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ConnectionRequest(BaseModel):
    receiver_id: str


class ConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    connection_id: str
    requester_id: str
    receiver_id: str
    status: str
    created_at: datetime


class FollowRequest(BaseModel):
    following_id: str
    following_type: str = "user"


class BlockRequest(BaseModel):
    blocked_id: str
