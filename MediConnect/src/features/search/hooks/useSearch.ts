import { useQuery } from '@tanstack/react-query'
import { searchService } from '@/api/searchService'

export function useSearch(query: string, category = 'all') {
  return useQuery({
    queryKey: ['search', query, category],
    queryFn: () => searchService.search(query, category).then(r => r.data),
    enabled: query.length >= 2,
    staleTime: 60000,
  })
}

export function useAutocomplete(query: string) {
  return useQuery({
    queryKey: ['autocomplete', query],
    queryFn: () => searchService.getAutocomplete(query).then(r => r.data),
    enabled: query.length >= 2,
    staleTime: 30000,
  })
}

export function useTrendingSearches() {
  return useQuery({
    queryKey: ['trendingSearches'],
    queryFn: () => searchService.getTrending().then(r => r.data),
    staleTime: 300000,
  })
}
