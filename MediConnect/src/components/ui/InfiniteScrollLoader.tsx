import { useCallback } from 'react'
import { useIntersectionObserver } from '@/hooks'

interface InfiniteScrollLoaderProps {
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
}

export default function InfiniteScrollLoader({ onLoadMore, hasMore, loading }: InfiniteScrollLoaderProps) {
  const callback = useCallback(() => {
    if (!loading && hasMore) onLoadMore()
  }, [loading, hasMore, onLoadMore])

  const sentinelRef = useIntersectionObserver(callback, { rootMargin: '200px' })

  if (!hasMore && !loading) {
    return (
      <div role="status" aria-label="No more items" className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        No more items
      </div>
    )
  }

  return (
    <div ref={sentinelRef} className="flex items-center justify-center py-8" role="status" aria-label="Loading more">
      {loading && (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      )}
    </div>
  )
}
