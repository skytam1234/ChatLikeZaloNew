import { axiosClient } from './axiosClient.js'

/**
 * Redirect user to backend Google OAuth endpoint.
 * Browser will navigate away to Google, then come back via /auth/callback.
 */
export const googleAuthApi = {
  /**
   * Initiate Google OAuth login — redirects to backend
   */
  login: () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    window.location.href = `${backendUrl}/api/auth/google`
  },

  /**
   * Get Google link status for the current user
   * @returns {Promise<{ isLinked: boolean, email: string, canUnlink: boolean, message: string }>}
   */
  getLinkStatus: async () => {
    const response = await axiosClient.get('/auth/google/link-status')
    return response.data
  },

  /**
   * Link Google account to current user
   * @param {string} googleId
   * @param {string} [googleAccessToken]
   * @param {string} [googleRefreshToken]
   */
  linkAccount: async (googleId, googleAccessToken, googleRefreshToken) => {
    const response = await axiosClient.post('/auth/google/link', {
      googleId,
      googleAccessToken,
      googleRefreshToken,
    })
    return response.data
  },

  /**
   * Unlink Google account from current user
   */
  unlinkAccount: async () => {
    const response = await axiosClient.delete('/auth/google/unlink')
    return response.data
  },
}
