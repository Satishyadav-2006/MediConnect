import api from '@/services/api'

export const analyticsService = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getProfileAnalytics: (period?: string) => api.get('/analytics/profile', { params: { period } }),
  getPostAnalytics: (period?: string) => api.get('/analytics/posts', { params: { period } }),
  getConnectionAnalytics: (period?: string) => api.get('/analytics/connections', { params: { period } }),
  getSearchAppearances: (period?: string) => api.get('/analytics/search', { params: { period } }),
}
