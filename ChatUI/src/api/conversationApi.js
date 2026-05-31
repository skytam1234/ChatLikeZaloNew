import { axiosClient } from './axiosClient.js'

export const conversationApi = {
  /**
   * Get all conversations
   * @param {{ page?: number, limit?: number, type?: 'direct'|'group' }} [params]
   * @returns {Promise<any>}
   */
  getConversations: async (params) => {
    const response = await axiosClient.get('/conversations', { params })
    return response
  },

  /**
   * Get single conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  getConversation: async (id) => {
    const response = await axiosClient.get(`/conversations/${id}`)
    return response
  },

  /**
   * Create new conversation
   * @param {{ type: 'direct'|'group', name?: string, participantIds?: string[], targetUserId?: string }} data
   * @returns {Promise<any>}
   */
  createConversation: async (data) => {
    const response = await axiosClient.post('/conversations', data)
    return response
  },

  /**
   * Update conversation
   * @param {string} id
   * @param {{ name?: string, avatarUrl?: string, description?: string }} data
   * @returns {Promise<any>}
   */
  updateConversation: async (id, data) => {
    const response = await axiosClient.put(`/conversations/${id}`, data)
    return response
  },

  /**
   * Delete conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  deleteConversation: async (id) => {
    const response = await axiosClient.delete(`/conversations/${id}`)
    return response
  },

  /**
   * Archive conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  archiveConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/archive`)
    return response
  },

  /**
   * Unarchive conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  unarchiveConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/unarchive`)
    return response
  },

  /**
   * Pin conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  pinConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/pin`)
    return response
  },

  /**
   * Unpin conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  unpinConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/unpin`)
    return response
  },

  /**
   * Mute conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  muteConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/mute`)
    return response
  },

  /**
   * Unmute conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  unmuteConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/unmute`)
    return response
  },

  /**
   * Get conversation members
   * @param {string} id
   * @returns {Promise<any>}
   */
  getConversationMembers: async (id) => {
    const response = await axiosClient.get(`/conversations/${id}/members`)
    return response
  },

  /**
   * Add member to conversation
   * @param {string} conversationId
   * @param {string} userId
   * @returns {Promise<any>}
   */
  addMember: async (conversationId, userId) => {
    const response = await axiosClient.post(
      `/conversations/${conversationId}/members`,
      { userId }
    )
    return response
  },

  /**
   * Remove member from conversation
   * @param {string} conversationId
   * @param {string} userId
   * @returns {Promise<any>}
   */
  removeMember: async (conversationId, userId) => {
    const response = await axiosClient.delete(
      `/conversations/${conversationId}/members/${userId}`
    )
    return response
  },

  /**
   * Update member role
   * @param {string} conversationId
   * @param {string} userId
   * @param {'admin'|'member'} role
   * @returns {Promise<any>}
   */
  updateMemberRole: async (conversationId, userId, role) => {
    const response = await axiosClient.put(
      `/conversations/${conversationId}/members/${userId}`,
      { role }
    )
    return response
  },

  /**
   * Leave conversation
   * @param {string} id
   * @returns {Promise<any>}
   */
  leaveConversation: async (id) => {
    const response = await axiosClient.post(`/conversations/${id}/leave`)
    return response
  },

  /**
   * Search conversations
   * @param {string} query
   * @returns {Promise<any>}
   */
  searchConversations: async (query) => {
    const response = await axiosClient.get('/conversations/search', {
      params: { q: query },
    })
    return response
  },
}
