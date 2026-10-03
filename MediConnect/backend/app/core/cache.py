import json
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)

_redis_client = None
_redis_unavailable_until = 0.0
_REDIS_RETRY_AFTER = 30


async def get_redis():
    global _redis_client, _redis_unavailable_until
    if _redis_client is not None:
        return _redis_client
    if time.time() < _redis_unavailable_until:
        return None
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(
            "redis://localhost:6379",
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        await client.ping()
        _redis_client = client
        _redis_unavailable_until = 0.0
        logger.info("Redis connected")
        return _redis_client
    except Exception as e:
        _redis_client = None
        _redis_unavailable_until = time.time() + _REDIS_RETRY_AFTER
        logger.warning("Redis unavailable (caching disabled): %s", e)
        return None


async def cache_get(key: str) -> Any | None:
    r = await get_redis()
    if not r:
        return None
    try:
        data = await r.get(key)
        if data:
            return json.loads(data)
    except Exception:
        pass
    return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    r = await get_redis()
    if not r:
        return
    try:
        await r.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    r = await get_redis()
    if not r:
        return
    try:
        await r.delete(key)
    except Exception:
        pass


async def cache_delete_pattern(pattern: str) -> None:
    r = await get_redis()
    if not r:
        return
    try:
        keys = []
        async for key in r.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            await r.delete(*keys)
    except Exception:
        pass


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
