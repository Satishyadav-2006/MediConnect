from fastapi import APIRouter, Depends, Query
from app.core.database import get_database
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/hashtags", tags=["Hashtags"])


@router.get("")
async def list_hashtags(limit: int = Query(20, ge=1, le=100), user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    pipeline = [
        {"$unwind": "$hashtags"},
        {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    items = []
    async for doc in db.posts.aggregate(pipeline):
        items.append({"hashtag": doc["_id"], "count": doc["count"]})
    return {"success": True, "message": "Hashtags retrieved.", "data": {"items": items}, "errors": None}


@router.get("/{hashtag}")
async def get_hashtag(hashtag: str, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    skip = (page - 1) * limit
    cursor = db.posts.find({"hashtags": hashtag}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    total = await db.posts.count_documents({"hashtags": hashtag})
    return {"success": True, "message": f"Posts with #{hashtag}.", "data": {"items": items, "total": total, "page": page}, "errors": None}
