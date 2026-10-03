import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types'
import { authService } from '@/api/authService'
import { tokenStorage } from '@/services/tokenStorage'

interface RegisterData {
  role: string
  first_name: string
  last_name: string
  email: string
  username: string
  country: string
  state: string
  city: string
  password: string
  confirm_password: string
  phone?: string
  professional_category?: string
  organization_name?: string
  registration_number?: string
  license_number?: string
  college?: string
  graduation_year?: number
  experience_years?: number
  specialization?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isVerified: boolean
  isPendingVerification: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  setAuthFromVerify: (data: { access_token: string; user: Record<string, unknown> }) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function normalizeCurrentOrganization(value: unknown): User['currentOrganization'] {
  if (!value) return null
  if (typeof value === 'string') {
    return { organization_id: '', name: value }
  }
  if (typeof value !== 'object') return null
  const org = value as Record<string, unknown>
  const organizationId = (org.organization_id ?? org.id ?? '') as string
  const name = (org.name ?? org.organization_name ?? '') as string
  if (!organizationId && !name) return null
  return {
    organization_id: organizationId,
    name,
    logo: org.logo as string | undefined,
    type: org.type as string | undefined,
    employee_count: org.employee_count as number | undefined,
  }
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    _id: (raw.user_id || raw._id || '') as string,
    fullName: (raw.full_name || raw.fullName || `${raw.first_name || ''} ${raw.last_name || ''}`.trim()) as string,
    email: (raw.email || '') as string,
    username: (raw.username || '') as string,
    role: (raw.role || 'doctor') as User['role'],
    accountStatus: (raw.account_status || raw.accountStatus || 'pending_email_verification') as User['accountStatus'],
    profilePhoto: (raw.profile_photo || raw.profilePhoto || '') as string,
    coverPhoto: (raw.cover_photo || raw.coverPhoto || '') as string,
    headline: (raw.headline || '') as string,
    bio: (raw.bio || '') as string,
    location: (raw.location || '') as string,
    country: (raw.country || '') as string,
    state: (raw.state || '') as string,
    city: (raw.city || '') as string,
    specialization: (raw.specialization || '') as string,
    licenseNumber: (raw.license_number || raw.licenseNumber || '') as string,
    yearsOfExperience: (raw.years_of_experience || raw.yearsOfExperience || 0) as number,
    currentOrganization: normalizeCurrentOrganization(raw.current_organization ?? raw.currentOrganization),
    department: (raw.department || '') as string,
    designation: (raw.designation ?? null) as string | null,
    skills: (raw.skills || []) as string[],
    languages: (raw.languages || []) as string[],
    certifications: (raw.certifications || []) as User['certifications'],
    education: (raw.education || []) as User['education'],
    experience: (raw.experience || []) as User['experience'],
    isEmailVerified: !!(raw.email_verified ?? raw.isEmailVerified ?? false),
    isProfileComplete: !!(raw.profile_completion ?? raw.isProfileComplete ?? false),
    followersCount: (raw.followersCount || raw.followers_count || 0) as number,
    followingCount: (raw.followingCount || raw.following_count || 0) as number,
    connectionsCount: (raw.connectionsCount || raw.connections_count || 0) as number,
    postsCount: (raw.postsCount || raw.posts_count || 0) as number,
    verificationStatus: (raw.verification_status || raw.verificationStatus || 'pending') as string,
    unreadMessagesCount: (raw.unread_messages_count ?? raw.unreadMessagesCount ?? 0) as number,
    createdAt: (raw.created_at || raw.createdAt || '') as string,
    updatedAt: (raw.updated_at || raw.updatedAt || raw.created_at || raw.createdAt || '') as string,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => tokenStorage.getAccess())
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!token) { setIsLoading(false); return }
    try {
      const res = await authService.getMe()
      const raw = res.data.data?.user || res.data.user || res.data
      setUser(normalizeUser(raw))
    } catch {
      tokenStorage.clear()
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = async (email: string, password: string, rememberMe = false) => {
    const res = await authService.login({ email, password, remember_me: rememberMe })
    const data = res.data.data || res.data
    queryClient.clear()
    tokenStorage.set({ access_token: data.access_token, refresh_token: data.refresh_token }, rememberMe)
    setToken(data.access_token)
    const normalized = normalizeUser(data.user)
    setUser(normalized)
    return normalized
  }

  const register = async (data: RegisterData) => {
    const res = await authService.register(data)
    const payload = res.data || {}
    if (payload.otp) localStorage.setItem('verify_otp', String(payload.otp))
    else localStorage.removeItem('verify_otp')
    if (payload.email) localStorage.setItem('verify_email', String(payload.email))
  }

  const logout = () => {
    tokenStorage.clear()
    queryClient.clear()
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated: User) => setUser(updated)

  const refreshUser = useCallback(async () => {
    if (!token) return
    try {
      const res = await authService.getMe()
      const raw = res.data.data?.user || res.data.user || res.data
      setUser(normalizeUser(raw))
    } catch {
      // keep the current user on refresh failure
    }
  }, [token])

  const setAuthFromVerify = (data: { access_token: string; user: Record<string, unknown> }) => {
    tokenStorage.set({ access_token: data.access_token }, true)
    setToken(data.access_token)
    setUser(normalizeUser(data.user))
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      isVerified: !!user && user.isEmailVerified && user.accountStatus === 'active',
      isPendingVerification: !!user && user.accountStatus === 'pending_professional_verification',
      login, register, logout, updateUser, setAuthFromVerify, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
