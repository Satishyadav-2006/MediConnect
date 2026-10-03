import { cn } from '@/utils'
import Button from '@/components/ui/Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && <div className="mb-4 text-[var(--color-text-muted)]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-sm">{description}</p>}
      {action && <Button onClick={action.onClick} className="mt-4">{action.label}</Button>}
    </div>
  )
}
