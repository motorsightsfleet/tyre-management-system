import { create } from 'zustand'
import { apiClient, refreshAccessToken, setAccessToken, setUnauthorizedHandler } from '@/lib/api-client'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  hasPermission: (permission: string | string[]) => boolean
  hasRole: (role: string | string[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    setAccessToken(res.data.access_token)
    set({ user: res.data.user, isAuthenticated: true })
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore network errors on logout — we clear local state regardless
    }
    setAccessToken(null)
    set({ user: null, isAuthenticated: false })
  },

  bootstrap: async () => {
    const token = await refreshAccessToken()

    if (!token) {
      set({ isBootstrapping: false, isAuthenticated: false, user: null })
      return
    }

    try {
      const res = await apiClient.get('/auth/me')
      set({ user: res.data.user, isAuthenticated: true, isBootstrapping: false })
    } catch {
      setAccessToken(null)
      set({ user: null, isAuthenticated: false, isBootstrapping: false })
    }
  },

  hasPermission: (permission) => {
    const { user } = get()
    if (!user) return false
    const required = Array.isArray(permission) ? permission : [permission]
    return required.some((p) => user.permissions.includes(p))
  },

  hasRole: (role) => {
    const { user } = get()
    if (!user) return false
    const required = Array.isArray(role) ? role : [role]
    return required.some((r) => user.roles.includes(r))
  },
}))

setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false })
})
