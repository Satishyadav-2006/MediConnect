import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

from datetime import datetime, timezone
from app.models.base import (
    AccountStatus, VerificationStatus, UserRole, PostType, PostStatus, Visibility,
    ReactionType, ConnectionStatus, NotificationType, MessageStatus,
    JobStatus, JobType, WorkMode, ApplicationStatus,
    InternshipStatus, EventStatus, EventType,
    MentorshipRequestStatus, NotificationPriority, ReportStatus,
    AnnouncementStatus, TargetAudience,
)
from app.models.user import (
    PrivacySettings, NotificationSettings, SocialLinks,
    EducationItem, ExperienceItem, SkillItem, CertificationItem, LanguageItem,
)


class TestEnums:
    def test_account_status_values(self):
        assert AccountStatus.PENDING_EMAIL_VERIFICATION == "pending_email_verification"
        assert AccountStatus.PENDING_PROFESSIONAL_VERIFICATION == "pending_professional_verification"
        assert AccountStatus.ACTIVE == "active"
        assert AccountStatus.SUSPENDED == "suspended"
        assert AccountStatus.BANNED == "banned"
        assert AccountStatus.DELETED == "deleted"
        assert AccountStatus.REJECTED == "rejected"

    def test_verification_status_values(self):
        assert VerificationStatus.PENDING == "pending"
        assert VerificationStatus.UNDER_REVIEW == "under_review"
        assert VerificationStatus.APPROVED == "approved"
        assert VerificationStatus.REJECTED == "rejected"
        assert VerificationStatus.NEED_MORE_INFORMATION == "need_more_information"
        assert VerificationStatus.SUSPENDED == "suspended"

    def test_user_role_count(self):
        roles = list(UserRole)
        assert len(roles) >= 25

    def test_job_status_values(self):
        assert JobStatus.DRAFT == "draft"
        assert JobStatus.PUBLISHED == "published"
        assert JobStatus.CLOSED == "closed"
        assert JobStatus.EXPIRED == "expired"
        assert JobStatus.ARCHIVED == "archived"

    def test_work_mode_values(self):
        assert WorkMode.ONSITE == "onsite"
        assert WorkMode.REMOTE == "remote"
        assert WorkMode.HYBRID == "hybrid"

    def test_application_status_values(self):
        assert ApplicationStatus.APPLIED == "applied"
        assert ApplicationStatus.UNDER_REVIEW == "under_review"
        assert ApplicationStatus.SHORTLISTED == "shortlisted"
        assert ApplicationStatus.INTERVIEW_SCHEDULED == "interview_scheduled"
        assert ApplicationStatus.INTERVIEW_COMPLETED == "interview_completed"
        assert ApplicationStatus.SELECTED == "selected"
        assert ApplicationStatus.REJECTED == "rejected"
        assert ApplicationStatus.WITHDRAWN == "withdrawn"
        assert ApplicationStatus.OFFER_SENT == "offer_sent"
        assert ApplicationStatus.OFFER_ACCEPTED == "offer_accepted"
        assert ApplicationStatus.OFFER_DECLINED == "offer_declined"

    def test_notification_type_values(self):
        assert NotificationType.CONNECTION_REQUEST == "connection_request"
        assert NotificationType.NEW_MESSAGE == "new_message"
        assert NotificationType.MENTORSHIP_REQUEST == "mentorship_request"
        assert NotificationType.ADMIN_ANNOUNCEMENT == "admin_announcement"

    def test_post_status_values(self):
        assert PostStatus.ACTIVE == "active"
        assert PostStatus.HIDDEN == "hidden"
        assert PostStatus.ARCHIVED == "archived"
        assert PostStatus.REMOVED == "removed"

    def test_report_status_values(self):
        assert ReportStatus.PENDING == "pending"
        assert ReportStatus.IN_REVIEW == "in_review"
        assert ReportStatus.RESOLVED == "resolved"
        assert ReportStatus.DISMISSED == "dismissed"
        assert ReportStatus.ESCALATED == "escalated"

    def test_notification_priority_values(self):
        assert NotificationPriority.LOW == "low"
        assert NotificationPriority.NORMAL == "normal"
        assert NotificationPriority.HIGH == "high"
        assert NotificationPriority.CRITICAL == "critical"

    def test_connection_status_values(self):
        assert ConnectionStatus.PENDING == "pending"
        assert ConnectionStatus.ACCEPTED == "accepted"
        assert ConnectionStatus.REJECTED == "rejected"
        assert ConnectionStatus.REMOVED == "removed"

    def test_event_status_values(self):
        assert EventStatus.DRAFT == "draft"
        assert EventStatus.PUBLISHED == "published"
        assert EventStatus.COMPLETED == "completed"
        assert EventStatus.CANCELLED == "cancelled"
        assert EventStatus.ARCHIVED == "archived"

    def test_internship_status_values(self):
        assert InternshipStatus.DRAFT == "draft"
        assert InternshipStatus.PUBLISHED == "published"
        assert InternshipStatus.CLOSED == "closed"
        assert InternshipStatus.EXPIRED == "expired"
        assert InternshipStatus.ARCHIVED == "archived"


class TestUserModels:
    def test_privacy_settings_defaults(self):
        ps = PrivacySettings()
        assert ps.profile_visibility == "public"
        assert ps.email_visibility == "connections_only"
        assert ps.phone_visibility == "private"

    def test_notification_settings_defaults(self):
        ns = NotificationSettings()
        assert ns.messages is True
        assert ns.connections is True
        assert ns.jobs is True
        assert ns.email_notifications is True
        assert ns.push_notifications is True

    def test_social_links_defaults(self):
        sl = SocialLinks()
        assert sl.linkedin == ""
        assert sl.website == ""

    def test_education_item(self):
        ei = EducationItem(degree="MD", institution="Harvard")
        assert ei.degree == "MD"

    def test_experience_item(self):
        exp = ExperienceItem(
            organization_name="Hospital",
            designation="Doctor",
            start_date=datetime.now(timezone.utc),
            currently_working=True,
        )
        assert exp.currently_working is True

    def test_skill_item(self):
        si = SkillItem(skill_name="Surgery", category="clinical", experience_level="senior", years_of_experience=10)
        assert si.years_of_experience == 10
