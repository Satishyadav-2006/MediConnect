import api from '@/services/api'

interface InternshipFilters { type?: string; isRemote?: boolean; skills?: string[]; search?: string }

export const internshipService = {
  getInternships: (page = 1, pageSize = 20, filters?: InternshipFilters) => api.get('/internships', { params: { page, per_page: pageSize, ...filters } }),
  getInternship: (id: string) => api.get(`/internships/${id}`),
  createInternship: (data: Record<string, unknown>) => api.post('/internships', data),
  updateInternship: (id: string, data: Record<string, unknown>) => api.patch(`/internships/${id}`, data),
  deleteInternship: (id: string) => api.delete(`/internships/${id}`),
  apply: (id: string, data?: { resume?: string; coverLetter?: string }) => api.post(`/internships/${id}/apply`, data),
  getSavedInternships: (page = 1, pageSize = 20) => api.get('/internships/saved', { params: { page, per_page: pageSize } }),
  getAppliedInternships: (page = 1, pageSize = 20) => api.get('/internships/my-applications', { params: { page, per_page: pageSize } }),
  saveInternship: (id: string) => api.post(`/internships/${id}/save`),
  unsaveInternship: (id: string) => api.delete(`/internships/${id}/save`),
  getRecommended: (page = 1, pageSize = 20) => api.get('/internships/recommended', { params: { page, per_page: pageSize } }),
  getOrganizationInternships: (orgId: string, page = 1, pageSize = 20) => api.get(`/organizations/${orgId}/internships`, { params: { page, per_page: pageSize } }),
  getMyPostedInternships: (page = 1, pageSize = 20) => api.get('/internships/my-posted', { params: { page, per_page: pageSize } }),
  getInternshipApplications: (id: string, page = 1, pageSize = 20) =>
    api.get(`/internships/${id}/applications`, { params: { page, per_page: pageSize } }),
  getPostedApplications: (page = 1, pageSize = 20, status?: string) =>
    api.get('/internships/applications', { params: { page, per_page: pageSize, ...(status ? { status } : {}) } }),
  updateApplicationStatus: (applicationId: string, newStatus: string) =>
    api.patch(`/internships/applications/${applicationId}`, undefined, { params: { new_status: newStatus } }),
}
