import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { researchService, type CreateResearchPayload } from '@/api/researchService'
import { getNextPageParam } from '@/lib/pagination'

export function useResearchList(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['research'],
    queryFn: ({ pageParam = 1 }) => researchService.list(pageParam, 20).then(r => r.data),
    enabled,
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useCreateResearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateResearchPayload) => researchService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research'] }),
  })
}

export function useUpdateResearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateResearchPayload> }) => researchService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research'] }),
  })
}

export function useDeleteResearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => researchService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research'] }),
  })
}
