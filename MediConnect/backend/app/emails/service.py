import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:

    @staticmethod
    def _build_message(
        to_email: str,
        subject: str,
        html_content: str,
    ) -> MIMEMultipart:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))
        return msg

    @staticmethod
    async def send_email(to_email: str, subject: str, html_content: str) -> bool:
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            logger.warning("SMTP not configured. Email to %s not sent.", to_email)
            return False

        try:
            msg = EmailService._build_message(to_email, subject, html_content)

            def _send() -> None:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

            import asyncio
            await asyncio.get_event_loop().run_in_executor(None, _send)
            logger.info("Email sent to %s: %s", to_email, subject)
            return True
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to_email, e)
            return False

    @staticmethod
    async def send_otp_email(to_email: str, otp: str, first_name: str = "User") -> bool:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">MediConnect - Email Verification</h2>
            <p>Hello {first_name},</p>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">{otp}</span>
            </div>
            <p>This code expires in <strong>5 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">MediConnect - Professional Healthcare Network</p>
        </div>
        """
        return await EmailService.send_email(to_email, "MediConnect - Verify Your Email", html)

    @staticmethod
    async def send_welcome_email(to_email: str, first_name: str) -> bool:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to MediConnect!</h2>
            <p>Hello {first_name},</p>
            <p>Your account has been created successfully. Welcome to the healthcare community!</p>
            <p>Complete your profile to get the most out of MediConnect.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">MediConnect - Professional Healthcare Network</p>
        </div>
        """
        return await EmailService.send_email(to_email, "Welcome to MediConnect!", html)

    @staticmethod
    async def send_password_reset_email(to_email: str, reset_token: str, first_name: str = "User") -> bool:
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">MediConnect - Password Reset</h2>
            <p>Hello {first_name},</p>
            <p>You requested a password reset. Click the button below:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="{reset_link}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link expires in <strong>1 hour</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">MediConnect - Professional Healthcare Network</p>
        </div>
        """
        return await EmailService.send_email(to_email, "MediConnect - Reset Your Password", html)

    @staticmethod
    async def send_verification_approved_email(to_email: str, first_name: str) -> bool:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #16a34a;">Verification Approved!</h2>
            <p>Hello {first_name},</p>
            <p>Your professional verification has been <strong>approved</strong>. Your profile now shows a verified badge.</p>
            <p>Thank you for being part of the MediConnect community.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">MediConnect - Professional Healthcare Network</p>
        </div>
        """
        return await EmailService.send_email(to_email, "MediConnect - Verification Approved", html)

    @staticmethod
    async def send_verification_rejected_email(to_email: str, first_name: str, reason: str) -> bool:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">Verification Update</h2>
            <p>Hello {first_name},</p>
            <p>Unfortunately, your professional verification was <strong>not approved</strong>.</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p>You can reapply with updated documents.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">MediConnect - Professional Healthcare Network</p>
        </div>
        """
        return await EmailService.send_email(to_email, "MediConnect - Verification Update", html)