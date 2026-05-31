import { axiosClient } from './axiosClient.js'

export const userApi = {
  /**
   * Search users
   * @param {string} query
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<any>}
   */
  searchUsers: async (query, params) => {
    const response = await axiosClient.get('/users', {
      params: { search: query, ...params },
    })
    return response
  },

  /**
   * Get user profile
   * @returns {Promise<any>}
   */
  getProfile: async () => {
    const response = await axiosClient.get('/users/profile')
    return response
  },

  /**
   * Update user profile
   * @param {{ displayName?: string, avatarUrl?: string, phoneNumber?: string }} data
   * @returns {Promise<any>}
   */
  updateProfile: async (data) => {
    const response = await axiosClient.put('/users/profile', data)
    return response
  },

  /**
   * Get user by ID
   * @param {string} id
   * @returns {Promise<any>}
   */
  getUserById: async (id) => {
    const response = await axiosClient.get(`/users/${id}`)
    return response
  },
}
