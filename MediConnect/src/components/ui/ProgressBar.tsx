import { cn } from '@/utils'

interface ProgressBarProps {
  value: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const colorClasses = {
  primary: 'bg-primary-500',
  success: 'bg-accent-500',
  warning: 'bg-orange-500',
  danger: 'bg-danger-500',
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export default function ProgressBar({
  value,
  color = 'primary',
  size = 'md',
  showLabel = false,
  animated = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]', sizeClasses[size])}>
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${Math.round(clamped)}%`}
          className={cn(
            'rounded-full transition-all duration-500',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{Math.round(clamped)}%</p>
      )}
    </div>
  )
}
