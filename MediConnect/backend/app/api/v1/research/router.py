from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.database import get_database
from app.core.dependencies import get_current_user_id
from bson import ObjectId

router = APIRouter(prefix="/research", tags=["Research"])


class ResearchCreate(BaseModel):
    title: str
    abstract: str = ""
    authors: List[str] = []
    journal: str = ""
    conference: str = ""
    doi: str = ""
    publication_date: str = ""
    keywords: List[str] = []
    pdf_url: str = ""


class ResearchUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    authors: Optional[List[str]] = None
    journal: Optional[str] = None
    conference: Optional[str] = None
    doi: Optional[str] = None
    publication_date: Optional[str] = None
    keywords: Optional[List[str]] = None
    pdf_url: Optional[str] = None


@router.post("")
async def create_research(body: ResearchCreate, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    doc = body.model_dump()
    doc["author_id"] = str(user_id)
    doc["created_at"] = datetime.utcnow().isoformat()
    doc["updated_at"] = datetime.utcnow().isoformat()
    result = await db.research_publications.insert_one(doc)
    return {"success": True, "message": "Research publication created.", "data": {"research_id": str(result.inserted_id)}, "errors": None}


@router.get("")
async def list_research(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    skip = (page - 1) * limit
    cursor = db.research_publications.find().sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    total = await db.research_publications.count_documents({})
    return {"success": True, "message": "Research publications retrieved.", "data": {"items": items, "total": total, "page": page, "limit": limit}, "errors": None}


@router.get("/{research_id}")
async def get_research(research_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    try:
        doc = await db.research_publications.find_one({"_id": ObjectId(research_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid research ID")
    if not doc:
        raise HTTPException(status_code=404, detail="Research publication not found")
    doc["_id"] = str(doc["_id"])
    return {"success": True, "message": "Research publication retrieved.", "data": doc, "errors": None}


@router.patch("/{research_id}")
async def update_research(research_id: str, body: ResearchUpdate, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    update["updated_at"] = datetime.utcnow().isoformat()
    try:
        result = await db.research_publications.update_one({"_id": ObjectId(research_id)}, {"$set": update})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid research ID")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Research publication not found")
    return {"success": True, "message": "Research publication updated.", "data": None, "errors": None}


@router.delete("/{research_id}")
async def delete_research(research_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    try:
        result = await db.research_publications.delete_one({"_id": ObjectId(research_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid research ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Research publication not found")
    return {"success": True, "message": "Research publication deleted.", "data": None, "errors": None}
