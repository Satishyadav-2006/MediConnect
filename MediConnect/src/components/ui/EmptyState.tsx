import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'compact' | 'full-page'
  className?: string
}

export default function EmptyState({ icon, title, description, action, variant = 'default', className }: EmptyStateProps) {
  return (
    <motion.div
      role="status"
      aria-label={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center text-center',
        variant === 'full-page' && 'min-h-[60vh] justify-center py-16',
        variant === 'compact' && 'py-8',
        variant === 'default' && 'py-12',
        className
      )}
    >
      {icon && (
        <div className={cn(
          'mb-4 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]',
          variant === 'full-page' ? 'h-20 w-20 text-3xl' : 'h-14 w-14 text-xl'
        )}>
          {icon}
        </div>
      )}
      <h3 className={cn(
        'font-semibold text-[var(--color-text-primary)]',
        variant === 'full-page' ? 'text-xl' : 'text-base'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'mt-1.5 text-[var(--color-text-secondary)]',
          variant === 'full-page' ? 'max-w-md text-sm' : 'max-w-sm text-sm'
        )}>
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size={variant === 'full-page' ? 'md' : 'sm'} onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
