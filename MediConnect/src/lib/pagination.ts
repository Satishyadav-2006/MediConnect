export interface PaginationInfo {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function extractList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
  }
  return []
}

export function getNextPageParam(lastPage: unknown): number | undefined {
  if (!lastPage || typeof lastPage !== 'object') return undefined
  const p = lastPage as Record<string, unknown>
  if (p.has_more === false) return undefined
  const hasMore = p.has_more === true
  if (!hasMore && typeof p.total_pages !== 'number') return undefined
  const page = typeof p.page === 'number' ? p.page : 1
  const totalPages = typeof p.total_pages === 'number' ? p.total_pages : 0
  if (!hasMore && totalPages > 0) return page < totalPages ? page + 1 : undefined
  return page + 1
}

export function getPagination(value: unknown): PaginationInfo | undefined {
  if (!value || typeof value !== 'object') return undefined
  const p = value as Record<string, unknown>
  if (!Array.isArray(p.items) && typeof p.total_pages !== 'number') return undefined
  return {
    page: typeof p.page === 'number' ? p.page : 1,
    perPage: typeof p.per_page === 'number' ? p.per_page : 20,
    total: typeof p.total === 'number' ? p.total : 0,
    totalPages: typeof p.total_pages === 'number' ? p.total_pages : 1,
    hasMore: p.has_more === true,
  }
}
