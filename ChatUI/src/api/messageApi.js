import { axiosClient } from './axiosClient.js'

export const messageApi = {
  /**
   * Get messages for a conversation
   * @param {string} conversationId
   * @param {{ page?: number, limit?: number, before?: string }} [params]
   * @returns {Promise<any>}
   */
  getMessages: async (conversationId, params) => {
    const response = await axiosClient.get(
      `/conversations/${conversationId}/messages`,
      { params }
    )
    return response
  },

  /**
   * Send a message
   * @param {string} conversationId
   * @param {{ content: string, type?: string, replyToId?: string, metadata?: Record<string, any> }} data
   * @returns {Promise<any>}
   */
  sendMessage: async (conversationId, data) => {
    const response = await axiosClient.post(
      `/conversations/${conversationId}/messages`,
      {
        content: data.content,
        messageType: data.type || 'text', // Backend expects 'messageType'
        replyToId: data.replyToId,
        metadata: data.metadata,
      }
    )
    return response
  },

  /**
   * Update message
   * @param {string} messageId
   * @param {{ content: string }} data
   * @returns {Promise<any>}
   */
  updateMessage: async (messageId, data) => {
    const response = await axiosClient.put(`/messages/${messageId}`, data)
    return response
  },

  /**
   * Delete message
   * @param {string} messageId
   * @returns {Promise<any>}
   */
  deleteMessage: async (messageId) => {
    const response = await axiosClient.delete(`/messages/${messageId}`)
    return response
  },

  /**
   * Recall message
   * @param {string} messageId
   * @returns {Promise<any>}
   */
  recallMessage: async (messageId) => {
    const response = await axiosClient.post(`/messages/${messageId}/recall`)
    return response
  },

  /**
   * Mark messages as read
   * @param {string} conversationId
   * @param {string} [messageId]
   * @returns {Promise<any>}
   */
  markAsRead: async (conversationId, messageId) => {
    const response = await axiosClient.post(
      '/messages/read',
      { conversationId, messageId }
    )
    return response
  },

  /**
   * Get message status
   * @param {string} messageId
   * @returns {Promise<any>}
   */
  getMessageStatus: async (messageId) => {
    const response = await axiosClient.get(`/messages/${messageId}/status`)
    return response
  },

  /**
   * Upload file
   * @param {File} file
   * @returns {Promise<any>}
   */
  uploadFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  },

  /**
   * Send file message (upload file and send as message)
   * @param {string} conversationId
   * @param {File} file
   * @param {string} [content]
   * @param {string} [replyToId]
   * @returns {Promise<any>}
   */
  sendFileMessage: async (conversationId, file, content = null, replyToId = null) => {
    const formData = new FormData()
    formData.append('file', file)
    if (content) {
      formData.append('content', content)
    }

    const response = await axiosClient.post(
      `/conversations/${conversationId}/messages/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  /**
   * Search messages
   * @param {string} conversationId
   * @param {string} query
   * @returns {Promise<any>}
   */
  searchMessages: async (conversationId, query) => {
    const response = await axiosClient.get(
      `/conversations/${conversationId}/messages/search`,
      { params: { q: query } }
    )
    return response
  },
}
