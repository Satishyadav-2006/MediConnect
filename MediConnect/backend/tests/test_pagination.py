import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "15"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

from app.utils.pagination import encode_cursor, decode_cursor, paginate_response


class TestCursorPagination:
    def test_encode_decode_cursor(self):
        cursor = encode_cursor({"page": 2, "id": "abc123"})
        decoded = decode_cursor(cursor)
        assert decoded["page"] == 2
        assert decoded["id"] == "abc123"

    def test_decode_invalid_cursor(self):
        result = decode_cursor("not-a-valid-cursor!!!")
        assert result == {}

    def test_paginate_response_basic(self):
        items = [{"name": "item1"}, {"name": "item2"}]
        result = paginate_response(items, total=10, page=1, per_page=2)
        assert result["items"] == items
        assert result["total"] == 10
        assert result["page"] == 1
        assert result["per_page"] == 2
        assert result["total_pages"] == 5
        assert result["has_more"] is True
        assert result["next_cursor"] is not None
        assert result["prev_cursor"] is None

    def test_paginate_response_last_page(self):
        items = [{"name": "item9"}, {"name": "item10"}]
        result = paginate_response(items, total=10, page=5, per_page=2)
        assert result["has_more"] is False
        assert result["next_cursor"] is None
        assert result["prev_cursor"] is not None

    def test_paginate_response_single_page(self):
        items = [{"name": "item1"}]
        result = paginate_response(items, total=1, page=1, per_page=20)
        assert result["has_more"] is False
        assert result["total_pages"] == 1
        assert result["next_cursor"] is None
        assert result["prev_cursor"] is None

    def test_paginate_response_empty(self):
        result = paginate_response([], total=0, page=1, per_page=20)
        assert result["items"] == []
        assert result["total"] == 0
        assert result["has_more"] is False

    def test_paginate_response_page_2(self):
        items = [{"name": "item3"}]
        result = paginate_response(items, total=10, page=2, per_page=1)
        assert result["prev_cursor"] is not None
        prev = decode_cursor(result["prev_cursor"])
        assert prev["page"] == 1
