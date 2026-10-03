import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { isOrgRole } from '@/utils'

export interface CurrentOrganizationSummary {
  organization_id: string
  name: string
  type: string
  logo?: string
  banner?: string
  city?: string
  state?: string
  country?: string
  employee_count: number
  followers_count: number
  verification_status: string
}

function normalize(raw: Record<string, unknown>): CurrentOrganizationSummary {
  return {
    organization_id: String(raw.organization_id || raw._id || ''),
    name: String(raw.organization_name || raw.name || ''),
    type: String(raw.organization_type || raw.type || 'other'),
    logo: (raw.logo as string) || '',
    banner: (raw.banner as string) || '',
    city: (raw.city as string) || '',
    state: (raw.state as string) || '',
    country: (raw.country as string) || '',
    employee_count: Number(raw.employee_count ?? raw.employeesCount ?? 0),
    followers_count: Number(raw.followers_count ?? raw.followersCount ?? 0),
    verification_status: String(raw.verification_status || 'pending'),
  }
}

export function useCurrentOrganization() {
  const { user } = useAuth()
  const enabled = !!user && isOrgRole(user.role)

  return useQuery({
    queryKey: ['currentOrganization', user?._id ?? ''],
    queryFn: async () => {
      const res = await api.get('/organizations', { params: { page: 1, per_page: 100 } })
      const data = res.data as unknown as { items?: Array<Record<string, unknown>> }
      const items = Array.isArray(data?.items) ? data.items : []
      const rawMatch = items.find(
        (o) => String(o.owner_id) === user?._id || String(o.owner_id) === (user as unknown as Record<string, unknown>)?.user_id
      )
      if (!rawMatch) {
        throw new Error('No organization found for this account')
      }
      return normalize(rawMatch)
    },
    enabled,
    retry: false,
  })
}