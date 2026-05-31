import { useConversationStore } from '@/stores/index.js'
import { useEffect } from 'react'

export const useConversations = () => {
  const {
    conversations,
    activeConversation,
    isLoading,
    error,
    setActiveConversation,
    fetchConversations,
    addConversation,
    updateConversation,
    deleteConversation,
    updateLastMessage,
    setUnreadCount,
    clearError,
  } = useConversationStore()

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    activeConversation,
    isLoading,
    error,
    setActiveConversation,
    fetchConversations,
    addConversation,
    updateConversation,
    deleteConversation,
    updateLastMessage,
    setUnreadCount,
    clearError,
  }
}
