import api from '@/services/api'

export interface ResearchPublication {
  _id: string
  author_id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  conference: string
  doi: string
  publication_date: string
  keywords: string[]
  pdf_url: string
  created_at: string
  updated_at: string
}

export interface CreateResearchPayload {
  title: string
  abstract?: string
  authors?: string[]
  journal?: string
  conference?: string
  doi?: string
  publication_date?: string
  keywords?: string[]
  pdf_url?: string
}

export const researchService = {
  list: (page = 1, limit = 20) =>
    api.get('/research', { params: { page, limit } }),

  get: (id: string) =>
    api.get(`/research/${id}`),

  create: (data: CreateResearchPayload) =>
    api.post('/research', data),

  update: (id: string, data: Partial<CreateResearchPayload>) =>
    api.patch(`/research/${id}`, data),

  delete: (id: string) =>
    api.delete(`/research/${id}`),
}
