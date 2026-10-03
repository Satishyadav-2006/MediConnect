import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'
import { cn } from '@/utils'

interface Step {
  label: string
  status?: 'completed' | 'active' | 'pending'
}

interface StepProgressProps {
  steps: Step[]
  className?: string
}

const statusConfig = {
  completed: { bg: 'bg-accent-500', text: 'text-white', label: 'text-[var(--color-text-secondary)]' },
  active: { bg: 'bg-primary-500 ring-4 ring-primary-500/20', text: 'text-white', label: 'text-[var(--color-text-primary)] font-medium' },
  pending: { bg: 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]', text: 'text-[var(--color-text-muted)]', label: 'text-[var(--color-text-muted)]' },
}

export default function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop horizontal layout */}
      <div role="list" className="hidden sm:flex sm:items-center sm:justify-between">
        {steps.map((step, i) => {
          const status = step.status || 'pending'
          const config = statusConfig[status]
          const isLast = i === steps.length - 1

          return (
            <div key={i} role="listitem" aria-current={status === 'active' ? 'step' : undefined} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                    config.bg, config.text
                  )}
                >
                  {status === 'completed' ? <FiCheck size={14} /> : i + 1}
                </motion.div>
                <span className={cn('mt-2 text-xs text-center max-w-[80px]', config.label)}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-2 flex-1">
                  <div className={cn(
                    'h-0.5 w-full rounded-full',
                    status === 'completed' ? 'bg-accent-500' : 'bg-[var(--color-border-primary)]'
                  )} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile vertical layout */}
      <div role="list" className="flex flex-col sm:hidden">
        {steps.map((step, i) => {
          const status = step.status || 'pending'
          const config = statusConfig[status]
          const isLast = i === steps.length - 1

          return (
            <div key={i} role="listitem" aria-current={status === 'active' ? 'step' : undefined} className="flex gap-3">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    config.bg, config.text
                  )}
                >
                  {status === 'completed' ? <FiCheck size={14} /> : i + 1}
                </motion.div>
                {!isLast && (
                  <div className={cn(
                    'my-1 w-0.5 flex-1',
                    status === 'completed' ? 'bg-accent-500' : 'bg-[var(--color-border-primary)]'
                  )} />
                )}
              </div>
              <div className="pb-6">
                <span className={cn('text-sm', config.label)}>{step.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
