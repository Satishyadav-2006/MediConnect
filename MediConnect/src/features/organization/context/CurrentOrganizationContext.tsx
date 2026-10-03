import { createContext, useContext, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useCurrentOrganization, type CurrentOrganizationSummary } from '@/features/organization/hooks/useCurrentOrganization'

interface CurrentOrganizationContextValue {
  organization: CurrentOrganizationSummary | undefined
  orgId: string | null
  isLoading: boolean
  isError: boolean
  error: unknown
}

const CurrentOrganizationContext = createContext<CurrentOrganizationContextValue | null>(null)

export function useOptionalCurrentOrganization() {
  return useContext(CurrentOrganizationContext)
}

export function useResolvedOrgId(): string {
  const { id } = useParams<{ id: string }>()
  const ctx = useOptionalCurrentOrganization()
  return id || ctx?.orgId || ''
}

export function CurrentOrganizationProvider({ children }: { children: ReactNode }) {
  const { data: organization, isLoading, isError, error } = useCurrentOrganization()

  return (
    <CurrentOrganizationContext.Provider
      value={{
        organization,
        orgId: organization?.organization_id ?? null,
        isLoading,
        isError,
        error,
      }}
    >
      {children}
    </CurrentOrganizationContext.Provider>
  )
}

export function useCurrentOrganizationContext() {
  const context = useContext(CurrentOrganizationContext)
  if (!context) throw new Error('useCurrentOrganizationContext must be used within CurrentOrganizationProvider')
  return context
}