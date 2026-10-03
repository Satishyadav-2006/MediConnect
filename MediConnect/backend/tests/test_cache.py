import time

import pytest
from unittest.mock import AsyncMock, patch

from app.core import cache


class TestCacheFailFast:
    @pytest.mark.asyncio
    async def test_redis_down_returns_none_and_cooldowns(self):
        cache._redis_client = None
        cache._redis_unavailable_until = 0.0

        bad_client = AsyncMock()
        bad_client.ping = AsyncMock(side_effect=Exception("refused"))
        bad_client.get = AsyncMock(side_effect=Exception("refused"))

        with patch("redis.asyncio.from_url", return_value=bad_client) as mock_from_url:
            result = await cache.get_redis()
            assert result is None
            assert mock_from_url.call_count == 1

            result2 = await cache.get_redis()
            assert result2 is None
            assert mock_from_url.call_count == 1

    @pytest.mark.asyncio
    async def test_cache_get_returns_none_when_redis_down(self):
        cache._redis_client = None
        cache._redis_unavailable_until = time.time() + 60

        result = await cache.cache_get("jobs:list:1:20")
        assert result is None

    @pytest.mark.asyncio
    async def test_redis_reconnects_after_cooldown(self):
        cache._redis_client = None
        cache._redis_unavailable_until = 0.0

        good_client = AsyncMock()
        good_client.ping = AsyncMock(return_value=True)
        good_client.get = AsyncMock(return_value='{"items": []}')

        with patch("redis.asyncio.from_url", return_value=good_client):
            client = await cache.get_redis()
            assert client is good_client
            value = await cache.cache_get("jobs:list:1:20")
            assert value == {"items": []}

    @pytest.mark.asyncio
    async def test_teardown_resets_state(self):
        cache._redis_client = None
        cache._redis_unavailable_until = 0.0
