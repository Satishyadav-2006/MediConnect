import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobService } from '@/api/jobService'
import { getNextPageParam } from '@/lib/pagination'

export function useJobs(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['jobs', filters],
    queryFn: ({ pageParam = 1 }) => jobService.getJobs(pageParam, 20, filters as Parameters<typeof jobService.getJobs>[2]).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useSaveJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) => isSaved ? jobService.unsaveJob(id) : jobService.saveJob(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['savedJobs'] }) },
  })
}

export function useApplyJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { resume?: string; coverLetter?: string } }) => jobService.apply(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useSavedJobs() {
  return useInfiniteQuery({
    queryKey: ['savedJobs'],
    queryFn: ({ pageParam = 1 }) => jobService.getSavedJobs(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useAppliedJobs() {
  return useInfiniteQuery({
    queryKey: ['appliedJobs'],
    queryFn: ({ pageParam = 1 }) => jobService.getAppliedJobs(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}
