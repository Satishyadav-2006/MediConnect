import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi'
import { cn } from '@/utils'
import Button from './Button'
import Input from './Input'
import Select from './Select'

interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date'
  placeholder?: string
  options?: { value: string; label: string }[]
}

interface SearchFiltersProps {
  fields: FilterField[]
  onApply: (filters: Record<string, string>) => void
  onClear?: () => void
  initialFilters?: Record<string, string>
  className?: string
}

export default function SearchFilters({ fields, onApply, onClear, initialFilters = {}, className }: SearchFiltersProps) {
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters)
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleApply = useCallback(() => {
    onApply(filters)
    setIsExpanded(false)
  }, [filters, onApply])

  const handleClear = useCallback(() => {
    const empty = Object.fromEntries(fields.map(f => [f.key, '']))
    setFilters(empty)
    onClear?.()
  }, [fields, onClear])

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div role="search" aria-label="Search filters" className={cn('rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]', className)}>
      <button
        onClick={() => setIsExpanded(p => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]"
      >
        <div className="flex items-center gap-2">
          <FiFilter size={16} className="text-[var(--color-text-secondary)]" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </div>
        <FiChevronDown
          size={16}
          className={cn('text-[var(--color-text-muted)] transition-transform', isExpanded && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border-primary)] px-4 pb-4 pt-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map(field => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <Select
                        value={filters[field.key] || ''}
                        onChange={(value: string) => updateFilter(field.key, value)}
                        options={field.options || []}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        value={filters[field.key] || ''}
                        onChange={e => updateFilter(field.key, e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    ) : (
                      <Input
                        value={filters[field.key] || ''}
                        onChange={e => updateFilter(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <FiX size={14} />
                    Clear
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={handleApply}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
