import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'
import { getAuthenticatedHomePath } from '@/utils'

interface GuestRouteProps {
  children?: ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isLoading, isAuthenticated, isVerified, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated && isVerified) return <Navigate to={getAuthenticatedHomePath(user?.role)} replace />
  if (isAuthenticated && !isVerified) return <Navigate to="/pending-verification" replace />

  return children ? <>{children}</> : <Outlet />
}
