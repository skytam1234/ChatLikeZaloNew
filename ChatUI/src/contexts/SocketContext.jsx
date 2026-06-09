import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react'
import { socketService } from '@/services/socketService.js'
import { useMessageStore, useConversationStore, useAuthStore, useCallStore, useNotificationStore } from '@/stores/index.js'
import { TYPING_TIMEOUT } from '@/utils/constants.js'

const SocketContext = createContext(undefined)

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  const { addMessage, setTypingUser, removeTypingUser, updateMessage, recallMessage } = useMessageStore()
  const { updateLastMessage, addConversation, updateUserOnlineStatus } = useConversationStore()
  const { setUserOnline } = useAuthStore()
  const { setIncomingCall, resetCall } = useCallStore()
  const { addNotification, setUnreadCount, setNotifications } = useNotificationStore()
  const typingTimersRef = useRef({})

  // ── Connect / Disconnect ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect()
      return
    }
    socketService.connect()
  }, [isAuthenticated, user])

  // ── Load notifications once socket is connected ──────────────────────────
  // Must be separate from listener registration so listeners are ready BEFORE emit
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const loadNotifications = () => {
      socketService.getNotifications({ page: 1, limit: 20 })
    }

    if (socketService.isConnected()) {
      loadNotifications()
    } else {
      socketService.onConnect(loadNotifications)
    }

    return () => {
      // No explicit off needed — onConnect auto-cleans on disconnect
    }
  }, [isAuthenticated, user])

  // ── All socket listeners (registered once, socket is guaranteed ready) ──
  useEffect(() => {
    if (!isAuthenticated || !user) return

    // ── Call: incoming ────────────────────────────────────────────────────
    const handleIncomingCall = (data) => {
      console.log('📞 [INCOMING_CALL] socketId:', socketService.socket?.id, '| received:', data);
      console.log('[DEBUG-B] incoming_call event received', {callId:data?.callId,type:data?.type,callerId:data?.caller?.id,calleeId:data?.calleeId,socketId:socketService.socket?.id});
      setIncomingCall(data);
      socketService.joinCallRoom(data.callId);
    }

    const handleCallCancelled = (data) => {
      console.log('📞 [CALL] call_cancelled received, resetting:', data)
      resetCall()
    }

    const handleCallEnded = (data) => {
      console.log('📞 [CALL] call_ended received, resetting:', data)
      resetCall()
    }

    const handleCallDeclined = (data) => {
      console.log('📞 [CALL] call_declined received, resetting:', data)
      resetCall()
    }

    const handleCallNoAnswer = (data) => {
      console.log('📞 [CALL] call_no_answer received, resetting:', data)
      resetCall()
    }

    const handleCallRejected = (data) => {
      console.log('📞 [CALL] call_rejected received, resetting:', data)
      resetCall()
    }

    const handleCallMissed = (data) => {
      console.log('📞 [CALL] call_missed_notify received, resetting:', data)
      resetCall()
    }

    const handleCallAccepted = (data) => {
      console.log('📞 [CALL] call_accepted received GLOBAL:', data, '| socketId:', socketService.socket?.id);
      const { setCallId, callAccepted: storeCallAccepted } = useCallStore.getState();
      if (data.callId) setCallId(data.callId);
      storeCallAccepted();
    }

    const handleCallRinging = (data) => {
      console.log('📞 [CALL] call_ringing received GLOBAL:', data, '| socketId:', socketService.socket?.id);
      useCallStore.getState().callRinging();
    }

    // ── Messages ─────────────────────────────────────────────────────────
    const handleNewMessage = (data) => {
      console.log('🔔 Socket: Received new_message', data)
      const { message } = data
      if (message) {
        addMessage(message.conversationId, message)
        updateLastMessage(message.conversationId, message)
      }
    }

    const handleUserTyping = (data) => {
      const { conversationId, userId, username } = data
      const typingUser = { userId, username: username || 'Người dùng', startedAt: Date.now() }
      setTypingUser(conversationId, typingUser)
      if (typingTimersRef.current[userId]) clearTimeout(typingTimersRef.current[userId])
      typingTimersRef.current[userId] = setTimeout(() => {
        removeTypingUser(conversationId, userId)
      }, TYPING_TIMEOUT)
    }

    const handleUserStopTyping = (data) => {
      const { conversationId, userId } = data
      if (typingTimersRef.current[userId]) {
        clearTimeout(typingTimersRef.current[userId])
        delete typingTimersRef.current[userId]
      }
      removeTypingUser(conversationId, userId)
    }

    const handleMessageSeen = (_data) => {}

    const handleMessageRecalled = (data) => {
      console.log('🔔 Socket: Received message_recalled', data)
      recallMessage(data.conversationId, data.messageId)
    }

    const handleConversationUpdated = (_data) => {}

    const handleUserOnline = (data) => {
      console.log('User online:', data.userId)
      updateUserOnlineStatus(data.userId, true)
    }

    const handleUserConnected = (data) => {
      console.log('🔵 User connected (self):', data.userId, 'isOnline:', data.isOnline)
      updateUserOnlineStatus(data.userId, true)
      if (data.userId === user?.id) setUserOnline(true)
    }

    const handleUserOffline = (data) => {
      console.log('User offline:', data.userId)
      updateUserOnlineStatus(data.userId, false)
      if (data.userId === user?.id) setUserOnline(false)
    }

    const handleMessageStatus = (data) => {
      console.log('Message status:', data)
    }

    const handleMessageSent = (data) => {
      console.log('Message sent:', data)
    }

    const handleJoinedConversation = (data) => {
      console.log('Joined conversation:', data.conversationId)
    }

    const handleLeftConversation = (data) => {
      console.log('Left conversation:', data.conversationId)
    }

    const handleMessageUpdated = (data) => {
      console.log('Message updated:', data)
    }

    const handleConversationCreated = (data) => {
      console.log('Conversation created:', data.conversation)
      if (data.conversation) addConversation(data.conversation)
    }

    // ── Notifications ────────────────────────────────────────────────────
    const handleUserJoined = (data) => {
      console.log('🔔 [SOCKET] New user joined:', data)
      addNotification({
        id: `temp_${Date.now()}`,
        type: 'system',
        title: 'Người dùng mới',
        content: `${data.displayName} đã tham gia hệ thống`,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: data,
      })
    }

    const handleNotificationList = (data) => {
      console.log('🔔 [SOCKET] Notification list received:', data)
      if (data?.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n) => !n.isRead).length)
      }
    }

    const handleNotificationRead = (data) => {
      console.log('🔔 [SOCKET] Notifications marked read:', data)
    }

    // Register all listeners
    socketService.onIncomingCall(handleIncomingCall)
    socketService.onNewMessage(handleNewMessage)
    socketService.onUserTyping(handleUserTyping)
    socketService.onUserStopTyping(handleUserStopTyping)
    socketService.onMessageSeen(handleMessageSeen)
    socketService.onMessageRecalled(handleMessageRecalled)
    socketService.onConversationUpdated(handleConversationUpdated)
    socketService.onUserOnline(handleUserOnline)
    socketService.onUserConnected(handleUserConnected)
    socketService.onUserOffline(handleUserOffline)
    socketService.onMessageStatus(handleMessageStatus)
    socketService.onMessageSent(handleMessageSent)
    socketService.onJoinedConversation(handleJoinedConversation)
    socketService.onLeftConversation(handleLeftConversation)
    socketService.onMessageUpdated(handleMessageUpdated)
    socketService.onConversationCreated(handleConversationCreated)

    socketService.onUserJoined(handleUserJoined)
    socketService.onNotificationList(handleNotificationList)
    socketService.onNotificationRead(handleNotificationRead)

    socketService.onCallCancelled(handleCallCancelled)
    socketService.onCallEnded(handleCallEnded)
    socketService.onCallDeclined(handleCallDeclined)
    socketService.onCallNoAnswer(handleCallNoAnswer)
    socketService.onCallRejected(handleCallRejected)
    socketService.onCallMissed(handleCallMissed)
    socketService.onCallAccepted(handleCallAccepted)
    socketService.onCallRinging(handleCallRinging)

    // Cleanup: unregister all
    return () => {
      socketService.offIncomingCall(handleIncomingCall)
      socketService.offCallCancelled(handleCallCancelled)
      socketService.offCallEnded(handleCallEnded)
      socketService.offCallDeclined(handleCallDeclined)
      socketService.offCallNoAnswer(handleCallNoAnswer)
      socketService.offCallRejected(handleCallRejected)
      socketService.offCallMissed(handleCallMissed)
      socketService.offCallAccepted(handleCallAccepted)
      socketService.offCallRinging(handleCallRinging)
      socketService.offNewMessage(handleNewMessage)
      socketService.offUserTyping(handleUserTyping)
      socketService.offUserStopTyping(handleUserStopTyping)
      socketService.offMessageSeen(handleMessageSeen)
      socketService.offMessageRecalled(handleMessageRecalled)
      socketService.offConversationUpdated(handleConversationUpdated)
      socketService.offUserOnline(handleUserOnline)
      socketService.offUserConnected(handleUserConnected)
      socketService.offUserOffline(handleUserOffline)
      socketService.offMessageStatus(handleMessageStatus)
      socketService.offMessageSent(handleMessageSent)
      socketService.offJoinedConversation(handleJoinedConversation)
      socketService.offLeftConversation(handleLeftConversation)
      socketService.offMessageUpdated(handleMessageUpdated)
      socketService.offConversationCreated(handleConversationCreated)
      socketService.offUserJoined(handleUserJoined)
      socketService.offNotificationList(handleNotificationList)
      socketService.offNotificationRead(handleNotificationRead)
      Object.values(typingTimersRef.current).forEach(clearTimeout)
    }
  }, [isAuthenticated, user, addMessage, updateLastMessage, setTypingUser, removeTypingUser, updateMessage, recallMessage, addConversation, updateUserOnlineStatus, setUserOnline, setIncomingCall, resetCall, addNotification, setUnreadCount, setNotifications])

  const joinConversation = useCallback((conversationId) => {
    socketService.joinConversation(conversationId)
  }, [])

  const leaveConversation = useCallback((conversationId) => {
    socketService.leaveConversation(conversationId)
  }, [])

  const sendMessage = useCallback((data) => {
    socketService.sendMessage({ ...data, type: data.type || 'text' })
  }, [])

  const startTyping = useCallback((conversationId) => {
    const username = user?.displayName || user?.username || 'Người dùng'
    socketService.startTyping(conversationId, username)
  }, [user])

  const stopTyping = useCallback((conversationId) => {
    socketService.stopTyping(conversationId)
  }, [])

  const markSeen = useCallback((conversationId, messageId) => {
    socketService.markSeen(conversationId, messageId)
  }, [])

  const markDelivered = useCallback((conversationId, messageId) => {
    socketService.markDelivered(conversationId, messageId)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        isConnected: socketService.isConnected(),
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markSeen,
        markDelivered,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}
