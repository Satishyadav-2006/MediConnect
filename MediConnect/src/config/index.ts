export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function ensureWsApiPrefix(url: string): string {
  const base = url.replace(/\/$/, '')
  const prefix = '/api/v1'
  return base.endsWith(prefix) ? base : base + prefix
}

export const WS_BASE_URL = ensureWsApiPrefix(import.meta.env.VITE_WS_URL || API_BASE_URL.replace('http', 'ws')) + '/ws'

export const ROLES = {
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  PHARMACY: 'pharmacy',
  LABORATORY: 'laboratory',
  INSURANCE: 'insurance',
  MEDICAL_STUDENT: 'medical_student',
  RESEARCHER: 'researcher',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
} as const

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 100,
  super_admin: 90,
  admin: 80,
  moderator: 70,
  organization_admin: 60,
  department_admin: 50,
  doctor: 40,
  nurse: 40,
  professor: 40,
  researcher: 35,
  pharmacist: 30,
  hospital: 25,
  clinic: 25,
  laboratory: 20,
  insurance: 20,
  medical_student: 15,
  intern: 10,
  technician: 10,
  therapist: 10,
  midwife: 10,
  radiologist: 10,
  dentist: 10,
  optometrist: 10,
  paramedic: 10,
  other: 5,
}

export const POST_TYPES = ['text', 'image', 'video', 'research', 'clinical_case', 'poll', 'job', 'event', 'announcement'] as const

export const VISIBILITY_OPTIONS = ['public', 'connections', 'private'] as const

export const REACTION_TYPES = ['like', 'love', 'insightful', 'celebrate', 'support'] as const

export const MAX_FILE_SIZE_MB = 10
export const MAX_IMAGE_SIZE_MB = 5
export const MAX_VIDEO_SIZE_MB = 50

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

export const DEBOUNCE_MS = 300

export const ANIMATION_VARIANTS = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slideUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } },
  scaleIn: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
} as const
