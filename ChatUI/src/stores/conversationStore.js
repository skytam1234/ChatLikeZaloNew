import { create } from 'zustand'
import { conversationApi } from '@/api/index.js'

export const useConversationStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  isLoading: false,
  error: null,

  /**
   * Set active conversation
   * @param {any} conversation
   */
  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation })
  },

  /**
   * Fetch all conversations
   */
  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await conversationApi.getConversations()
      set({ conversations: response.data, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch conversations'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Add new conversation
   * @param {any} conversation
   */
  addConversation: (conversation) => {
    const { conversations } = get()
    const exists = conversations.some((c) => c.id === conversation.id)
    if (!exists) {
      set({ conversations: [conversation, ...conversations] })
    }
  },

  /**
   * Update conversation
   * @param {string} id
   * @param {Partial<any>} data
   */
  updateConversation: (id, data) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...data } : conv
      ),
      activeConversation:
        state.activeConversation?.id === id
          ? { ...state.activeConversation, ...data }
          : state.activeConversation,
    }))
  },

  /**
   * Delete conversation
   * @param {string} id
   */
  deleteConversation: (id) => {
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      activeConversation:
        state.activeConversation?.id === id ? null : state.activeConversation,
    }))
  },

  /**
   * Update last message in conversation
   * @param {string} conversationId
   * @param {any} message
   */
  updateLastMessage: (conversationId, message) => {
    set((state) => {
      const existingConv = state.conversations.find((c) => c.id === conversationId)

      if (!existingConv) {
        console.log('Conversation not found in list:', conversationId)
        // Fetch conversations to get the new one
        return state
      }

      const isCurrentConversation = state.activeConversation?.id === conversationId

      const conversations = state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessageId: message.id,
              lastMessageAt: message.createdAt,
              lastMessage: message,
              // Increment unread count only if not viewing this conversation
              unreadCount: isCurrentConversation ? 0 : (conv.unreadCount || 0) + 1,
            }
          : conv
      )

      // Sort conversations by lastMessageAt (newest first), pinned first
      conversations.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        const dateA = new Date(a.lastMessageAt || 0).getTime()
        const dateB = new Date(b.lastMessageAt || 0).getTime()
        return dateB - dateA
      })

      return {
        conversations,
        activeConversation:
          state.activeConversation?.id === conversationId
            ? { ...state.activeConversation, lastMessage: message, lastMessageAt: message.createdAt }
            : state.activeConversation,
      }
    })
  },

  /**
   * Set unread count for conversation
   * @param {string} conversationId
   * @param {number} count
   */
  setUnreadCount: (conversationId, count) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: count } : conv
      ),
    }))
  },

  /**
   * Reset unread count to 0 when viewing conversation
   * @param {string} conversationId
   */
  resetUnreadCount: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
      activeConversation:
        state.activeConversation?.id === conversationId
          ? { ...state.activeConversation, unreadCount: 0 }
          : state.activeConversation,
    }))
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Update user online status across all conversations
   * @param {string} userId
   * @param {boolean} isOnline
   */
  updateUserOnlineStatus: (userId, isOnline) => {
    set((state) => {
      const updateParticipants = (participants) =>
        participants?.map((p) => {
          // Direct chat: p.id is userId
          if (p.id === userId) {
            return { ...p, isOnline }
          }
          // Group chat: p.user.id is userId
          if (p.user?.id === userId) {
            return { ...p, user: { ...p.user, isOnline } }
          }
          return p
        })

      const updateConv = (conv) => ({
        ...conv,
        participants: updateParticipants(conv.participants),
      })

      const conversations = state.conversations.map(updateConv)
      const activeConversation = state.activeConversation
        ? updateConv(state.activeConversation)
        : null

      return { conversations, activeConversation }
    })
  },
}))
