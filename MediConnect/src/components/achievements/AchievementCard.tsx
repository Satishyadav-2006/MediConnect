import { motion } from 'framer-motion'
import { FiCalendar, FiLock } from 'react-icons/fi'
import { cn, formatFullDate } from '@/utils'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import AchievementProgress from './AchievementProgress'

interface AchievementCardProps {
  icon: string
  title: string
  description: string
  category: string
  earned?: boolean
  earnedAt?: string
  current?: number
  target?: number
  onClick?: () => void
  className?: string
}

const categoryColors: Record<string, string> = {
  profile: 'primary',
  social: 'info',
  content: 'success',
  mentorship: 'warning',
  professional: 'danger',
  organization: 'default',
}

export default function AchievementCard({
  icon,
  title,
  description,
  category,
  earned = false,
  earnedAt,
  current = 0,
  target = 1,
  onClick,
  className,
}: AchievementCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-xl border p-5 text-center transition-shadow',
        earned
          ? 'border-primary-200 bg-[var(--color-bg-primary)] shadow-md hover:shadow-lg'
          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] opacity-70 hover:opacity-100',
        className
      )}
    >
      {earned && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
      )}

      {earned && (
        <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}

      <div className="relative">
        <div
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl',
            earned
              ? 'bg-gradient-to-br from-primary-50 to-primary-100 shadow-inner'
              : 'bg-[var(--color-bg-tertiary)]'
          )}
        >
          {earned ? icon : <FiLock size={20} className="text-[var(--color-text-muted)]" />}
        </div>

        {earned && (
          <motion.div
            className="absolute inset-0 mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 20px var(--color-primary, #6366f1)' }}
          />
        )}

        <h3 className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">{description}</p>

        <div className="mt-2">
          <Badge variant={(categoryColors[category] as 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'default') || 'default'} size="sm">
            {category}
          </Badge>
        </div>

        {earned && earnedAt ? (
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--color-text-muted)]">
            <FiCalendar size={10} />
            <span>Earned {formatFullDate(earnedAt)}</span>
          </div>
        ) : !earned ? (
          <div className="mt-3 space-y-1">
            <ProgressBar
              value={target > 0 ? (current / target) * 100 : 0}
              size="sm"
              showLabel
            />
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {current}/{target} completed
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
