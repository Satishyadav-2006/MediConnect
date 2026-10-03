import { cn } from '@/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-accent-100 text-accent-700',
  verified: 'bg-accent-100 text-accent-700',
  approved: 'bg-accent-100 text-accent-700',
  pending: 'bg-warning-100 text-warning-700',
  pending_email_verification: 'bg-warning-100 text-warning-700',
  pending_professional_verification: 'bg-warning-100 text-warning-700',
  under_review: 'bg-warning-100 text-warning-700',
  open: 'bg-accent-100 text-accent-700',
  suspended: 'bg-danger-100 text-danger-700',
  rejected: 'bg-danger-100 text-danger-700',
  banned: 'bg-danger-100 text-danger-700',
  closed: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  expired: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  deactivated: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  deleted: 'bg-danger-100 text-danger-700',
  draft: 'bg-blue-100 text-blue-700',
  online: 'bg-accent-100 text-accent-700',
  offline: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]',
  away: 'bg-warning-100 text-warning-700',
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', style, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'active' || status === 'online' ? 'bg-accent-500' : status === 'suspended' || status === 'rejected' ? 'bg-danger-500' : 'bg-warning-500')} />
      {formatStatus(status)}
    </span>
  )
}
