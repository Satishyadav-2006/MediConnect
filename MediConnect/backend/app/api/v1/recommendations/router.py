from fastapi import APIRouter, Depends, Query
from app.core.database import get_database
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/jobs")
async def recommend_jobs(user_id: str = Depends(get_current_user_id), limit: int = Query(10, ge=1, le=50)):
    db = await get_database()
    query = {"status": "active"}
    cursor = db.jobs.find(query).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"success": True, "message": "Recommended jobs.", "data": {"recommendations": items}, "errors": None}


@router.get("/internships")
async def recommend_internships(user_id: str = Depends(get_current_user_id), limit: int = Query(10, ge=1, le=50)):
    db = await get_database()
    cursor = db.internships.find({"status": "active"}).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"success": True, "message": "Recommended internships.", "data": {"recommendations": items}, "errors": None}


@router.get("/events")
async def recommend_events(user_id: str = Depends(get_current_user_id), limit: int = Query(10, ge=1, le=50)):
    db = await get_database()
    cursor = db.events.find({"status": {"$ne": "cancelled"}}).sort("start_date", 1).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"success": True, "message": "Recommended events.", "data": {"recommendations": items}, "errors": None}


@router.get("/mentors")
async def recommend_mentors(user_id: str = Depends(get_current_user_id), limit: int = Query(10, ge=1, le=50)):
    db = await get_database()
    cursor = db.mentors.find({"is_available": True}).sort("rating", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"success": True, "message": "Recommended mentors.", "data": {"recommendations": items}, "errors": None}
