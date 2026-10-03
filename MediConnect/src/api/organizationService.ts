import api from '@/services/api'

export const organizationService = {
  create: (data: Record<string, unknown>) => api.post('/organizations', data),
  getOrganization: (idOrSlug: string) => api.get(`/organizations/${idOrSlug}`),
  updateOrganization: (id: string, data: Record<string, unknown>) => api.patch(`/organizations/${id}`, data),
  addEmployee: (id: string, data: { user_id: string; role: string; designation?: string; department?: string }) => api.post(`/organizations/${id}/employees`, data),
  removeEmployee: (id: string, employeeUserId: string) => api.delete(`/organizations/${id}/employees/${employeeUserId}`),
  getEmployees: (id: string, page = 1, pageSize = 20) => api.get(`/organizations/${id}/employees`, { params: { page, per_page: pageSize } }),
  getDepartments: (id: string) => api.get(`/organizations/${id}/departments`),
  addDepartment: (id: string, data: { name: string; head?: string }) => api.post(`/organizations/${id}/departments`, data),
  deleteDepartment: (id: string, departmentId: string) => api.delete(`/organizations/${id}/departments/${departmentId}`),
  follow: (id: string) => api.post(`/organizations/${id}/follow`),
  unfollow: (id: string) => api.delete(`/organizations/${id}/follow`),
  getFollowers: (id: string, page = 1, pageSize = 20) => api.get(`/organizations/${id}/followers`, { params: { page, per_page: pageSize } }),
  getGallery: (id: string, page = 1, pageSize = 20) => api.get(`/organizations/${id}/gallery`, { params: { page, per_page: pageSize } }),
  uploadGalleryItem: (id: string, file: File, type: string) => { const fd = new FormData(); fd.append('file', file); fd.append('type', type); return api.post(`/organizations/${id}/gallery`, fd) },
  deleteGalleryItem: (orgId: string, itemId: string) => api.delete(`/organizations/${orgId}/gallery/${itemId}`),
  uploadLogo: (id: string, file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/org-logo', fd, { params: { organization_id: id } }) },
  uploadBanner: (id: string, file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/org-banner', fd, { params: { organization_id: id } }) },
}
