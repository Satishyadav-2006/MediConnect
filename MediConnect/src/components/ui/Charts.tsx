import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { cn, formatNumber } from '@/utils'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: DataPoint[]
  height?: number
  className?: string
}

interface LineChartProps {
  data: DataPoint[]
  height?: number
  className?: string
}

interface PieChartProps {
  data: DataPoint[]
  size?: number
  className?: string
}

interface StatsCardProps {
  icon?: React.ReactNode
  label: string
  value: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  className?: string
}

export function BarChart({ data, height = 200, className }: BarChartProps) {
  const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])

  return (
    <div role="img" aria-label={`Bar chart showing ${data.length} data points`} className={cn('w-full', className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {formatNumber(item.value)}
            </span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="w-full rounded-t-md bg-primary-500"
              style={{ backgroundColor: item.color || undefined }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex flex-1 text-center">
            <span className="w-full truncate text-xs text-[var(--color-text-muted)]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ data, height = 200, className }: LineChartProps) {
  const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])
  const min = useMemo(() => Math.min(...data.map(d => d.value), 0), [data])
  const range = max - min || 1

  const points = useMemo(() => {
    const padding = 20
    const w = 100
    const h = 100
    return data.map((item, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (w - 2 * padding)
      const y = h - padding - ((item.value - min) / range) * (h - 2 * padding)
      return { x, y }
    })
  }, [data, min, range])

  const linePath = useMemo(() => {
    if (points.length < 2) return ''
    return points.reduce((path, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const cpx1 = prev.x + (p.x - prev.x) / 3
      const cpx2 = prev.x + (2 * (p.x - prev.x)) / 3
      return `${path} C ${cpx1} ${prev.y} ${cpx2} ${p.y} ${p.x} ${p.y}`
    }, '')
  }, [points])

  const areaPath = useMemo(() => {
    if (!linePath) return ''
    const padding = 20
    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    return `${linePath} L ${lastPoint.x} ${100 - padding} L ${firstPoint.x} ${100 - padding} Z`
  }, [linePath, points])

  return (
    <div role="img" aria-label={`Line chart showing ${data.length} data points`} className={cn('w-full', className)}>
      <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#lineGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1"
            fill="var(--color-primary, #6366f1)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((item, i) => (
          <span key={i} className="text-xs text-[var(--color-text-muted)]">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function PieChart({ data, size = 160, className }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])
  const radius = 40
  const cx = 50
  const cy = 50

  const defaultColors = [
    'var(--color-primary, #6366f1)',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ]

  const slices = useMemo(() => {
    let startAngle = -90
    return data.map((item, i) => {
      const percentage = item.value / total
      const angle = percentage * 360
      const endAngle = startAngle + angle
      const largeArc = angle > 180 ? 1 : 0

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1 = cx + radius * Math.cos(startRad)
      const y1 = cy + radius * Math.sin(startRad)
      const x2 = cx + radius * Math.cos(endRad)
      const y2 = cy + radius * Math.sin(endRad)

      const path = percentage >= 0.999
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

      startAngle = endAngle
      return { path, color: item.color || defaultColors[i % defaultColors.length], label: item.label, percentage }
    })
  }, [data, total])

  return (
    <div role="img" aria-label={`Pie chart showing ${data.length} categories`} className={cn('flex flex-col items-center gap-4', className)}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {slices.map((slice, i) => (
          <motion.path
            key={i}
            d={slice.path}
            fill={slice.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{`${slice.label}: ${slice.percentage > 0.01 ? Math.round(slice.percentage * 100) : '<1'}%`}</title>
          </motion.path>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-3">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-xs text-[var(--color-text-secondary)]">{slice.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatsCard({ icon, label, value, trend, trendValue, className }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatNumber(value)}</p>
        </div>
        {icon && (
          <div className="rounded-lg bg-primary-500/10 p-2.5 text-primary-500">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue !== undefined && (
        <div className={cn('mt-3 flex items-center gap-1 text-sm font-medium',
          trend === 'up' ? 'text-accent-500' : trend === 'down' ? 'text-danger-500' : 'text-[var(--color-text-muted)]'
        )}>
          {trend === 'up' ? <FiTrendingUp size={16} /> : trend === 'down' ? <FiTrendingDown size={16} /> : null}
          <span>{trendValue > 0 ? '+' : ''}{trendValue}%</span>
        </div>
      )}
    </motion.div>
  )
}
