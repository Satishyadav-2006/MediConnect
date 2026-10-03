import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/api/analyticsService'
import { connectionService } from '@/api/connectionService'
import { notificationService } from '@/api/notificationService'
import { jobService } from '@/api/jobService'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsService.getDashboardStats().then(r => r.data),
  })
}

export function useSuggestedConnections() {
  return useQuery({
    queryKey: ['suggestedConnections'],
    queryFn: () => connectionService.getSuggestions(1, 5).then(r => r.data),
  })
}

export function useRecentNotifications() {
  return useQuery({
    queryKey: ['recentNotifications'],
    queryFn: () => notificationService.getNotifications(1, 5).then(r => r.data),
  })
}

export function useRecommendedJobs() {
  return useQuery({
    queryKey: ['recommendedJobs'],
    queryFn: () => jobService.getRecommended(1, 3).then(r => r.data),
  })
}
