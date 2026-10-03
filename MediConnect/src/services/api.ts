import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from './tokenStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
})

api.interceptors.request.use(config => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh()
  if (!refreshToken) throw new Error('No refresh token available')
  const res = await api.post('/auth/refresh', { refresh_token: refreshToken })
  const data = res.data?.data || res.data
  tokenStorage.set(
    { access_token: data.access_token, refresh_token: data.refresh_token },
    tokenStorage.isRemembered(),
  )
  return data.access_token
}

export async function getFreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

api.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  async error => {
    const original = error.config as RetryConfig | undefined
    const isAuthRequest = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && original && !original._retry && !isAuthRequest) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
        }
        const newToken = await refreshPromise
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${newToken}`,
        } as AxiosRequestHeaders
        return api(original)
      } catch {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401 && !isAuthRequest) {
      tokenStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
