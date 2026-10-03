import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/utils'

interface DropdownItem { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export default function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(p => !p)} aria-haspopup="listbox" aria-expanded={isOpen}>{trigger}</div>
      {isOpen && (
        <div role="listbox" className={cn(
          'absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-lg',
          align === 'right' ? 'right-0' : 'left-0',
          className
        )}>
          {items.map((item, i) => (
            <button
              key={i}
              role="option"
              aria-selected={false}
              onClick={() => { if (!item.disabled) { item.onClick(); setIsOpen(false) } }}
              disabled={item.disabled}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors',
                item.danger ? 'text-danger-500 hover:bg-danger-50' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
