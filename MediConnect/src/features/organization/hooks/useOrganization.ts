import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { organizationService } from '@/api/organizationService'
import { getNextPageParam } from '@/lib/pagination'

export function useOrganization(idOrSlug: string) {
  return useQuery({
    queryKey: ['organization', idOrSlug],
    queryFn: () => organizationService.getOrganization(idOrSlug).then(r => r.data),
    enabled: !!idOrSlug,
  })
}

export function useOrganizationPosts(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationPosts', orgId],
    queryFn: ({ pageParam = 1 }) => import('@/api/postService').then(s => s.postService.getOrganizationPosts(orgId, pageParam).then(r => r.data)),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

export function useOrganizationJobs(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationJobs', orgId],
    queryFn: ({ pageParam = 1 }) => import('@/api/jobService').then(s => s.jobService.getOrganizationJobs(orgId, pageParam).then(r => r.data)),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

export function useOrganizationInternships(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationInternships', orgId],
    queryFn: ({ pageParam = 1 }) => import('@/api/internshipService').then(s => s.internshipService.getOrganizationInternships(orgId, pageParam).then(r => r.data)),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

export function useOrganizationEvents(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationEvents', orgId],
    queryFn: ({ pageParam = 1 }) => import('@/api/eventService').then(s => s.eventService.getMyEvents(pageParam, 20).then(r => r.data)),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

export function useOrganizationEmployees(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationEmployees', orgId],
    queryFn: ({ pageParam = 1 }) => organizationService.getEmployees(orgId, pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

export function useOrganizationFollowers(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationFollowers', orgId],
    queryFn: ({ pageParam = 1 }) => organizationService.getFollowers(orgId, pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

export function useOrganizationGallery(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['organizationGallery', orgId],
    queryFn: ({ pageParam = 1 }) => organizationService.getGallery(orgId, pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}
export function useFollowOrganization(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ isFollowing }: { isFollowing: boolean }) =>
      isFollowing ? organizationService.unfollow(orgId) : organizationService.follow(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization', orgId] })
      qc.invalidateQueries({ queryKey: ['organizationFollowers', orgId] })
    },
  })
}

export function useUpdateOrganization(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => organizationService.updateOrganization(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization', orgId] }),
  })
}

export function useUploadGalleryItem(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => organizationService.uploadGalleryItem(orgId, file, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizationGallery', orgId] }),
  })
}

export function useDeleteGalleryItem(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => organizationService.deleteGalleryItem(orgId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizationGallery', orgId] }),
  })
}
