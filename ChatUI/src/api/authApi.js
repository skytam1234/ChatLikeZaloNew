import { axiosClient } from './axiosClient.js'

export const authApi = {
  /**
   * Register new user
   * @param {{ username: string, email: string, password: string, displayName: string }} data
   * @returns {Promise<any>}
   */
  register: async (data) => {
    const response = await axiosClient.post('/auth/register', data)
    return response
  },

  /**
   * Login user
   * @param {{ email: string, password: string }} data
   * @returns {Promise<any>}
   */
  login: async (data) => {
    const response = await axiosClient.post('/auth/login', data)
    return response
  },

  /**
   * Logout user
   * @returns {Promise<any>}
   */
  logout: async () => {
    const response = await axiosClient.post('/auth/logout')
    return response
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {Promise<any>}
   */
  refreshToken: async (refreshToken) => {
    const response = await axiosClient.post('/auth/refresh', { refreshToken })
    return response
  },

  /**
   * Get current user
   * @returns {Promise<any>}
   */
  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me')
    return response
  },

  /**
   * Forgot password
   * @param {string} email
   * @returns {Promise<any>}
   */
  forgotPassword: async (email) => {
    const response = await axiosClient.post('/auth/forgot-password', { email })
    return response
  },

  /**
   * Reset password
   * @param {string} token
   * @param {string} password
   * @returns {Promise<any>}
   */
  resetPassword: async (token, password) => {
    const response = await axiosClient.post('/auth/reset-password', {
      token,
      password,
    })
    return response
  },

  /**
   * Verify email
   * @param {string} token
   * @returns {Promise<any>}
   */
  verifyEmail: async (token) => {
    const response = await axiosClient.post('/auth/verify-email', { token })
    return response
  },

  /**
   * Update profile
   * @param {Partial<any>} data
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
   * Get sessions
   * @returns {Promise<any>}
   */
  getSessions: async () => {
    const response = await axiosClient.get('/auth/sessions')
    return response
  },

  /**
   * Revoke session
   * @param {string} sessionId
   * @returns {Promise<any>}
   */
  revokeSession: async (sessionId) => {
    const response = await axiosClient.delete(`/auth/sessions/${sessionId}`)
    return response
  },

  /**
   * Revoke all sessions
   * @returns {Promise<any>}
   */
  revokeAllSessions: async () => {
    const response = await axiosClient.post('/auth/sessions/revoke-all')
    return response
  },
}
