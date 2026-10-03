import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { cn, formatNumber } from '@/utils'

interface StatCardProps {
  icon?: React.ReactNode
  label: string
  value: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  duration?: number
  className?: string
}

function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return count
}

export default function StatCard({ icon, label, value, trend, trendValue, duration = 800, className }: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, duration)

  return (
    <motion.div
      role="region"
      aria-label={`${label}: ${formatNumber(value)}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-[var(--color-text-primary)]">
            {formatNumber(animatedValue)}
          </p>
        </div>
        {icon && (
          <div className="rounded-lg bg-primary-500/10 p-2.5 text-primary-500">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue !== undefined && (
        <div className={cn(
          'mt-3 flex items-center gap-1 text-sm font-medium',
          trend === 'up' ? 'text-accent-500' : trend === 'down' ? 'text-danger-500' : 'text-[var(--color-text-muted)]'
        )}>
          {trend === 'up' && <FiTrendingUp size={16} />}
          {trend === 'down' && <FiTrendingDown size={16} />}
          <span>{trendValue > 0 ? '+' : ''}{formatNumber(trendValue)}%</span>
          <span className="text-[var(--color-text-muted)] font-normal">vs last period</span>
        </div>
      )}
    </motion.div>
  )
}
