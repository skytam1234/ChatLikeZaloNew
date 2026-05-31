import { create } from 'zustand'
import { messageApi } from '@/api/index.js'

export const useMessageStore = create((set) => ({
  messagesByConversation: {},
  typingUsersByConversation: {},
  isLoading: false,
  error: null,

  /**
   * Fetch messages for a conversation
   * @param {string} conversationId
   */
  fetchMessages: async (conversationId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await messageApi.getMessages(conversationId)
      // Reverse to get oldest first (ascending order for display)
      const messages = response.data.reverse()
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages,
        },
        isLoading: false,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch messages'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Add message to conversation
   * @param {string} conversationId
   * @param {any} message
   */
  addMessage: (conversationId, message) => {
    set((state) => {
      const existingMessages = state.messagesByConversation[conversationId] || []
      const messageExists = existingMessages.some((m) => m.id === message.id)

      if (messageExists) {
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: existingMessages.map((m) =>
              m.id === message.id ? { ...m, ...message } : m
            ),
          },
        }
      }

      const newMessages = [...existingMessages, message]
      newMessages.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateA - dateB
      })

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: newMessages,
        },
      }
    })
  },

  /**
   * Update message
   * @param {string} conversationId
   * @param {string} messageId
   * @param {Partial<any>} data
   */
  updateMessage: (conversationId, messageId, data) => {
    set((state) => {
      const messages = state.messagesByConversation[conversationId] || []
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...data } : msg
          ),
        },
      }
    })
  },

  /**
   * Delete message
   * @param {string} conversationId
   * @param {string} messageId
   */
  deleteMessage: (conversationId, messageId) => {
    set((state) => {
      const messages = state.messagesByConversation[conversationId] || []
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages.map((msg) =>
            msg.id === messageId ? { ...msg, isDeleted: true, content: null } : msg
          ),
        },
      }
    })
  },

  /**
   * Recall message (permanently remove from store)
   * @param {string} conversationId
   * @param {string} messageId
   */
  recallMessage: (conversationId, messageId) => {
    set((state) => {
      const messages = state.messagesByConversation[conversationId] || []
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages.filter((msg) => msg.id !== messageId),
        },
      }
    })
  },

  /**
   * Set typing user
   * @param {string} conversationId
   * @param {{ userId: string, username: string, startedAt: number }} user
   */
  setTypingUser: (conversationId, user) => {
    set((state) => {
      const typingUsers = state.typingUsersByConversation[conversationId] || []
      const userExists = typingUsers.some((u) => u.userId === user.userId)

      if (userExists) {
        return {
          typingUsersByConversation: {
            ...state.typingUsersByConversation,
            [conversationId]: typingUsers.map((u) =>
              u.userId === user.userId ? user : u
            ),
          },
        }
      }

      return {
        typingUsersByConversation: {
          ...state.typingUsersByConversation,
          [conversationId]: [...typingUsers, user],
        },
      }
    })
  },

  /**
   * Remove typing user
   * @param {string} conversationId
   * @param {string} userId
   */
  removeTypingUser: (conversationId, userId) => {
    set((state) => {
      const typingUsers = state.typingUsersByConversation[conversationId] || []
      return {
        typingUsersByConversation: {
          ...state.typingUsersByConversation,
          [conversationId]: typingUsers.filter((u) => u.userId !== userId),
        },
      }
    })
  },

  /**
   * Clear all typing users for a conversation
   * @param {string} conversationId
   */
  clearTypingUsers: (conversationId) => {
    set((state) => ({
      typingUsersByConversation: {
        ...state.typingUsersByConversation,
        [conversationId]: [],
      },
    }))
  },

  /**
   * Update message status
   * @param {string} conversationId
   * @param {string} messageId
   * @param {{ status: string }} status
   */
  updateMessageStatus: (conversationId, messageId, status) => {
    set((state) => {
      const messages = state.messagesByConversation[conversationId] || []
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, statuses: [...(msg.statuses || []), status] }
              : msg
          ),
        },
      }
    })
  },

  /**
   * Clear messages for a conversation
   * @param {string} conversationId
   */
  clearMessages: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...rest } = state.messagesByConversation
      return { messagesByConversation: rest }
    })
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null })
  },
}))
