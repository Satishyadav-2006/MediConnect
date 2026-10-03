import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ROLES } from '@/constants'
import { ROUTES } from '@/constants/routes'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function parseDate(date?: string | null): Date | null {
  if (!date) return null
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date?: string | null): string {
  const d = parseDate(date)
  if (!d) return ''
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatFullDate(date?: string | null): string {
  const d = parseDate(date)
  if (!d) return ''
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date?: string | null): string {
  const d = parseDate(date)
  if (!d) return ''
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatNumber(num?: number | null): string {
  const n = Number(num ?? 0) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function getInitials(name?: string): string {
  if (!name || name.trim() === '') {
    return '?'
  }

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const ORG_ROLES = ROLES.ORGANIZATION as readonly string[]
const ADMIN_ROLES = ROLES.ADMIN as readonly string[]

export function isOrgRole(role?: string): boolean {
  return !!role && ORG_ROLES.includes(role)
}

export function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role)
}

export function getAuthenticatedHomePath(role?: string): string {
  if (isAdminRole(role)) return ROUTES.ADMIN
  return isOrgRole(role) ? ROUTES.ORG_DASHBOARD : ROUTES.DASHBOARD
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function getRelativeTime(date?: string | null): string {
  const then = parseDate(date)
  if (!then) return ''
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  // Guard against future timestamps caused by clock skew (server ahead of client)
  if (diffMs < 0) return 'just now'
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatFullDate(date)
}

export function isUserOnline(user?: { accountStatus?: string; updatedAt?: string } | null, withinMs: number = 5 * 60 * 1000): boolean {
  if (!user) return false
  if (user.accountStatus !== 'active') return false
  const lastActive = parseDate(user.updatedAt)
  if (!lastActive) return false
  return Date.now() - lastActive.getTime() <= withinMs
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-600 bg-green-50',
    pending: 'text-yellow-600 bg-yellow-50',
    rejected: 'text-red-600 bg-red-50',
    suspended: 'text-red-600 bg-red-50',
    closed: 'text-gray-600 bg-gray-50',
    accepted: 'text-green-600 bg-green-50',
    cancelled: 'text-gray-600 bg-gray-50',
    submitted: 'text-blue-600 bg-blue-50',
    reviewed: 'text-purple-600 bg-purple-50',
    applied: 'text-blue-600 bg-blue-50',
    under_review: 'text-purple-600 bg-purple-50',
    interview_scheduled: 'text-blue-600 bg-blue-50',
    interview_completed: 'text-blue-600 bg-blue-50',
    selected: 'text-green-600 bg-green-50',
    offer_sent: 'text-green-600 bg-green-50',
    offer_accepted: 'text-green-600 bg-green-50',
    offer_declined: 'text-gray-600 bg-gray-50',
    present: 'text-green-600 bg-green-50',
    absent: 'text-red-600 bg-red-50',
    registered: 'text-blue-600 bg-blue-50',
    shortlisted: 'text-indigo-600 bg-indigo-50',
    interview: 'text-blue-600 bg-blue-50',
    offered: 'text-green-600 bg-green-50',
    withdrawn: 'text-gray-600 bg-gray-50',
    live: 'text-red-600 bg-red-50',
    completed: 'text-green-600 bg-green-50',
    upcoming: 'text-blue-600 bg-blue-50',
    draft: 'text-gray-600 bg-gray-50',
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}
