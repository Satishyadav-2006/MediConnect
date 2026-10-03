import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-32chars!!")
os.environ.setdefault("JWT_REFRESH_SECRET_KEY", "test-refresh-secret-key-for-testing-only-32")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "mediconnect_test")

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from bson import ObjectId
from fastapi import HTTPException

from app.api.v1.research import router as research_router


class FakeCursor:
    def __init__(self, items):
        self._items = items
        self._it = None

    def sort(self, *args, **kwargs):
        return self

    def skip(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def __aiter__(self):
        self._it = iter(self._items)
        return self

    async def __anext__(self):
        try:
            return next(self._it)
        except StopIteration:
            raise StopAsyncIteration


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = docs or []
        self.insert_one = AsyncMock(return_value=SimpleNamespace(inserted_id=ObjectId()))
        self.find_one = AsyncMock()
        self.update_one = AsyncMock(return_value=SimpleNamespace(matched_count=1))
        self.delete_one = AsyncMock(return_value=SimpleNamespace(deleted_count=1))

    def find(self, *args, **kwargs):
        return FakeCursor([dict(d) for d in self.docs])

    async def count_documents(self, *args, **kwargs):
        return len(self.docs)


def _fake_db(collection):
    return SimpleNamespace(research_publications=collection)


class TestCreateResearch:
    @pytest.mark.asyncio
    async def test_create_research_returns_id(self):
        collection = FakeCollection()
        body = research_router.ResearchCreate(title="Novel study", abstract="Abstract")
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            result = await research_router.create_research(body, user_id="user-1")

        assert result["success"] is True
        assert "research_id" in result["data"]
        collection.insert_one.assert_awaited_once()
        inserted = collection.insert_one.call_args.args[0]
        assert inserted["author_id"] == "user-1"
        assert inserted["title"] == "Novel study"

    @pytest.mark.asyncio
    async def test_create_research_defaults(self):
        collection = FakeCollection()
        body = research_router.ResearchCreate(title="Minimal")
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            await research_router.create_research(body, user_id="user-1")

        inserted = collection.insert_one.call_args.args[0]
        assert inserted["authors"] == []
        assert inserted["keywords"] == []
        assert inserted["doi"] == ""


class TestListResearch:
    @pytest.mark.asyncio
    async def test_list_research_paginates_and_stringifies_ids(self):
        docs = [{"_id": ObjectId(), "title": "A"}, {"_id": ObjectId(), "title": "B"}]
        collection = FakeCollection(docs)

        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            result = await research_router.list_research(page=1, limit=20, user_id="user-1")

        assert result["success"] is True
        assert result["data"]["total"] == 2
        assert len(result["data"]["items"]) == 2
        assert all(isinstance(item["_id"], str) for item in result["data"]["items"])

    @pytest.mark.asyncio
    async def test_list_research_empty(self):
        collection = FakeCollection([])
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            result = await research_router.list_research(page=1, limit=20, user_id="user-1")

        assert result["data"]["items"] == []
        assert result["data"]["total"] == 0


class TestGetResearch:
    @pytest.mark.asyncio
    async def test_get_research_success(self):
        oid = ObjectId()
        collection = FakeCollection()
        collection.find_one = AsyncMock(return_value={"_id": oid, "title": "Study"})
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            result = await research_router.get_research(str(oid), user_id="user-1")

        assert result["data"]["_id"] == str(oid)
        assert result["data"]["title"] == "Study"

    @pytest.mark.asyncio
    async def test_get_research_invalid_id_returns_400(self):
        collection = FakeCollection()
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            with pytest.raises(HTTPException) as exc:
                await research_router.get_research("not-an-objectid", user_id="user-1")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_get_research_missing_returns_404(self):
        collection = FakeCollection()
        collection.find_one = AsyncMock(return_value=None)
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            with pytest.raises(HTTPException) as exc:
                await research_router.get_research(str(ObjectId()), user_id="user-1")
        assert exc.value.status_code == 404


class TestUpdateResearch:
    @pytest.mark.asyncio
    async def test_update_research_success(self):
        oid = ObjectId()
        collection = FakeCollection()
        body = research_router.ResearchUpdate(title="Updated")
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            result = await research_router.update_research(str(oid), body, user_id="user-1")

        assert result["success"] is True
        update = collection.update_one.call_args.args[1]["$set"]
        assert update["title"] == "Updated"
        assert "updated_at" in update

    @pytest.mark.asyncio
    async def test_update_research_invalid_id_returns_400(self):
        collection = FakeCollection()
        body = research_router.ResearchUpdate(title="X")
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            with pytest.raises(HTTPException) as exc:
                await research_router.update_research("bad-id", body, user_id="user-1")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_update_research_missing_returns_404(self):
        collection = FakeCollection()
        collection.update_one = AsyncMock(return_value=SimpleNamespace(matched_count=0))
        body = research_router.ResearchUpdate(title="X")
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            with pytest.raises(HTTPException) as exc:
                await research_router.update_research(str(ObjectId()), body, user_id="user-1")
        assert exc.value.status_code == 404


class TestDeleteResearch:
    @pytest.mark.asyncio
    async def test_delete_research_success(self):
        collection = FakeCollection()
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            result = await research_router.delete_research(str(ObjectId()), user_id="user-1")

        assert result["success"] is True
        collection.delete_one.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_delete_research_invalid_id_returns_400(self):
        collection = FakeCollection()
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            with pytest.raises(HTTPException) as exc:
                await research_router.delete_research("bad-id", user_id="user-1")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_delete_research_missing_returns_404(self):
        collection = FakeCollection()
        collection.delete_one = AsyncMock(return_value=SimpleNamespace(deleted_count=0))
        with patch("app.api.v1.research.router.get_database", new_callable=AsyncMock, return_value=_fake_db(collection)):
            with pytest.raises(HTTPException) as exc:
                await research_router.delete_research(str(ObjectId()), user_id="user-1")
        assert exc.value.status_code == 404
