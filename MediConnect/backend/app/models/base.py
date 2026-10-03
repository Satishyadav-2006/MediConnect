from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from bson import ObjectId
from beanie import Document, Indexed
from pydantic import Field, ConfigDict


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: str | ObjectId | None, _info=None) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return v
        raise ValueError(f"Invalid ObjectId: {v}")


class BaseDocument(Document):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str | None = None
    updated_by: str | None = None
    version: int = 1
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: str | None = None

    async def pre_save(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        if self.version > 1:
            pass

    class Settings:
        validate_on_save = True


class AccountStatus(str, Enum):
    PENDING_EMAIL_VERIFICATION = "pending_email_verification"
    PENDING_PROFESSIONAL_VERIFICATION = "pending_professional_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    DELETED = "deleted"
    REJECTED = "rejected"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEED_MORE_INFORMATION = "need_more_information"
    SUSPENDED = "suspended"


class UserRole(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    DENTIST = "dentist"
    PHARMACIST = "pharmacist"
    PHYSIOTHERAPIST = "physiotherapist"
    RADIOLOGIST = "radiologist"
    LAB_TECHNICIAN = "lab_technician"
    ALLIED_HEALTH = "allied_health"
    MEDICAL_STUDENT = "medical_student"
    NURSING_STUDENT = "nursing_student"
    PHARMACY_STUDENT = "pharmacy_student"
    PHYSIOTHERAPY_STUDENT = "physiotherapy_student"
    FACULTY = "faculty"
    PROFESSOR = "professor"
    RESEARCHER = "researcher"
    HOSPITAL = "hospital"
    CLINIC = "clinic"
    MEDICAL_COLLEGE = "medical_college"
    NURSING_COLLEGE = "nursing_college"
    PHARMACY_COLLEGE = "pharmacy_college"
    ALLIED_HEALTH_COLLEGE = "allied_health_college"
    HR = "hr"
    RECRUITER = "recruiter"
    PLACEMENT_OFFICER = "placement_officer"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    OWNER = "owner"


class PostType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    RESEARCH = "research"
    POLL = "poll"
    ANNOUNCEMENT = "announcement"


class PostStatus(str, Enum):
    ACTIVE = "active"
    HIDDEN = "hidden"
    ARCHIVED = "archived"
    REMOVED = "removed"


class Visibility(str, Enum):
    PUBLIC = "public"
    CONNECTIONS = "connections"
    ORGANIZATION = "organization"
    PRIVATE = "private"


class ReactionType(str, Enum):
    LIKE = "like"
    CELEBRATE = "celebrate"
    SUPPORT = "support"
    INSIGHTFUL = "insightful"
    LOVE = "love"


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REMOVED = "removed"


class NotificationType(str, Enum):
    CONNECTION_REQUEST = "connection_request"
    CONNECTION_ACCEPTED = "connection_accepted"
    NEW_MESSAGE = "new_message"
    MESSAGE_REACTION = "message_reaction"
    MENTION = "mention"
    COMMENT = "comment"
    REPLY = "reply"
    POST_REACTION = "post_reaction"
    FOLLOWER = "follower"
    ORGANIZATION_INVITE = "organization_invite"
    VERIFICATION_UPDATE = "verification_update"
    JOB_RECOMMENDATION = "job_recommendation"
    INTERNSHIP_RECOMMENDATION = "internship_recommendation"
    EVENT_REMINDER = "event_reminder"
    MENTORSHIP_REQUEST = "mentorship_request"
    ADMIN_ANNOUNCEMENT = "admin_announcement"
    SYSTEM_NOTIFICATION = "system_notification"


class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    EXPIRED = "expired"
    ARCHIVED = "archived"


class WorkMode(str, Enum):
    ONSITE = "onsite"
    REMOTE = "remote"
    HYBRID = "hybrid"


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    SELECTED = "selected"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    OFFER_SENT = "offer_sent"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"


class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    EXECUTIVE = "executive"
    ATTENDING = "attending"
    CHIEF = "chief"
    INTERN = "intern"
    RESIDENT = "resident"
    FELLOW = "fellow"


class InternshipStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    EXPIRED = "expired"
    ARCHIVED = "archived"


class InternshipType(str, Enum):
    CLINICAL = "clinical"
    RESEARCH = "research"
    COMMUNITY = "community"
    ELECTIVE = "elective"
    MANDATORY = "mandatory"


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class EventType(str, Enum):
    CONFERENCE = "conference"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    WEBINAR = "webinar"
    SYMPOSIUM = "symposium"
    CONVENTION = "convention"
    CME = "cme"
    GRAND_ROUNDS = "grand_rounds"
    HEALTH_CAMP = "health_camp"
    CULTURAL = "cultural"
    SPORTS = "sports"
    HACKATHON = "hackathon"
    CAREER_FAIR = "career_fair"
    TRAINING_SESSION = "training_session"
    OTHER = "other"


class EventMode(str, Enum):
    OFFLINE = "offline"
    ONLINE = "online"
    HYBRID = "hybrid"


class EventRegistrationStatus(str, Enum):
    REGISTERED = "registered"
    CANCELLED = "cancelled"


class MentorshipStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class MentorshipRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class MentorshipGoal(str, Enum):
    CAREER_GUIDANCE = "career_guidance"
    CLINICAL_SKILLS = "clinical_skills"
    RESEARCH = "research"
    LEADERSHIP = "leadership"
    WORK_LIFE_BALANCE = "work_life_balance"
    BOARD_PREP = "board_prep"
    RESIDENCY_PREP = "residency_prep"
    PUBLICATION = "publication"
    NETWORKING = "networking"
    OTHER = "other"


class JobVisibility(str, Enum):
    PUBLIC = "public"
    ORGANIZATION_ONLY = "organization_only"
    PRIVATE = "private"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class ReportAction(str, Enum):
    DISMISS = "dismiss"
    WARN = "warn"
    REMOVE_CONTENT = "remove_content"
    SUSPEND = "suspend"
    BAN = "ban"
    ESCALATE = "escalate"


class ReportStatus(str, Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"
    ESCALATED = "escalated"


class AnnouncementStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    EXPIRED = "expired"
    ARCHIVED = "archived"


class TargetAudience(str, Enum):
    ALL_USERS = "all_users"
    HEALTHCARE_PROFESSIONALS = "healthcare_professionals"
    HEALTHCARE_STUDENTS = "healthcare_students"
    FACULTY = "faculty"
    ORGANIZATIONS = "organizations"
    RECRUITERS = "recruiters"
    HR = "hr"
    ADMINS = "admins"


class CategoryType(str, Enum):
    SPECIALIZATION = "specialization"
    DEPARTMENT = "department"
    RESEARCH_AREA = "research_area"
    JOB_CATEGORY = "job_category"
    SKILL = "skill"
    LANGUAGE = "language"


class AttendanceStatus(str, Enum):
    PENDING = "pending"
    PRESENT = "present"
    ABSENT = "absent"


class OrganizationRole(str, Enum):
    ORG_ADMIN = "org_admin"
    HR = "hr"
    RECRUITER = "recruiter"
    FACULTY = "faculty"
    HEALTHCARE_PROFESSIONAL = "healthcare_professional"
    HEALTHCARE_STUDENT = "healthcare_student"
    EMPLOYEE = "employee"


class OrganizationMemberStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REMOVED = "removed"


PROFESSIONAL_MENTOR_ROLES = (
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.DENTIST,
    UserRole.PHARMACIST,
    UserRole.PHYSIOTHERAPIST,
    UserRole.RADIOLOGIST,
    UserRole.LAB_TECHNICIAN,
    UserRole.ALLIED_HEALTH,
    UserRole.FACULTY,
    UserRole.PROFESSOR,
    UserRole.RESEARCHER,
)

MIN_MENTOR_EXPERIENCE_YEARS = 3
