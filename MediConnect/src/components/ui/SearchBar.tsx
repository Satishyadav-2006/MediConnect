import { useRef, useEffect, useId } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { cn } from '@/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  placeholder?: string
  onSearch?: () => void
  loading?: boolean
  autoFocus?: boolean
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  onFocus,
  placeholder = 'Search MediConnect',
  onSearch,
  loading = false,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const searchId = useId()

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch?.()
  }

  return (
    <div className={cn('relative w-full', className)} role="search">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} aria-hidden="true" />
      <input
        ref={inputRef}
        id={searchId}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        role="searchbox"
        aria-label={placeholder}
        aria-autocomplete="list"
        className="w-full rounded-lg bg-[var(--color-bg-tertiary)] py-2 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Searching" role="status">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      )}
      {!loading && value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          aria-label="Clear search"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  )
}
