import { cn } from '@/utils'
import { FiCheck } from 'react-icons/fi'

interface AchievementBadgeProps {
  icon: string
  earned?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-lg',
  lg: 'h-16 w-16 text-2xl',
}

export default function AchievementBadge({ icon, earned = false, size = 'md', className }: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full',
        sizes[size],
        earned
          ? 'bg-gradient-to-br from-amber-100 to-amber-200 shadow-sm'
          : 'bg-[var(--color-bg-tertiary)] opacity-50 grayscale',
        className
      )}
    >
      <span>{icon}</span>
      {earned && (
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-white">
          <FiCheck size={10} strokeWidth={3} />
        </div>
      )}
    </div>
  )
}
