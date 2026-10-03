import api from '@/services/api'

interface LoginPayload { email: string; password: string; remember_me?: boolean }
interface RegisterPayload {
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
interface VerifyEmailPayload { email?: string; otp?: string; code?: string }
interface ResetPasswordPayload { token: string; password?: string; new_password?: string; confirm_password?: string }
interface ForgotPasswordPayload { email: string }

export const authService = {
  login: (data: LoginPayload) => api.post('/auth/login', data),
  refresh: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (data: VerifyEmailPayload) => api.post('/auth/verify-email', data),
  resendVerification: (email: string) => api.post('/auth/resend-otp', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: ResetPasswordPayload) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
}
