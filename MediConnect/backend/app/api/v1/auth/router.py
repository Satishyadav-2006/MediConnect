from fastapi import APIRouter, Depends, Request, status

from app.schemas.auth import (
    RegisterRequest,
    VerifyEmailRequest,
    ResendOTPRequest,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user_id
from app.core.exceptions import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    result = await AuthService.register(body)
    return success_response("Registration successful. Please verify your email.", result)


@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest):
    result = await AuthService.verify_email(body)
    return success_response(result.get("message", "Email verified"), result)


@router.post("/resend-otp")
async def resend_otp(body: ResendOTPRequest):
    result = await AuthService.resend_otp(body.email)
    return success_response(result["message"], {"otp": result.get("otp")})


@router.post("/login")
async def login(body: LoginRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "Unknown Device")
    result = await AuthService.login(body, ip_address=ip, device_info=ua)
    return success_response("Login successful", {
        "access_token": result.access_token,
        "refresh_token": result.refresh_token,
        "token_type": result.token_type,
        "expires_in": result.expires_in,
        "user": result.user,
    })


@router.post("/refresh")
async def refresh_token(body: RefreshTokenRequest):
    result = await AuthService.refresh_token(body)
    return success_response("Token refreshed", {
        "access_token": result.access_token,
        "refresh_token": result.refresh_token,
        "token_type": result.token_type,
        "expires_in": result.expires_in,
        "user": result.user,
    })


@router.post("/logout")
async def logout(
    body: RefreshTokenRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await AuthService.logout(user_id, body.refresh_token)
    return success_response(result["message"])


@router.post("/logout-all")
async def logout_all(user_id: str = Depends(get_current_user_id)):
    result = await AuthService.logout_all(user_id)
    return success_response(result["message"])


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    result = await AuthService.forgot_password(body)
    return success_response(result["message"])


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    result = await AuthService.reset_password(body)
    return success_response(result["message"])


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await AuthService.change_password(user_id, body)
    return success_response(result["message"])


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    result = await AuthService.get_me(user_id)
    return success_response("User profile retrieved", result)


@router.get("/sessions")
async def get_sessions(user_id: str = Depends(get_current_user_id)):
    sessions = await AuthService.get_sessions(user_id)
    return success_response("Sessions retrieved", sessions)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
):
    result = await AuthService.delete_session(user_id, session_id)
    return success_response(result["message"])
