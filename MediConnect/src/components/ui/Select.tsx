import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils'
import { FiChevronDown } from 'react-icons/fi'

interface SelectOption { value: string; label: string }

interface SelectProps {
  label?: string
  error?: string
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function Select({ label, error, options, value, onChange, placeholder = 'Select...', disabled, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative w-full" ref={ref}>
      {label && <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(p => !p)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'w-full flex items-center justify-between rounded-lg border bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-left transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          error ? 'border-danger-500' : 'border-[var(--color-border-primary)]',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <span className={selected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}>{selected?.label || placeholder}</span>
        <FiChevronDown className={cn('text-[var(--color-text-muted)] transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div role="listbox" className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-lg">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => { onChange(option.value); setIsOpen(false) }}
              className={cn(
                'w-full px-3 py-2 text-sm text-left hover:bg-[var(--color-bg-hover)] transition-colors',
                option.value === value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-[var(--color-text-primary)]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  )
}
