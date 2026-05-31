import { useMessageStore, useAuthStore } from '@/stores/index.js'
import { useSocketContext } from '@/contexts/index.js'
import { useEffect, useRef, useCallback } from 'react'
import { TYPING_DEBOUNCE } from '@/utils/constants.js'

export const useMessages = (conversationId) => {
  const { user } = useAuthStore()
  const {
    messagesByConversation,
    typingUsersByConversation,
    isLoading,
    error,
    fetchMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    recallMessage,
    clearTypingUsers,
    clearMessages,
    clearError,
  } = useMessageStore()

  const { joinConversation, leaveConversation } = useSocketContext()
  const typingTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)

  const messages = messagesByConversation[conversationId] || []
  const typingUsers = typingUsersByConversation[conversationId] || []

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId)
      joinConversation(conversationId)
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId)
        clearMessages(conversationId)
      }
    }
  }, [conversationId, fetchMessages, joinConversation, leaveConversation, clearMessages])

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
    }
  }, [])

  const stopTyping = useCallback(() => {
    isTypingRef.current = false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const debouncedTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, TYPING_DEBOUNCE)
  }, [stopTyping])

  return {
    messages,
    typingUsers,
    isLoading,
    error,
    fetchMessages: () => fetchMessages(conversationId),
    addMessage: (message) => addMessage(conversationId, message),
    updateMessage: (messageId, data) => updateMessage(conversationId, messageId, data),
    deleteMessage: (messageId) => deleteMessage(conversationId, messageId),
    recallMessage: (messageId) => recallMessage(conversationId, messageId),
    startTyping,
    stopTyping,
    debouncedTyping,
    clearTypingUsers: () => clearTypingUsers(conversationId),
    clearError,
    currentUserId: user?.id || '',
  }
}
