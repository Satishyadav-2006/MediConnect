import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppException(Exception):
    def __init__(self, status_code: int, message: str, errors: Any = None):
        self.status_code = status_code
        self.message = message
        self.errors = errors


class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed", errors: Any = None):
        super().__init__(status.HTTP_401_UNAUTHORIZED, message, errors)


class AuthorizationError(AppException):
    def __init__(self, message: str = "Access denied", errors: Any = None):
        super().__init__(status.HTTP_403_FORBIDDEN, message, errors)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", errors: Any = None):
        super().__init__(status.HTTP_404_NOT_FOUND, message, errors)


class ConflictError(AppException):
    def __init__(self, message: str = "Resource already exists", errors: Any = None):
        super().__init__(status.HTTP_409_CONFLICT, message, errors)


class ValidationAppError(AppException):
    def __init__(self, message: str = "Validation failed", errors: Any = None):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, message, errors)


class RateLimitError(AppException):
    def __init__(self, message: str = "Too many requests", errors: Any = None):
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, message, errors)


class AccountLockedError(AppException):
    def __init__(self, message: str = "Account is locked. Try again later.", errors: Any = None):
        super().__init__(status.HTTP_423_LOCKED, message, errors)


class AccountSuspendedError(AppException):
    def __init__(self, message: str = "Account has been suspended", errors: Any = None):
        super().__init__(status.HTTP_403_FORBIDDEN, message, errors)


class VerificationPendingError(AppException):
    def __init__(self, message: str = "Email verification required", errors: Any = None):
        super().__init__(status.HTTP_403_FORBIDDEN, message, errors)


def success_response(message: str = "Operation completed successfully", data: Any = None) -> dict[str, Any]:
    return {"success": True, "message": message, "data": data, "errors": None}


def error_response(message: str = "An error occurred", errors: Any = None) -> dict[str, Any]:
    return {"success": False, "message": message, "data": None, "errors": errors}


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc.message, exc.errors),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error["loc"])
            errors.append({"field": loc, "message": error["msg"]})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response("Validation failed", errors),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(str(exc.detail)),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response("Internal server error"),
        )
