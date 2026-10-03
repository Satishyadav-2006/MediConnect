import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface AchievementProgressProps {
  current: number
  target: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeConfig = {
  sm: { radius: 16, stroke: 3, fontSize: 8, labelSize: 9 },
  md: { radius: 24, stroke: 4, fontSize: 10, labelSize: 10 },
  lg: { radius: 32, stroke: 5, fontSize: 14, labelSize: 11 },
}

export default function AchievementProgress({
  current,
  target,
  size = 'md',
  showLabel = true,
  className,
}: AchievementProgressProps) {
  const config = sizeConfig[size]
  const percentage = Math.min((current / target) * 100, 100)
  const circumference = 2 * Math.PI * config.radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: config.radius * 2 + config.stroke * 2, height: config.radius * 2 + config.stroke * 2 }}>
        <svg
          width={config.radius * 2 + config.stroke * 2}
          height={config.radius * 2 + config.stroke * 2}
          className="rotate-[-90deg]"
        >
          <circle
            cx={config.radius + config.stroke}
            cy={config.radius + config.stroke}
            r={config.radius}
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth={config.stroke}
          />
          <motion.circle
            cx={config.radius + config.stroke}
            cy={config.radius + config.stroke}
            r={config.radius}
            fill="none"
            stroke="var(--color-primary, #6366f1)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold text-[var(--color-text-primary)]"
            style={{ fontSize: config.fontSize }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--color-text-muted)]" style={{ fontSize: config.labelSize }}>
          {current}/{target}
        </span>
      )}
    </div>
  )
}
