export interface User {
  _id: string
  email: string
  fullName: string
  username: string
  role: UserRole
  accountStatus: AccountStatus
  profilePhoto?: string
  coverPhoto?: string
  headline?: string
  bio?: string
  location?: string
  country?: string
  state?: string
  city?: string
  specialization?: string
  licenseNumber?: string
  yearsOfExperience?: number
  currentOrganization?: {
    organization_id: string
    name: string
    logo?: string
    type?: string
    employee_count?: number
  } | null
  currentOrganizationName?: string | null
  organizationId?: string | null
  isEmployee?: boolean
  department?: string
  designation?: string | null
  skills: string[]
  languages: string[]
  certifications: Certification[]
  education: Education[]
  experience: Experience[]
  isEmailVerified: boolean
  isProfileComplete: boolean
  verificationStatus?: string
  followersCount: number
  followingCount: number
  connectionsCount: number
  postsCount: number
  createdAt: string
  updatedAt: string
  unreadMessagesCount?: number
}

export type UserRole =
  | 'doctor' | 'nurse' | 'dentist' | 'pharmacist' | 'physiotherapist' | 'radiologist'
  | 'lab_technician' | 'medical_student' | 'nursing_student' | 'pharmacy_student'
  | 'faculty' | 'professor' | 'researcher'
  | 'hospital' | 'clinic' | 'medical_college' | 'nursing_college' | 'pharmacy_college' | 'allied_health_college'
  | 'hr' | 'recruiter' | 'placement_officer'
  | 'moderator' | 'admin' | 'super_admin' | 'owner'
export type AccountStatus = 'active' | 'pending_email_verification' | 'pending_professional_verification' | 'rejected' | 'suspended' | 'deactivated'

export interface Education {
  _id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description?: string
}

export interface Experience {
  _id: string
  organization: string
  title: string
  employmentType: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description?: string
  location?: string
}

export interface Certification {
  _id: string
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
}

export interface Organization {
  _id: string
  name: string
  slug: string
  type: 'hospital' | 'clinic' | 'nursing_home' | 'diagnostic_center' | 'pharmacy' | 'other'
  logo?: string
  coverPhoto?: string
  description?: string
  website?: string
  email?: string
  phone?: string
  location?: string
  country?: string
  state?: string
  city?: string
  employeesCount: number
  followersCount: number
  isVerified: boolean
  foundedYear?: number
  specializations: string[]
  createdAt: string
}

export interface Post {
  _id: string
  author: User | Organization
  authorType: 'User' | 'Organization'
  content: string
  visibility: PostVisibility
  type: PostType
  images: string[]
  video?: string
  document?: { url: string; name: string; type: string }
  poll?: Poll
  research?: Research
  tags: string[]
  mentions: string[]
  hashtags: string[]
  likesCount: number
  commentsCount: number
  sharesCount: number
  isLiked: boolean
  isSaved: boolean
  createdAt: string
  updatedAt: string
}

export type PostVisibility = 'public' | 'connections' | 'private'
export type PostType = 'text' | 'image' | 'video' | 'document' | 'research' | 'poll'

export interface Poll {
  _id: string
  question: string
  options: PollOption[]
  totalVotes: number
  endsAt?: string
  hasVoted: boolean
}

export interface PollOption {
  _id: string
  text: string
  votes: number
  percentage: number
}

export interface Research {
  title: string
  abstract: string
  journal?: string
  publishDate?: string
  doi?: string
  authors: string[]
}

export interface Comment {
  _id: string
  author: User
  content: string
  parentComment?: string
  likesCount: number
  isLiked: boolean
  repliesCount: number
  createdAt: string
  replies?: Comment[]
}

export interface Connection {
  _id: string
  requester: User
  recipient: User
  status: ConnectionStatus
  createdAt: string
  updatedAt: string
}

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface Conversation {
  _id: string
  type: 'direct' | 'group' | 'organization' | 'broadcast'
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  name?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  conversation: string
  sender: User
  content: string
  type: 'text' | 'image' | 'file' | 'audio' | 'video'
  fileUrl?: string
  fileName?: string
  replyTo?: { _id: string; sender: User; content: string }
  readBy: string[]
  deliveredTo: string[]
  isEdited: boolean
  isDeleted: boolean
  isPinned: boolean
  reactions?: { emoji: string; users: string[] }[]
  createdAt: string
  updatedAt: string
}

export interface Notification {
  _id: string
  recipient: string
  sender?: User
  type: NotificationType
  title: string
  message: string
  referenceId?: string
  referenceModel?: string
  isRead: boolean
  createdAt: string
}

export type NotificationType = 'connection_request' | 'connection_accepted' | 'follower' | 'job' | 'internship' | 'event' | 'message' | 'mentorship' | 'verification' | 'system' | 'admin' | 'post_like' | 'post_comment' | 'mention'

