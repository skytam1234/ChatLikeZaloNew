import { create } from 'zustand'
import { settingsApi } from '@/api/settingsApi.js'

const DEFAULT_NOTIFICATION_SETTINGS = {
  messageNotifications: true,
  soundEnabled: true,
  desktopNotifications: true,
  messagePreview: true,
  typingWhileTyping: false,
  groupNotifications: true,
  missedCallNotifications: true,
}

export const useSettingsStore = create((set, get) => ({
  notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  profileLoading: false,
  profileError: null,
  passwordLoading: false,
  passwordError: null,

  /**
   * Update notification settings (local only)
   * @param {Partial<typeof DEFAULT_NOTIFICATION_SETTINGS>} settings
   */
  updateNotificationSettings: (settings) => {
    set((state) => ({
      notificationSettings: { ...state.notificationSettings, ...settings },
    }))
  },

  /**
   * Reset notification settings to defaults
   */
  resetNotificationSettings: () => {
    set({ notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS } })
  },

  /**
   * Fetch all sessions
   */
  fetchSessions: async () => {
    set({ sessionsLoading: true, sessionsError: null })
    try {
      const response = await settingsApi.getSessions()
      set({ sessions: response.data, sessionsLoading: false })
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to load sessions'
      set({ sessionsError: message, sessionsLoading: false })
    }
  },

  /**
   * Revoke a specific session
   * @param {string} sessionId
   */
  revokeSession: async (sessionId) => {
    try {
      await settingsApi.revokeSession(sessionId)
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }))
      return { success: true }
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to revoke session'
      return { success: false, error: message }
    }
  },

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: async () => {
    try {
      await settingsApi.revokeAllSessions()
      const currentSession = get().sessions.find((s) => s.isCurrent)
      set({ sessions: currentSession ? [currentSession] : [] })
      return { success: true }
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to revoke sessions'
      return { success: false, error: message }
    }
  },

  /**
   * Update user profile
   * @param {{ displayName?: string, phoneNumber?: string, avatarUrl?: string }} data
   */
  updateProfile: async (data) => {
    set({ profileLoading: true, profileError: null })
    try {
      const response = await settingsApi.updateProfile(data)
      set({ profileLoading: false })
      return { success: true, user: response.data }
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to update profile'
      set({ profileError: message, profileLoading: false })
      return { success: false, error: message }
    }
  },

  /**
   * Change password
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: async (currentPassword, newPassword) => {
    set({ passwordLoading: true, passwordError: null })
    try {
      await settingsApi.changePassword(currentPassword, newPassword)
      set({ passwordLoading: false })
      return { success: true }
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to change password'
      set({ passwordError: message, passwordLoading: false })
      return { success: false, error: message }
    }
  },

  /**
   * Upload avatar image to server
   * @param {File} file - The image file to upload
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { fileClient } = await import('@/api/axiosClient.js')
      const response = await fileClient.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const url = response.data?.url || response.data?.data?.url
      return { success: true, url }
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to upload avatar'
      return { success: false, error: message }
    }
  },
}))
