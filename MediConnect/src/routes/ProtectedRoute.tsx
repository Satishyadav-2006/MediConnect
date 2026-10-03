import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'
import type { UserRole } from '@/types'
import { getAuthenticatedHomePath } from '@/utils'

interface ProtectedRouteProps {
  children?: ReactNode
  requireVerified?: boolean
  requireRole?: UserRole[]
  requireAdmin?: boolean
  requirePendingVerification?: boolean
  allowedRoles?: UserRole[]
  allowPending?: boolean
}

const ALL_ROLES: UserRole[] = [
  'doctor', 'nurse', 'dentist', 'pharmacist', 'physiotherapist', 'radiologist',
  'lab_technician', 'medical_student', 'nursing_student', 'pharmacy_student',
  'faculty', 'professor', 'researcher',
  'hospital', 'clinic', 'medical_college', 'nursing_college', 'pharmacy_college', 'allied_health_college',
  'hr', 'recruiter', 'placement_officer',
  'moderator', 'admin', 'super_admin', 'owner',
]

const adminRoles: UserRole[] = ['admin', 'super_admin', 'owner', 'moderator']

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 10,
  super_admin: 9,
  admin: 8,
  moderator: 7,
  hospital: 6,
  clinic: 6,
  medical_college: 6,
  nursing_college: 6,
  pharmacy_college: 6,
  allied_health_college: 6,
  hr: 5,
  recruiter: 5,
  placement_officer: 5,
  professor: 4,
  faculty: 4,
  researcher: 4,
  doctor: 3,
  dentist: 3,
  nurse: 3,
  pharmacist: 3,
  physiotherapist: 3,
  radiologist: 3,
  lab_technician: 3,
  medical_student: 2,
  nursing_student: 2,
  pharmacy_student: 2,
}

function hasRequiredRole(userRole: UserRole, allowed: UserRole[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const maxAllowedLevel = Math.max(...allowed.map(r => ROLE_HIERARCHY[r] ?? 0))
  return userLevel >= maxAllowedLevel && allowed.some(r => ROLE_HIERARCHY[r] !== undefined)
}

export default function ProtectedRoute({
  children,
  requireVerified = false,
  requireRole,
  requireAdmin = false,
  requirePendingVerification = false,
  allowedRoles,
  allowPending = false,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, isVerified, isPendingVerification, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const isStaff = !!user && adminRoles.includes(user.role)
  const accountStatus = user?.accountStatus ?? ''
  const isFullAccess = isStaff || isVerified

  if (requirePendingVerification) {
    if (isStaff || accountStatus === 'active') return <Navigate to={getAuthenticatedHomePath(user?.role)} replace />
    if (accountStatus === 'suspended') return <Navigate to="/suspended" replace />
    if (accountStatus === 'rejected') return <Navigate to="/rejected" replace />
    if (!isPendingVerification) return <Navigate to="/login" replace />
    return children ? <>{children}</> : <Outlet />
  }

  if (!isFullAccess && !allowPending) {
    if (accountStatus === 'suspended') return <Navigate to="/suspended" replace />
    if (accountStatus === 'rejected') return <Navigate to="/rejected" replace />
    return <Navigate to="/pending-verification" replace />
  }

  if (requireVerified && !isVerified && !isStaff) return <Navigate to="/pending-verification" replace />

  if (requireAdmin && user && !adminRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />

  if (requireRole && user && !requireRole.includes(user.role)) return <Navigate to="/unauthorized" replace />

  if (allowedRoles && user && !hasRequiredRole(user.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
