import api from '@/services/api'

interface EventFilters { mode?: string; status?: string; search?: string }

export const eventService = {
  getEvents: (page = 1, pageSize = 20, filters?: EventFilters) => api.get('/events', { params: { page, per_page: pageSize, ...filters } }),
  getEvent: (id: string) => api.get(`/events/${id}`),
  createEvent: (data: Record<string, unknown>) => api.post('/events', data),
  updateEvent: (id: string, data: Record<string, unknown>) => api.patch(`/events/${id}`, data),
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  register: (id: string) => api.post(`/events/${id}/register`),
  unregister: (id: string) => api.delete(`/events/${id}/register`),
  getMyEvents: (page = 1, pageSize = 20) => api.get('/events/my-events', { params: { page, per_page: pageSize } }),
  getRegisteredEvents: (page = 1, pageSize = 20) => api.get('/events/registered', { params: { page, per_page: pageSize } }),
  getUpcoming: (page = 1, pageSize = 20) => api.get('/events/upcoming', { params: { page, per_page: pageSize } }),
  getSavedEvents: (page = 1, pageSize = 20) => api.get('/events/saved', { params: { page, per_page: pageSize } }),
  saveEvent: (id: string) => api.post(`/events/${id}/save`),
  unsaveEvent: (id: string) => api.delete(`/events/${id}/save`),
  getMyOrganizedEvents: (page = 1, pageSize = 20) => api.get('/events/my-organized', { params: { page, per_page: pageSize } }),
  getEventRegistrations: (id: string, page = 1, pageSize = 20) =>
    api.get(`/events/${id}/registrations`, { params: { page, per_page: pageSize } }),
  getOrganizedRegistrations: (page = 1, pageSize = 20, attendanceStatus?: string) =>
    api.get('/events/registrations', { params: { page, per_page: pageSize, ...(attendanceStatus ? { attendance_status: attendanceStatus } : {}) } }),
  markAttendance: (id: string, attendanceStatus: string, targetUserId?: string) =>
    api.patch(`/events/${id}/attendance`, undefined, {
      params: { attendance_status: attendanceStatus, ...(targetUserId ? { target_user_id: targetUserId } : {}) },
    }),
}
