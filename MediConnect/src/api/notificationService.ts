import api from '@/services/api'

export const notificationService = {
  getNotifications: (page = 1, pageSize = 20, category?: string) => api.get('/notifications', { params: { page, per_page: pageSize, category } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings: Record<string, boolean>) => api.put('/notifications/settings', settings),
}
