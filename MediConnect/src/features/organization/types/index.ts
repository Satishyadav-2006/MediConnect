export type OrganizationTab = 'about' | 'posts' | 'jobs' | 'internships' | 'events' | 'gallery' | 'employees' | 'analytics'

export interface OrganizationFilter {
  search?: string
  type?: string
  location?: string
  specializations?: string[]
  isVerified?: boolean
  sort?: 'newest' | 'oldest' | 'followers' | 'employees'
}
