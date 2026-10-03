import api from '@/services/api'

interface MentorFilters { specialization?: string; availability?: string; search?: string }

export const mentorService = {
  getMentors: (page = 1, pageSize = 20, filters?: MentorFilters) => api.get('/mentorship/available-mentors', { params: { page, per_page: pageSize, ...filters } }),
  getMentor: (id: string) => api.get(`/mentors/${id}`),
  requestMentorship: (mentorId: string, message: string) => api.post('/mentorship/request', { mentor_id: mentorId, message }),
  withdrawRequest: (requestId: string) => api.patch(`/mentorship/request/${requestId}`, { status: 'cancelled' }),
  acceptRequest: (requestId: string) => api.patch(`/mentorship/request/${requestId}`, { status: 'accepted' }),
  rejectRequest: (requestId: string) => api.patch(`/mentorship/request/${requestId}`, { status: 'rejected' }),
  getMyRequests: (page = 1, pageSize = 20) => api.get('/mentorship/requests/received', { params: { page, per_page: pageSize } }),
  getMyMentees: (page = 1, pageSize = 20) => api.get('/mentorship/my-mentorships', { params: { page, per_page: pageSize, role: 'mentor' } }),
  getMyMentor: () => api.get('/mentorship/my-mentorships'),
  getMentorDashboard: () => api.get('/mentorship/dashboard'),
  getMentorStatus: () => api.get('/mentorship/status'),
  applyAsMentor: () => api.post('/mentorship/apply'),
  optOutMentor: () => api.post('/mentorship/opt-out'),
  getMentorshipSessions: (mentorshipId: string) => api.get(`/mentorship/${mentorshipId}/sessions`),
  scheduleSession: (mentorshipId: string, payload: { scheduled_at: string; duration_minutes: number; topic: string }) => api.post(`/mentorship/${mentorshipId}/sessions`, payload),
  updateSession: (mentorshipId: string, sessionId: string, payload: Record<string, unknown>) => api.patch(`/mentorship/${mentorshipId}/sessions/${sessionId}`, payload),
  cancelSession: (mentorshipId: string, sessionId: string) => api.patch(`/mentorship/${mentorshipId}/sessions/${sessionId}`, { status: 'cancelled' }),
  submitSessionFeedback: (sessionId: string, payload: { rating: number; feedback: string }) => api.post(`/mentorship/sessions/${sessionId}/feedback`, payload),
}
