from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.database import get_database
from app.core.dependencies import get_current_user_id
from bson import ObjectId

router = APIRouter(prefix="/channels", tags=["Channels"])


class ChannelCreate(BaseModel):
    name: str
    description: str = ""
    organization_id: Optional[str] = None


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ChannelMessageCreate(BaseModel):
    content: str
    message_type: str = "text"


@router.get("")
async def list_channels(user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    cursor = db.channels.find({"members": str(user_id)}).sort("created_at", -1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"success": True, "message": "Channels retrieved.", "data": {"items": items}, "errors": None}


@router.post("")
async def create_channel(body: ChannelCreate, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    doc = body.model_dump()
    doc["created_by"] = str(user_id)
    doc["members"] = [str(user_id)]
    doc["created_at"] = datetime.utcnow().isoformat()
    result = await db.channels.insert_one(doc)
    return {"success": True, "message": "Channel created.", "data": {"channel_id": str(result.inserted_id)}, "errors": None}


@router.patch("/{channel_id}")
async def update_channel(channel_id: str, body: ChannelUpdate, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    try:
        result = await db.channels.update_one({"_id": ObjectId(channel_id)}, {"$set": update})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid channel ID")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"success": True, "message": "Channel updated.", "data": None, "errors": None}


@router.delete("/{channel_id}")
async def delete_channel(channel_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    try:
        result = await db.channels.delete_one({"_id": ObjectId(channel_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid channel ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"success": True, "message": "Channel deleted.", "data": None, "errors": None}


@router.post("/{channel_id}/messages")
async def send_channel_message(channel_id: str, body: ChannelMessageCreate, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    doc = body.model_dump()
    doc["channel_id"] = channel_id
    doc["sender_id"] = str(user_id)
    doc["created_at"] = datetime.utcnow().isoformat()
    doc["status"] = "sent"
    result = await db.channel_messages.insert_one(doc)
    return {"success": True, "message": "Message sent.", "data": {"message_id": str(result.inserted_id)}, "errors": None}


@router.get("/{channel_id}/messages")
async def get_channel_messages(channel_id: str, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=100), user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    skip = (page - 1) * limit
    cursor = db.channel_messages.find({"channel_id": channel_id}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"success": True, "message": "Channel messages retrieved.", "data": {"items": items, "page": page, "limit": limit}, "errors": None}
