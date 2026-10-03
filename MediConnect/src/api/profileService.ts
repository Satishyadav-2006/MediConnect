import api from '@/services/api'

interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  headline?: string
  bio?: string
  country?: string
  state?: string
  city?: string
  specialization?: string
  license_number?: string
  experience_years?: number
  department?: string
}
interface UpdateProfessionalPayload { specialization?: string; licenseNumber?: string; yearsOfExperience?: number; currentOrganization?: string; department?: string }
interface EducationPayload { institution: string; degree: string; field: string; startDate: string; endDate?: string; isCurrent: boolean; description?: string }
interface ExperiencePayload { organization: string; title: string; employmentType: string; startDate: string; endDate?: string; isCurrent: boolean; description?: string; location?: string }

export const profileService = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  getMe: () => api.get('/users/me'),
  updateProfile: (data: UpdateProfilePayload) => api.put('/users/me', data),
  updateProfessional: (data: UpdateProfessionalPayload) => api.put('/users/me', data),
  addEducation: (data: EducationPayload) => api.post('/users/education', data),
  updateEducation: (index: number, data: EducationPayload) => api.put(`/users/education/${index}`, data),
  deleteEducation: (index: string | number) => api.delete(`/users/education/${index}`),
  addExperience: (data: ExperiencePayload) => api.post('/users/experience', data),
  updateExperience: (index: number, data: ExperiencePayload) => api.put(`/users/experience/${index}`, data),
  deleteExperience: (index: string | number) => api.delete(`/users/experience/${index}`),
  addSkill: (data: { skill_name: string; skill_category?: string; experience_level?: string; years?: number }) => api.post('/users/skills', data),
  deleteSkill: (index: number) => api.delete(`/users/skills/${index}`),
  addLanguage: (data: { language: string; read?: boolean; write?: boolean; speak?: boolean; proficiency?: string }) => api.post('/users/languages', data),
  deleteLanguage: (index: number) => api.delete(`/users/languages/${index}`),
  uploadPhoto: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/users/profile-photo', fd) },
  uploadBanner: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/users/cover-photo', fd) },
  getProfileViews: (period?: string) => api.get('/analytics/profile', { params: { period } }),
  getFollowers: (page = 1, pageSize = 20) => api.get('/connections/followers', { params: { page, per_page: pageSize } }),
  getFollowing: (page = 1, pageSize = 20) => api.get('/connections/following', { params: { page, per_page: pageSize } }),
  uploadVerificationDoc: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/document', fd) },
  submitVerification: (data: { registration_number?: string; issuing_authority?: string; document_urls?: string[]; method?: string }) => api.post('/users/verification', data),
  getVerificationStatus: () => api.get('/users/verification-status'),
}
