import api from '@/services/api'

interface JobFilters { employmentType?: string; experienceLevel?: string; isRemote?: boolean; skills?: string[]; search?: string }

export const jobService = {
  getJobs: (page = 1, pageSize = 20, filters?: JobFilters) => api.get('/jobs', { params: { page, per_page: pageSize, ...filters } }),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  createJob: (data: Record<string, unknown>) => api.post('/jobs', data),
  updateJob: (id: string, data: Record<string, unknown>) => api.patch(`/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/jobs/${id}`),
  apply: (id: string, data?: { resume?: string; coverLetter?: string }) => api.post(`/jobs/${id}/apply`, data),
  withdrawApplication: (id: string) => api.delete(`/jobs/${id}/apply`),
  getSavedJobs: (page = 1, pageSize = 20) => api.get('/jobs/saved', { params: { page, per_page: pageSize } }),
  getAppliedJobs: (page = 1, pageSize = 20) => api.get('/jobs/applied', { params: { page, per_page: pageSize } }),
  saveJob: (id: string) => api.post(`/jobs/${id}/save`),
  unsaveJob: (id: string) => api.delete(`/jobs/${id}/save`),
  getRecommended: (page = 1, pageSize = 20) => api.get('/jobs/recommended', { params: { page, per_page: pageSize } }),
  getOrganizationJobs: (orgId: string, page = 1, pageSize = 20) => api.get(`/organizations/${orgId}/jobs`, { params: { page, per_page: pageSize } }),
  getMyPostedJobs: (page = 1, pageSize = 20) => api.get('/jobs/my-posted', { params: { page, per_page: pageSize } }),
  getJobApplications: (id: string, page = 1, pageSize = 20) => api.get(`/jobs/${id}/applications`, { params: { page, per_page: pageSize } }),
  getPostedApplications: (page = 1, pageSize = 20, status?: string) =>
    api.get('/jobs/applications', { params: { page, per_page: pageSize, ...(status ? { status } : {}) } }),
  updateApplicationStatus: (applicationId: string, newStatus: string) =>
    api.patch(`/jobs/applications/${applicationId}`, undefined, { params: { new_status: newStatus } }),
}
