import api from '@/services/api'

export const settingsService = {
  getNotificationSettings: () => api.get('/settings/notifications'),
  updateNotificationSettings: (settings: Record<string, boolean>) => api.put('/settings/notifications', settings),
  getPrivacySettings: () => api.get('/settings/privacy'),
  updatePrivacySettings: (settings: Record<string, unknown>) => api.put('/settings/privacy', settings),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/settings/password', data),
  updateEmail: (data: { newEmail: string; password: string }) => api.put('/settings/email', data),
  deactivateAccount: (password: string) => api.post('/settings/deactivate', { password }),
  deleteAccount: () => api.delete('/settings/account'),
  blockUser: (userId: string) => api.post(`/settings/block/${userId}`),
  unblockUser: (userId: string) => api.delete(`/settings/block/${userId}`),
  getBlockedUsers: (page = 1, pageSize = 20) => api.get('/settings/blocked', { params: { page, per_page: pageSize } }),
  getSessions: () => api.get('/settings/sessions'),
}
