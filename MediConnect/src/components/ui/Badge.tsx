import { cn } from '@/utils'
import { FiX } from 'react-icons/fi'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
  className?: string
}

const variants = {
  default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-accent-100 text-accent-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-blue-100 text-blue-700',
}

export default function Badge({ children, variant = 'default', size = 'sm', dot, removable, onRemove, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      variants[variant],
      className
    )}
      aria-label={variant !== 'default' ? `${variant} badge` : undefined}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', variant === 'success' ? 'bg-accent-500' : variant === 'danger' ? 'bg-danger-500' : variant === 'warning' ? 'bg-warning-500' : 'bg-primary-500')} />}
      {children}
      {removable && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70"><FiX size={12} /></button>
      )}
    </span>
  )
}
