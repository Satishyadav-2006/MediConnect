export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  PENDING_EMAIL_VERIFICATION: 'pending_email_verification',
  PENDING_PROFESSIONAL_VERIFICATION: 'pending_professional_verification',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
} as const

export const POST_VISIBILITY = {
  PUBLIC: 'public',
  CONNECTIONS: 'connections',
  PRIVATE: 'private',
} as const

export const POST_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  RESEARCH: 'research',
  POLL: 'poll',
} as const

export const CONNECTION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const

export const JOB_TYPE = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  VOLUNTEER: 'volunteer',
  TEMPORARY: 'temporary',
} as const

export const EVENT_MODE = {
  ONLINE: 'online',
  IN_PERSON: 'in_person',
  HYBRID: 'hybrid',
} as const

export const NOTIFICATION_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'connection_request', label: 'Connections' },
  { value: 'post_like', label: 'Posts' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Events' },
  { value: 'message', label: 'Messages' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'system', label: 'System' },
] as const

export const FEED_CATEGORIES = [
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Trending' },
  { value: 'connections', label: 'Connections' },
  { value: 'organizations', label: 'Organizations' },
  { value: 'research', label: 'Research' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'internships', label: 'Internships' },
  { value: 'events', label: 'Events' },
  { value: 'mentors', label: 'Mentors' },
] as const

export const POST_FEED_CATEGORIES = ['latest', 'trending', 'connections', 'organizations', 'research'] as const

export const JOB_TABS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'latest', label: 'Latest' },
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
] as const

export const EVENT_TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'my_events', label: 'My Events' },
  { value: 'registered', label: 'Registered' },
] as const

export const SEARCH_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'people', label: 'People' },
  { value: 'organizations', label: 'Organizations' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'internships', label: 'Internships' },
  { value: 'events', label: 'Events' },
  { value: 'posts', label: 'Posts' },
] as const

export const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Family Medicine', 'Gastroenterology', 'General Surgery', 'Geriatrics',
  'Hematology', 'Infectious Disease', 'Internal Medicine', 'Nephrology',
  'Neurology', 'Neurosurgery', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Otolaryngology', 'Pathology',
  'Pediatrics', 'Physical Medicine', 'Plastic Surgery', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Urology',
] as const

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'temporary', label: 'Temporary' },
] as const

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
] as const

export const PAGE_SIZE = 20

export const ROLES = {
  INDIVIDUAL: ['doctor', 'nurse'] as const,
  ORGANIZATION: ['hospital', 'clinic', 'medical_college', 'nursing_college', 'pharmacy_college', 'allied_health_college'] as const,
  RECRUITER: ['hr', 'recruiter', 'placement_officer'] as const,
  ADMIN: ['admin', 'super_admin', 'owner', 'moderator'] as const,
  RECRUITING: ['hospital', 'clinic', 'medical_college', 'nursing_college', 'pharmacy_college', 'allied_health_college', 'hr', 'recruiter', 'placement_officer', 'moderator', 'admin', 'super_admin', 'owner'] as const,
}

export const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  hospital: 'Hospital',
  clinic: 'Clinic',
  admin: 'Admin',
  super_admin: 'Super Admin',
  owner: 'Owner',
  moderator: 'Moderator',
}
