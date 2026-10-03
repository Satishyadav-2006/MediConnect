import api from '@/services/api'

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getGrowth: (days = 30) => api.get('/admin/growth', { params: { days } }),

  getUsers: (page = 1, pageSize = 20, filters?: { status?: string; role?: string; search?: string }) =>
    api.get('/admin/users', { params: { page, per_page: pageSize, ...filters } }),
  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/admin/users/${userId}/status`, null, { params: { new_status: status } }),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  getOrganizations: (page = 1, pageSize = 20) =>
    api.get('/admin/organizations', { params: { page, per_page: pageSize } }),
  updateOrganization: (orgId: string, status: string, notes = '') =>
    api.patch(`/admin/organizations/${orgId}`, { status, notes }),
  deleteOrganization: (orgId: string) => api.delete(`/admin/organizations/${orgId}`),

  getVerificationRequests: (page = 1, pageSize = 20) =>
    api.get('/admin/verification', { params: { page, per_page: pageSize } }),
  approveVerification: (userId: string) => api.put(`/admin/verification/${userId}/approve`),
  rejectVerification: (userId: string, remarks: string) =>
    api.put(`/admin/verification/${userId}/reject`, { decision: 'rejected', remarks }),
  requestMoreInformation: (userId: string, remarks: string) =>
    api.put(`/admin/verification/${userId}/request-info`, { decision: 'need_more_information', remarks }),

  getPosts: (params?: { page?: number; per_page?: number; post_status?: string; search?: string }) =>
    api.get('/admin/moderation/posts', { params }),
  deletePost: (postId: string) => api.delete(`/admin/moderation/posts/${postId}`),

  getComments: (params?: { page?: number; per_page?: number; comment_status?: string; search?: string }) =>
    api.get('/admin/moderation/comments', { params }),
  setCommentStatus: (commentId: string, status: string) =>
    api.patch(`/admin/moderation/comments/${commentId}`, { status }),
  deleteComment: (commentId: string) => api.delete(`/admin/moderation/comments/${commentId}`),

  getMessages: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get('/admin/moderation/messages', { params }),
  setMessageStatus: (messageId: string, status: string) =>
    api.patch(`/admin/moderation/messages/${messageId}`, { status }),
  deleteMessage: (messageId: string) => api.delete(`/admin/moderation/messages/${messageId}`),

  getJobs: (params?: { page?: number; per_page?: number; job_status?: string; search?: string }) =>
    api.get('/admin/jobs', { params }),
  updateJobStatus: (jobId: string, status: string) => api.patch(`/admin/jobs/${jobId}`, { status }),
  deleteJob: (jobId: string) => api.delete(`/admin/jobs/${jobId}`),

  getInternships: (params?: { page?: number; per_page?: number; internship_status?: string; search?: string }) =>
    api.get('/admin/internships', { params }),
  updateInternshipStatus: (internshipId: string, status: string) =>
    api.patch(`/admin/internships/${internshipId}`, { status }),
  deleteInternship: (internshipId: string) => api.delete(`/admin/internships/${internshipId}`),

  getEvents: (params?: { page?: number; per_page?: number; event_status?: string; event_mode?: string; search?: string }) =>
    api.get('/admin/events', { params }),
  updateEventStatus: (eventId: string, status: string) => api.patch(`/admin/events/${eventId}`, { status }),
  deleteEvent: (eventId: string) => api.delete(`/admin/events/${eventId}`),

  getReports: (page = 1, pageSize = 20, reportStatus = 'pending') =>
    api.get('/admin/reports', { params: { page, per_page: pageSize, report_status: reportStatus } }),
  resolveReport: (reportId: string, action: string, remarks = '') =>
    api.patch(`/admin/reports/${reportId}`, { action, remarks }),

  getAnalytics: (period = 'monthly') => api.get('/admin/analytics', { params: { period } }),

  getAuditLogs: (page = 1, pageSize = 20) =>
    api.get('/admin/audit-logs', { params: { page, per_page: pageSize } }),

  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings: Record<string, unknown>) => api.patch('/admin/settings', settings),

  getSystemHealth: () => api.get('/admin/system-health'),
}