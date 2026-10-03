import api from '@/services/api'

export const searchService = {
  search: (query: string, category = 'all', page = 1, pageSize = 20, filters?: Record<string, string>) => api.get('/search', { params: { query, type: category, category, page, per_page: pageSize, ...filters } }),
  getAutocomplete: (query: string) => api.get('/search/autocomplete', { params: { query } }),
  getTrending: () => api.get('/search/trending'),
  getRecentSearches: () => api.get('/search/recent'),
  clearRecentSearches: () => api.delete('/search/recent'),
  searchPeople: (query: string, page = 1, pageSize = 20) => api.get('/search/people', { params: { query, page, per_page: pageSize } }),
  searchOrganizations: (query: string, page = 1, pageSize = 20) => api.get('/search/organizations', { params: { query, page, per_page: pageSize } }),
  searchJobs: (query: string, page = 1, pageSize = 20) => api.get('/search/jobs', { params: { query, page, per_page: pageSize } }),
  searchInternships: (query: string, page = 1, pageSize = 20) => api.get('/search/internships', { params: { query, page, per_page: pageSize } }),
  searchEvents: (query: string, page = 1, pageSize = 20) => api.get('/search/events', { params: { query, page, per_page: pageSize } }),
  searchPosts: (query: string, page = 1, pageSize = 20) => api.get('/search/posts', { params: { query, page, per_page: pageSize } }),
}
