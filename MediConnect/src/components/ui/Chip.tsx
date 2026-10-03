import { cn } from '@/utils'
import { FiX } from 'react-icons/fi'

interface ChipProps {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export default function Chip({ children, selected, onClick, removable, onRemove, className }: ChipProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
      selected
        ? 'bg-primary-500 text-white'
        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
      className
    )} onClick={onClick} role={onClick ? 'button' : undefined} aria-pressed={selected !== undefined ? selected : undefined}>
      {children}
      {removable && (
        <button onClick={e => { e.stopPropagation(); onRemove?.() }} className="ml-0.5 hover:opacity-70"><FiX size={12} /></button>
      )}
    </span>
  )
}
