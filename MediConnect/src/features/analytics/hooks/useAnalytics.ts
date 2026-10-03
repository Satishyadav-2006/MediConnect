import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/api/analyticsService'
import api from '@/services/api'

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => analyticsService.getDashboardStats().then(r => r.data),
  })
}

export function useProfileAnalytics(userId?: string) {
  return useQuery({
    queryKey: ['profileAnalytics', userId],
    queryFn: () => analyticsService.getProfileAnalytics().then(r => r.data),
    enabled: !!userId,
  })
}

export function usePostAnalytics(postId?: string) {
  return useQuery({
    queryKey: ['postAnalytics', postId],
    queryFn: () => analyticsService.getPostAnalytics().then(r => r.data),
    enabled: !!postId,
  })
}

export function useConnectionAnalytics() {
  return useQuery({
    queryKey: ['connectionAnalytics'],
    queryFn: () => analyticsService.getConnectionAnalytics().then(r => r.data),
  })
}

export function useOrganizationAnalytics(orgId?: string) {
  return useQuery({
    queryKey: ['organizationAnalytics', orgId],
    queryFn: () => api.get(`/analytics/organization/${orgId}`).then(r => r.data),
    enabled: !!orgId,
  })
}

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ['platformAnalytics'],
    queryFn: () => api.get('/analytics/platform').then(r => r.data),
  })
}

export function useRecruiterAnalytics() {
  return useQuery({
    queryKey: ['recruiterAnalytics'],
    queryFn: () => api.get('/analytics/recruiter').then(r => r.data),
  })
}

export function useMentorAnalytics() {
  return useQuery({
    queryKey: ['mentorAnalytics'],
    queryFn: () => api.get('/analytics/mentor').then(r => r.data),
  })
}