export interface Job {
  _id: string
  organization: Organization
  title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  employmentType: EmploymentType
  experienceLevel: ExperienceLevel
  salaryMin?: number
  salaryMax?: number
  currency: string
  isRemote: boolean
  location?: string
  country?: string
  state?: string
  city?: string
  skills: string[]
  benefits: string[]
  applicationDeadline?: string
  applicantsCount: number
  isSaved: boolean
  hasApplied: boolean
  status: 'active' | 'closed' | 'draft'
  createdAt: string
  updatedAt: string
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'volunteer' | 'temporary'
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive'

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'selected'
  | 'rejected'
  | 'withdrawn'
  | 'offer_sent'
  | 'offer_accepted'
  | 'offer_declined'

export type AttendanceStatus = 'pending' | 'present' | 'absent'

export type RegistrationStatus = 'registered' | 'cancelled'

/** Row shape returned by the employer/organizer-facing application lists. */
export interface JobApplicationRow {
  application_id: string
  job_id: string
  applicant_id: string
  user: ApplicantBrief | null
  job: { job_id: string; title: string } | null
  cover_letter: string | null
  resume_url: string | null
  status: ApplicationStatus
  answers: Record<string, unknown> | null
  reviewed_by: string | null
  reviewed_at: string | null
  applied_at: string | null
  created_at: string
}

export interface InternshipApplicationRow extends Omit<JobApplicationRow, 'job_id' | 'job'> {
  internship_id: string
  internship: { internship_id: string; title: string } | null
}

export interface EventRegistrationRow {
  event_id: string
  user_id: string
  user: ApplicantBrief | null
  event: { event_id: string; title: string } | null
  registration_status: RegistrationStatus
  attendance_status: AttendanceStatus
  attendance_marked_at: string | null
  certificate_issued: boolean
  registered_at: string | null
  created_at: string
}

/** Applicant summary embedded in employer/organizer-facing lists. */
export interface ApplicantBrief {
  user_id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  profile_photo: string | null
  headline: string | null
  role: string | null
  specialization: string | null
}

export interface JobApplication {
  _id: string
  job: Job
  applicant: User
  status: ApplicationStatus
  resume?: string
  coverLetter?: string
  appliedAt: string
  updatedAt: string
}

export interface Internship {
  _id: string
  organization: Organization
  title: string
  description: string
  requirements: string[]
  type: 'paid' | 'unpaid' | 'stipend'
  stipend?: number
  currency: string
  duration: string
  startDate: string
  endDate?: string
  isRemote: boolean
  location?: string
  skills: string[]
  applicationDeadline?: string
  applicantsCount: number
  isSaved: boolean
  hasApplied: boolean
  status: 'active' | 'closed' | 'draft'
  createdAt: string
}

export interface Event {
  _id: string
  organizer: User | Organization
  organizerType: 'User' | 'Organization'
  title: string
  description: string
  mode: EventMode
  startDate: string
  endDate: string
  location?: string
  onlineLink?: string
  maxAttendees?: number
  attendeesCount: number
  speakers: Speaker[]
  agenda: AgendaItem[]
  certificateInfo?: CertificateInfo
  banner?: string
  tags: string[]
  isRegistered: boolean
  isSaved: boolean
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  createdAt: string
}

export type EventMode = 'online' | 'in_person' | 'hybrid'

export interface Speaker {
  _id: string
  name: string
  title: string
  organization?: string
  photo?: string
  bio?: string
}

export interface AgendaItem {
  _id: string
  title: string
  description?: string
  speaker?: string
  startTime: string
  endTime: string
}

export interface CertificateInfo {
  enabled: boolean
  template?: string
  requirements?: string
}

export interface Mentor {
  _id: string
  user: User
  specializations: string[]
  bio: string
  yearsOfExperience: number
  menteesCount: number
  maxMentees: number
  availability: AvailabilitySlot[]
  rating: number
  reviewsCount: number
  isAvailable: boolean
}

export interface AvailabilitySlot {
  day: string
  startTime: string
  endTime: string
}

export interface MentorCriterion {
  key: string
  label: string
  met: boolean
}

export interface MentorStatus {
  isMentor: boolean
  eligible: boolean
  criteria: MentorCriterion[]
}

export interface MentorSession {
  _id: string
  session_id?: string
  request_id?: string
  mentor_id?: string
  mentee_id?: string
  scheduledAt: string
  duration: number
  topic: string
  meeting_link?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  rating?: number
  feedback?: string
  createdAt?: string
}

export interface MentorRequest {
  _id: string
  mentor: Mentor
  mentee: User
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface Analytics {
  profileViews: number
  profileViewsTrend: number
  postImpressions: number
  postImpressionsTrend: number
  searchAppearances: number
  searchAppearancesTrend: number
  connectionGrowth: number
  connectionGrowthTrend: number
  topPosts: Post[]
  viewsByDate: { date: string; count: number }[]
  viewerDemographics: { location: string; count: number }[]
}

export interface Achievement {
  _id: string
  title: string
  description: string
  icon: string
  category: string
  earnedAt?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  status: number
}

export interface SearchResult {
  users: User[]
  organizations: Organization[]
  jobs: Job[]
  internships: Internship[]
  events: Event[]
  posts: Post[]
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  connectionRequests: boolean
  messages: boolean
  jobAlerts: boolean
  eventReminders: boolean
  mentorshipUpdates: boolean
  systemUpdates: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private'
  showEmail: boolean
  showPhone: boolean
  allowMessages: 'everyone' | 'connections' | 'nobody'
  showOnlineStatus: boolean
}
