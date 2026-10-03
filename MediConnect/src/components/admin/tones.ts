export type AdminTone = 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger'

export const TONE_CHIP: Record<AdminTone, string> = {
  primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
  accent: 'bg-accent-400/10 text-accent-500 dark:text-accent-300',
  info: 'bg-accent-50 text-accent-500 dark:bg-accent-500/15 dark:text-accent-300',
  success: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-500',
}

export const TONE_SURFACE: Record<AdminTone, string> = {
  primary: 'bg-primary-500/10',
  accent: 'bg-accent-400/10',
  info: 'bg-accent-400/10',
  success: 'bg-primary-500/10',
  warning: 'bg-warning-500/10',
  danger: 'bg-danger-500/10',
}

const TONE_BORDER: Record<AdminTone, string> = {
  primary: 'border-primary-200 bg-primary-50/60 dark:border-primary-500/25 dark:bg-primary-500/5',
  accent: 'border-accent-200 bg-accent-50/60 dark:border-accent-400/25 dark:bg-accent-400/5',
  info: 'border-accent-200 bg-accent-50/60 dark:border-accent-400/25 dark:bg-accent-400/5',
  success: 'border-primary-200 bg-primary-50/60 dark:border-primary-500/25 dark:bg-primary-500/5',
  warning: 'border-warning-100 bg-warning-50/70 dark:border-warning-500/25 dark:bg-warning-500/5',
  danger: 'border-danger-100 bg-danger-50/70 dark:border-danger-500/25 dark:bg-danger-500/5',
}

export const TONE_TEXT: Record<AdminTone, string> = {
  primary: 'text-primary-600 dark:text-primary-400',
  accent: 'text-accent-500 dark:text-accent-300',
  info: 'text-accent-500 dark:text-accent-300',
  success: 'text-primary-600 dark:text-primary-400',
  warning: 'text-warning-600 dark:text-warning-500',
  danger: 'text-danger-600 dark:text-danger-400',
}

export const TONE_BAR: Record<AdminTone, string> = {
  primary: 'bg-primary-500',
  accent: 'bg-accent-400',
  info: 'bg-accent-400',
  success: 'bg-primary-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

export const toneClasses = {
  chip: TONE_CHIP,
  surface: TONE_SURFACE,
  border: TONE_BORDER,
  text: TONE_TEXT,
  bar: TONE_BAR,
}

export const TONE_CHART_CYCLE: AdminTone[] = ['primary', 'accent', 'info', 'success', 'warning', 'danger']

/** Map an arbitrary status string onto a tone. */
export function statusTone(status?: string | null): AdminTone {
  switch (status) {
    case 'active':
    case 'approved':
    case 'published':
    case 'accepted':
    case 'resolved':
    case 'completed':
    case 'present':
    case 'healthy':
    case 'delivered':
    case 'read':
      return 'success'
    case 'suspended':
    case 'rejected':
    case 'banned':
    case 'deleted':
    case 'deactivated':
    case 'failed':
    case 'unhealthy':
    case 'cancelled':
      return 'danger'
    case 'pending':
    case 'pending_email_verification':
    case 'pending_professional_verification':
    case 'under_review':
    case 'need_more_information':
    case 'draft':
    case 'scheduled':
    case 'open':
    case 'in_progress':
    case 'sent':
      return 'warning'
    case 'hidden':
    case 'archived':
    case 'expired':
    case 'inactive':
      return 'info'
    default:
      return 'primary'
  }
}