import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/api/notificationService'
import { getNextPageParam } from '@/lib/pagination'

export function useNotifications(category?: string) {
  return useInfiniteQuery({
    queryKey: ['notifications', category],
    queryFn: ({ pageParam = 1 }) => notificationService.getNotifications(pageParam, 20, category).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationService.getUnreadCount().then(r => r.data),
    refetchInterval: 30000,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unreadCount'] }) },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unreadCount'] }) },
  })
}
