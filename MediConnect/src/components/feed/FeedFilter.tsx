import { useState } from 'react'
import { FiFilter, FiSearch } from 'react-icons/fi'
import { cn } from '@/utils'

interface FeedFilterProps {
  onFilterChange: (filter: string) => void
  activeFilter?: string
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
  { id: 'recent', label: 'Recent' },
  { id: 'articles', label: 'Articles' },
  { id: 'polls', label: 'Polls' },
]

export default function FeedFilter({ onFilterChange, activeFilter = 'all' }: FeedFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            activeFilter === f.id
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
