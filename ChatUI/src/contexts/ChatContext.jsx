import React, { createContext, useContext, useCallback } from 'react'
import { useSocketContext } from './SocketContext.jsx'
import { useMessageStore, useConversationStore } from '@/stores/index.js'
import { messageApi } from '@/api/index.js'
import { socketService } from '@/services/socketService.js'

const ChatContext = createContext(undefined)

export const ChatProvider = ({ children }) => {
  const { sendMessage: socketSendMessage, stopTyping, markSeen } = useSocketContext()
  const { addMessage, deleteMessage: storeDeleteMessage, recallMessage: storeRecallMessage } = useMessageStore()
  const { updateLastMessage } = useConversationStore()

  const acceptCall = useCallback((callId) => {
    socketService.acceptCall(callId)
  }, [])

  const declineCall = useCallback((callId) => {
    socketService.declineCall(callId)
  }, [])

  const sendTextMessage = useCallback(async (conversationId, content, type = 'text', replyToId) => {
    stopTyping(conversationId)

    try {
      const response = await messageApi.sendMessage(conversationId, {
        content,
        type,
        replyToId,
      })

      const message = response.data
      addMessage(conversationId, message)
      updateLastMessage(conversationId, message)
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [stopTyping, addMessage, updateLastMessage])

  const sendFileMessage = useCallback(async (conversationId, file, content = null, replyToId) => {
    try {
      const response = await messageApi.sendFileMessage(conversationId, file, content, replyToId)
      const message = response.data
      addMessage(conversationId, message)
      updateLastMessage(conversationId, message)
      return message
    } catch (error) {
      console.error('Failed to send file message:', error)
      throw error
    }
  }, [addMessage, updateLastMessage])

  const sendMessage = useCallback(async (conversationId, content, type = 'text', replyToId) => {
    stopTyping(conversationId)

    try {
      const response = await messageApi.sendMessage(conversationId, {
        content,
        type,
        replyToId,
      })

      const message = response.data
      addMessage(conversationId, message)
      updateLastMessage(conversationId, message)
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [stopTyping, addMessage, updateLastMessage])

  const markAsRead = useCallback(async (conversationId, messageId) => {
    try {
      await messageApi.markAsRead(conversationId, messageId)
      if (messageId) {
        markSeen(conversationId, messageId)
      }
    } catch (error) {
      // Silently handle mark as read errors - don't interrupt the chat experience
      console.warn('Failed to mark as read:', error?.response?.data?.error || error.message)
    }
  }, [markSeen])

  const deleteMessage = useCallback(async (conversationId, messageId) => {
    try {
      await messageApi.deleteMessage(messageId)
      storeDeleteMessage(conversationId, messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }, [storeDeleteMessage])

  const recallMessage = useCallback(async (conversationId, messageId) => {
    try {
      await messageApi.recallMessage(messageId)
      // Remove from store since message is permanently deleted from DB
      useMessageStore.getState().recallMessage(conversationId, messageId)
    } catch (error) {
      console.error('Failed to recall message:', error)
      throw error
    }
  }, [])

  return (
    <ChatContext.Provider
      value={{
        sendMessage,
        sendTextMessage,
        sendFileMessage,
        markAsRead,
        deleteMessage,
        recallMessage,
        acceptCall,
        declineCall,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
