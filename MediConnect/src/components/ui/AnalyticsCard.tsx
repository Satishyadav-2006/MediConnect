import { cn } from '@/utils'
import { motion } from 'framer-motion'

interface AnalyticsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export default function AnalyticsCard({ title, value, change, changeLabel, icon, className }: AnalyticsCardProps) {
  const isPositive = change !== undefined && change >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5', className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
          {change !== undefined && (
            <p className={cn('mt-1 text-xs font-medium', isPositive ? 'text-accent-600' : 'text-danger-600')}>
              {isPositive ? '+' : ''}{change}%
              {changeLabel && <span className="ml-1 text-[var(--color-text-muted)]">{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
