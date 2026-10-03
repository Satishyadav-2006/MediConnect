import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/api/eventService'
import { getNextPageParam } from '@/lib/pagination'

export function useEvents(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['events', filters],
    queryFn: ({ pageParam = 1 }) => eventService.getEvents(pageParam, 20, filters as Parameters<typeof eventService.getEvents>[2]).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEvent(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useRegisterEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, unregister }: { id: string; unregister?: boolean }) => unregister ? eventService.unregister(id) : eventService.register(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['event'] }) },
  })
}

export function useSaveEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) => isSaved ? eventService.unsaveEvent(id) : eventService.saveEvent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['event'] }); qc.invalidateQueries({ queryKey: ['savedEvents'] }) },
  })
}

export function useMyEvents() {
  return useInfiniteQuery({
    queryKey: ['myEvents'],
    queryFn: ({ pageParam = 1 }) => eventService.getMyEvents(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useRegisteredEvents() {
  return useQuery({
    queryKey: ['registeredEvents'],
    queryFn: () => eventService.getRegisteredEvents(1, 100).then(r => r.data),
  })
}
