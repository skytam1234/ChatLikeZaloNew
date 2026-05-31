import { create } from 'zustand'
import { authApi } from '@/api/index.js'
import { storage } from '@/utils/storage.js'
import { tokenService } from '@/utils/tokenService.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isSessionExpired: false,

  /**
   * Login user
   * @param {{ email: string, password: string }} credentials
   */
  login: async (credentials) => {
    set({ isLoading: true, error: null, isSessionExpired: false })
    try {
      const response = await authApi.login(credentials)
      const { user, accessToken, refreshToken } = response.data

      storage.set('ACCESS_TOKEN', accessToken)
      storage.set('REFRESH_TOKEN', refreshToken)
      storage.setObject('USER', user)

      set({ user, isAuthenticated: true, isLoading: false, isSessionExpired: false })
    } catch (error) {
      // Extract error message from axios response
      const errorMessage = error?.response?.data?.error || error?.message || 'Đăng nhập thất bại'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  /**
   * Register new user
   * @param {{ username: string, email: string, password: string, displayName: string }} data
   */
  register: async (data) => {
    set({ isLoading: true, error: null, isSessionExpired: false })
    try {
      // Clear all auth data before registration
      storage.clear()

      const response = await authApi.register(data)
      // API chỉ trả về user, không có tokens
      const { user } = response.data

      // Sau khi đăng ký thành công, KHÔNG lưu gì vào storage
      // User phải đăng nhập lại bằng tay

      // Reset state - không có user, không authenticated
      set({ user: null, isAuthenticated: false, isLoading: false, isSessionExpired: false })
    } catch (error) {
      // Extract error message from axios response
      const errorMessage = error?.response?.data?.error || error?.message || 'Đăng ký thất bại'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } catch {
      // Ignore logout API errors
    } finally {
      storage.clear()
      set({ user: null, isAuthenticated: false, isLoading: false, isSessionExpired: false })
    }
  },

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  /**
   * Set user manually
   * @param {any} user
   */
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
    if (user) {
      storage.setObject('USER', user)
    }
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Check authentication status
   */
  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const token = storage.get('ACCESS_TOKEN')
      const cachedUser = storage.getObject('USER')

      if (token) {
        if (tokenService.isTokenExpired(token)) {
          const refreshed = await get().refreshSession()
          if (!refreshed) {
            set({ user: null, isAuthenticated: false, isLoading: false })
            return
          }
        }

        const response = await authApi.getCurrentUser()
        const user = response.data
        storage.setObject('USER', user)
        set({ user, isAuthenticated: true, isLoading: false, isSessionExpired: false })
      } else {
        if (cachedUser) {
          set({ user: cachedUser, isAuthenticated: true, isLoading: false })
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      }
    } catch {
      storage.clear()
      set({ user: null, isAuthenticated: false, isLoading: false, isSessionExpired: false })
    }
  },

  /**
   * Refresh session with refresh token
   * @returns {boolean}
   */
  refreshSession: async () => {
    try {
      const refreshToken = storage.get('REFRESH_TOKEN')

      if (!refreshToken || tokenService.isTokenExpired(refreshToken)) {
        set({ isSessionExpired: true })
        return false
      }

      const response = await authApi.refreshToken(refreshToken)
      const { accessToken, refreshToken: newRefreshToken } = response.data

      storage.set('ACCESS_TOKEN', accessToken)
      storage.set('REFRESH_TOKEN', newRefreshToken)

      return true
    } catch {
      set({ isSessionExpired: true })
      return false
    }
  },

  /**
   * Set session expired state
   * @param {boolean} expired
   */
  setSessionExpired: (expired) => {
    set({ isSessionExpired: expired })
  },

  /**
   * Update current user online status
   * @param {boolean} isOnline
   */
  setUserOnline: (isOnline) => {
    set((state) => ({
      user: state.user ? { ...state.user, status: isOnline ? 'online' : 'offline' } : null,
    }))
  },

  /**
   * Set auth state from Google OAuth callback
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {object} user
   */
  setAuth: (accessToken, refreshToken, user) => {
    storage.set('ACCESS_TOKEN', accessToken)
    storage.set('REFRESH_TOKEN', refreshToken)
    storage.setObject('USER', user)
    set({ user, isAuthenticated: true, isLoading: false, isSessionExpired: false })
  },
}))
