import { useInfiniteQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { getNextPageParam } from '@/lib/pagination'
import type { OrganizationFilter } from '@/features/organization/types'

export function useOrganizations(filters?: OrganizationFilter) {
  return useInfiniteQuery({
    queryKey: ['organizations', filters],
    queryFn: ({ pageParam = 1 }) => api.get('/organizations', { params: { page: pageParam, per_page: 20, ...filters } }).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useFeaturedOrganizations() {
  return useInfiniteQuery({
    queryKey: ['featuredOrganizations'],
    queryFn: ({ pageParam = 1 }) => api.get('/organizations', { params: { page: pageParam, per_page: 10, featured: true } }).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useMyOrganizations() {
  return useInfiniteQuery({
    queryKey: ['myOrganizations'],
    queryFn: ({ pageParam = 1 }) => api.get('/organizations/my', { params: { page: pageParam, per_page: 20 } }).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}
