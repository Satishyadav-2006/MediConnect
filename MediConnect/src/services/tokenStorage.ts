const ACCESS_KEY = 'medi_token'
const REFRESH_KEY = 'medi_refresh_token'

function hasLocalRefresh(): boolean {
  return !!localStorage.getItem(REFRESH_KEY)
}

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY)
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
  },
  isRemembered(): boolean {
    return hasLocalRefresh()
  },
  set(tokens: { access_token: string; refresh_token?: string }, remember: boolean) {
    const store = remember ? localStorage : sessionStorage
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(ACCESS_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    store.setItem(ACCESS_KEY, tokens.access_token)
    if (tokens.refresh_token) store.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(ACCESS_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
  },
}