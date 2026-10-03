import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionService } from '@/api/connectionService'
import { getNextPageParam } from '@/lib/pagination'
import { showSuccess, showError } from '@/components/ui/Toast'

export function useConnections() {
  return useInfiniteQuery({
    queryKey: ['connections'],
    queryFn: ({ pageParam = 1 }) => connectionService.getMyConnections(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function usePendingRequests() {
  return useInfiniteQuery({
    queryKey: ['pendingRequests'],
    queryFn: ({ pageParam = 1 }) => connectionService.getPendingRequests(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useSuggestions() {
  return useInfiniteQuery({
    queryKey: ['suggestions'],
    queryFn: ({ pageParam = 1 }) => connectionService.getSuggestions(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useConnectionActions() {
  const qc = useQueryClient()
  const sendRequest = useMutation({
    mutationFn: (userId: string) => connectionService.sendRequest(userId),
    onSuccess: () => { showSuccess('Connection request sent'); qc.invalidateQueries({ queryKey: ['suggestions'] }) },
    onError: () => showError('Failed to send connection request'),
  })
  const acceptRequest = useMutation({
    mutationFn: (id: string) => connectionService.acceptRequest(id),
    onSuccess: () => { showSuccess('Connection accepted'); qc.invalidateQueries({ queryKey: ['pendingRequests'] }); qc.invalidateQueries({ queryKey: ['connections'] }) },
    onError: () => showError('Failed to accept connection'),
  })
  const rejectRequest = useMutation({
    mutationFn: (id: string) => connectionService.rejectRequest(id),
    onSuccess: () => { showSuccess('Connection request declined'); qc.invalidateQueries({ queryKey: ['pendingRequests'] }) },
    onError: () => showError('Failed to decline request'),
  })
  const cancelRequest = useMutation({
    mutationFn: (id: string) => connectionService.cancelRequest(id),
    onSuccess: () => { showSuccess('Connection request cancelled'); qc.invalidateQueries({ queryKey: ['connections'] }); qc.invalidateQueries({ queryKey: ['suggestions'] }) },
    onError: () => showError('Failed to cancel request'),
  })
  const removeConnection = useMutation({
    mutationFn: (id: string) => connectionService.removeConnection(id),
    onSuccess: () => { showSuccess('Connection removed'); qc.invalidateQueries({ queryKey: ['connections'] }) },
    onError: () => showError('Failed to remove connection'),
  })
  return { sendRequest, acceptRequest, rejectRequest, cancelRequest, removeConnection }
}
