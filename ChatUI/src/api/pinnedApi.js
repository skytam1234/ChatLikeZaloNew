import { axiosClient } from './axiosClient.js'

export const pinnedApi = {
  /**
   * Get pinned documents for a conversation
   * @param {string} conversationId
   * @returns {Promise<any>}
   */
  getPinnedDocuments: async (conversationId) => {
    const response = await axiosClient.get(
      `/conversations/${conversationId}/pinned`
    )
    return response
  },

  /**
   * Pin a document
   * @param {string} conversationId
   * @param {{ messageId: string, title?: string, description?: string }} data
   * @returns {Promise<any>}
   */
  pinDocument: async (conversationId, data) => {
    const response = await axiosClient.post(
      `/conversations/${conversationId}/pinned`,
      data
    )
    return response
  },

  /**
   * Update pinned document
   * @param {string} pinnedId
   * @param {{ title?: string, description?: string }} data
   * @returns {Promise<any>}
   */
  updatePinnedDocument: async (pinnedId, data) => {
    const response = await axiosClient.put(`/pinned/${pinnedId}`, data)
    return response
  },

  /**
   * Unpin document - uses conversation route
   * @param {string} conversationId
   * @param {string} pinnedId
   * @returns {Promise<any>}
   */
  unpinDocument: async (conversationId, pinnedId) => {
    const response = await axiosClient.delete(`/conversations/${conversationId}/pinned/${pinnedId}`)
    return response
  },

  /**
   * Reorder pinned documents
   * @param {string} conversationId
   * @param {string[]} orderedIds
   * @returns {Promise<any>}
   */
  reorderPinnedDocuments: async (conversationId, orderedIds) => {
    const response = await axiosClient.put(
      `/conversations/${conversationId}/pinned/reorder`,
      { orderedIds }
    )
    return response
  },
}
