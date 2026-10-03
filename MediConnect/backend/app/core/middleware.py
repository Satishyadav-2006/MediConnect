import logging
import time
import uuid
from collections import defaultdict
from collections.abc import Callable
from functools import wraps

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)

_rate_limit_store: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_WINDOW = 60


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(key: str, limit: int, window_seconds: int = _RATE_LIMIT_WINDOW) -> bool:
    now = time.time()
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]
    if len(_rate_limit_store[key]) >= limit:
        return False
    _rate_limit_store[key].append(now)
    return True


async def request_logging_middleware(request: Request, call_next: Callable) -> Response:
    request_id = str(uuid.uuid4())[:12]
    start_time = time.perf_counter()

    request.state.request_id = request_id

    logger.info(
        "Request started: %s %s [id=%s]",
        request.method,
        request.url.path,
        request_id,
    )

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    logger.info(
        "Request completed: %s %s %d [id=%s] %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        request_id,
        duration_ms,
    )

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration_ms}ms"

    return response


async def security_headers_middleware(request: Request, call_next: Callable) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


async def rate_limit_middleware(request: Request, call_next: Callable) -> Response:
    client_ip = _get_client_ip(request)
    path = request.url.path

    if path.startswith("/api/v1/auth/login") or path.startswith("/api/v1/auth/register"):
        limit = settings.RATE_LIMIT_AUTH_PER_MINUTE
    else:
        limit = settings.RATE_LIMIT_PER_MINUTE

    key = f"{client_ip}:{path}"
    if not _check_rate_limit(key, limit):
        return Response(
            content='{"success": false, "message": "Rate limit exceeded. Please try again later.", "errors": null}',
            status_code=429,
            media_type="application/json",
        )

    return await call_next(request)


def rate_limit(max_requests: int = 30, window_seconds: int = 60):
    """Per-endpoint rate limit decorator. Usage: @rate_limit(max_requests=10, window_seconds=60)"""
    def decorator(func: Callable):
        func._rate_limit_max = max_requests
        func._rate_limit_window = window_seconds

        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def per_endpoint_rate_limit_middleware(request: Request, call_next: Callable) -> Response:
    route = request.scope.get("route")
    if route and hasattr(route, "endpoint"):
        endpoint = route.endpoint
        max_requests = getattr(endpoint, "_rate_limit_max", None)
        window = getattr(endpoint, "_rate_limit_window", 60)
        if max_requests is not None:
            client_ip = _get_client_ip(request)
            key = f"{client_ip}:{request.url.path}"
            if not _check_rate_limit(key, max_requests, window):
                return Response(
                    content='{"success": false, "message": "Endpoint rate limit exceeded.", "errors": null}',
                    status_code=429,
                    media_type="application/json",
                )
    return await call_next(request)


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.is_production:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["*.mediconnect.com", "mediconnect.com", "localhost"],
        )

    app.add_middleware(GZipMiddleware, minimum_size=1000)

    app.middleware("http")(security_headers_middleware)
    app.middleware("http")(request_logging_middleware)
    app.middleware("http")(rate_limit_middleware)
    app.middleware("http")(per_endpoint_rate_limit_middleware)
