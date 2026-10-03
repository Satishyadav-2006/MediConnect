import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'
import { cn } from '@/utils'

interface TimelineItem {
  icon?: ReactNode
  title: string
  description?: string
  date?: string
  status?: 'completed' | 'active' | 'pending'
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const statusConfig = {
  completed: { dot: 'bg-accent-500', line: 'bg-accent-500' },
  active: { dot: 'bg-primary-500 ring-4 ring-primary-500/20', line: 'bg-[var(--color-border-primary)]' },
  pending: { dot: 'bg-[var(--color-border-primary)]', line: 'bg-[var(--color-border-primary)]' },
}

export default function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)} role="list" aria-label="Timeline">
      {items.map((item, i) => {
        const status = item.status || 'pending'
        const config = statusConfig[status]
        const isLast = i === items.length - 1

        return (
          <motion.div
            key={i}
            role="listitem"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex gap-4 pb-8"
          >
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-bg-primary)] text-white z-10',
                  config.dot
                )}
              >
                {status === 'completed' ? (
                  <FiCheck size={14} />
                ) : item.icon || (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>
              {!isLast && (
                <div className={cn('mt-1 w-0.5 flex-1', config.line)} />
              )}
            </div>

            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className={cn(
                  'text-sm font-medium',
                  status === 'active' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                )}>
                  {item.title}
                </h4>
                {item.date && (
                  <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.description}</p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
