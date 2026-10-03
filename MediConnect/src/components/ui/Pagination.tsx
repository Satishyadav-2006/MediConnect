import { cn } from '@/utils'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  return (
    <nav role="navigation" aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-disabled={page <= 1} aria-label="Previous page" className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed">
        <FiChevronLeft size={16} />
      </button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`dots-${i}`} className="px-2 text-[var(--color-text-muted)]">...</span>
      ) : (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn('h-8 min-w-[32px] rounded-lg px-2 text-sm font-medium transition-colors',
            p === page ? 'bg-primary-500 text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-disabled={page >= totalPages} aria-label="Next page" className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed">
        <FiChevronRight size={16} />
      </button>
    </nav>
  )
}
