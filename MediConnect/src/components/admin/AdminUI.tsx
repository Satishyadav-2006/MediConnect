import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { TONE_CHIP, TONE_SURFACE, TONE_TEXT, TONE_BAR, TONE_CHART_CYCLE, type AdminTone } from './tones'

/* Page shell                                                          */
/* ------------------------------------------------------------------ */

interface AdminPageProps {
  children: ReactNode
  className?: string
}

/** Standard animated page shell used by every admin screen. */
export function AdminPage({ children, className }: AdminPageProps) {
  return (
    <motion.div {...pageTransition} className={cn('space-y-6', className)}>
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero header — mirrors the organization dashboard banner             */
/* ------------------------------------------------------------------ */

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children?: ReactNode
}

export function AdminPageHeader({ title, subtitle, icon, children }: AdminPageHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 shadow-sm">
      <div className="flex flex-col gap-4 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}

/** Translucent link/button that sits on the gradient header. */
export function AdminHeaderAction({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25">
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Panel / section card                                                */
/* ------------------------------------------------------------------ */

interface AdminPanelProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  padded?: boolean
}

export function AdminPanel({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: AdminPanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] transition-shadow hover:shadow-md',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <span className="shrink-0 text-primary-500">{icon}</span>}
            <div className="min-w-0">
              {title && (
                <h2 className="truncate text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
              )}
              {description && (
                <p className="truncate text-xs text-[var(--color-text-muted)]">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-4', bodyClassName)}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

interface AdminStatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  tone?: AdminTone
  hint?: ReactNode
  onClick?: () => void
}

export function AdminStatCard({ label, value, icon, tone = 'primary', hint, onClick }: AdminStatCardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'group flex w-full items-start justify-between gap-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5 text-left transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-1.5 truncate text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
        {hint && <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
      {icon && (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
            TONE_SURFACE[tone],
            TONE_TEXT[tone],
          )}
        >
          {icon}
        </span>
      )}
    </Tag>
  )
}

/** Staggered grid wrapper so stat rows animate in like the rest of the app. */
export function AdminStatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 | 5 }) {
  const cols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  }[columns]
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={cn('grid gap-4', cols)}>
      {children}
    </motion.div>
  )
}

export function AdminStatItem({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={staggerItem} className="flex">
      <div className="flex-1">{children}</div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Toolbar + quick actions                                             */
/* ------------------------------------------------------------------ */

export function AdminToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface AdminQuickActionProps {
  label: string
  to?: string
  onClick?: () => void
  icon?: ReactNode
  badge?: number
}

export function AdminQuickAction({ label, to, onClick, icon, badge }: AdminQuickActionProps) {
  const inner = (
    <>
      <span className="flex items-center gap-2">
        {icon && <span className="text-primary-500">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-warning-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </>
  )

  const cls =
    'flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-primary-500/40 hover:text-primary-500'

  if (to) {
    return (
      <a href={to} className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export const adminTh =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]'
export const adminTd = 'px-4 py-3 text-sm text-[var(--color-text-primary)]'
export const adminTr =
  'border-b border-[var(--color-border-primary)] transition-colors last:border-0 hover:bg-[var(--color-bg-hover)]'

interface AdminTableShellProps {
  children: ReactNode
  className?: string
}

export function AdminTableShell({ children, className }: AdminTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]">
      <tr>{children}</tr>
    </thead>
  )
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function AdminTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn(adminTr, className)}>{children}</tr>
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function AdminLoadingCards({ count = 4, className = 'h-28' }: { count?: number; className?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`rounded-xl ${className}`} />
      ))}
    </div>
  )
}

export function AdminLoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  )
}

interface AdminEmptyProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: { label: string; onClick: () => void }
}

export function AdminEmpty({ title, description, icon, action }: AdminEmptyProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
      <EmptyState variant="compact" icon={icon} title={title} description={description} action={action} />
    </div>
  )
}

export function AdminErrorState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-danger-100 bg-danger-50/70 p-8 text-center dark:border-danger-500/25 dark:bg-danger-500/5">
      <p className="text-sm font-semibold text-danger-600 dark:text-danger-400">{title}</p>
      {description && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{description}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

export function AdminToneChip({ tone, children }: { tone: AdminTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', TONE_CHIP[tone])}>
      {children}
    </span>
  )
}

export function AdminKeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

interface AdminProgressProps {
  value: number
  tone?: AdminTone
  className?: string
}

export function AdminProgress({ value, tone = 'primary', className }: AdminProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', TONE_BAR[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Horizontal distribution bar used by the analytics breakdowns. */
export function AdminDistributionBar({
  items,
  toneFor,
}: {
  items: { label: string; value: number }[]
  toneFor?: (label: string) => AdminTone
}) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate capitalize text-[var(--color-text-secondary)]">
              {item.label.replace(/_/g, ' ')}
            </span>
            <span className="shrink-0 font-semibold text-[var(--color-text-primary)]">{item.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
            <div
              className={cn('h-full rounded-full transition-all duration-500', TONE_BAR[toneFor?.(item.label) ?? TONE_CHART_CYCLE[i % TONE_CHART_CYCLE.length]])}
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Lightweight column/bar chart built from real series data. */
export function AdminBarChart({
  data,
  height = 'h-48',
  emptyLabel = 'No data available',
}: {
  data: { label: string; value: number }[]
  height?: string
  emptyLabel?: string
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">{emptyLabel}</p>
  }
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div className={cn('flex items-end gap-2', height)}>
      {data.map(d => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
            {d.value}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-primary-400 transition-all group-hover:from-primary-600 group-hover:to-primary-500"
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
            title={`${d.value} on ${d.label}`}
          />
          <span className="w-full truncate text-center text-[10px] text-[var(--color-text-muted)]">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Segmented period picker replacing ad-hoc button rows. */
export function AdminSegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-1">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            opt.value === value
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}