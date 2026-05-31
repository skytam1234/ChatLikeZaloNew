import { axiosClient } from './axiosClient.js'

export const settingsApi = {
  /**
   * Get current user profile
   * @returns {Promise<any>}
   */
  getProfile: async () => {
    const response = await axiosClient.get('/auth/me')
    return response
  },

  /**
   * Update user profile
   * @param {{ displayName?: string, phoneNumber?: string, avatarUrl?: string }} data
   * @returns {Promise<any>}
   */
  updateProfile: async (data) => {
    const response = await axiosClient.put('/auth/me', data)
    return response
  },

  /**
   * Change password
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<any>}
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await axiosClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response
  },

  /**
   * Get all sessions
   * @returns {Promise<any>}
   */
  getSessions: async () => {
    const response = await axiosClient.get('/auth/sessions')
    return response
  },

  /**
   * Revoke a specific session
   * @param {string} sessionId
   * @returns {Promise<any>}
   */
  revokeSession: async (sessionId) => {
    const response = await axiosClient.delete(`/auth/sessions/${sessionId}`)
    return response
  },

  /**
   * Revoke all sessions except current
   * @returns {Promise<any>}
   */
  revokeAllSessions: async () => {
    const response = await axiosClient.post('/auth/sessions/revoke-all')
    return response
  },
}
