import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthContext, useSocketContext, useChatContext } from '@/contexts/index.js'
import { useConversationStore, useMessageStore, useCallStore, useAuthStore } from '@/stores/index.js'
import {
  ConversationHeader,
  MessageList,
  ChatInput,
  PinnedDocuments,
  GroupMemberList,
} from '@/components/chat/index.js'
import { pinnedApi, conversationApi, messageApi } from '@/api/index.js'
import { socketService } from '@/services/socketService.js'
import { webrtcService } from '@/services/webrtcService.js'
import { Search, X, MessageSquare } from 'lucide-react'
import { debounce } from '@/utils/helpers.js'

export const ConversationPage = ({ onBack }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { joinConversation, leaveConversation } = useSocketContext()
  const { sendMessage, sendFileMessage, markAsRead, deleteMessage, recallMessage } = useChatContext()

  const { conversations, setActiveConversation, resetUnreadCount } = useConversationStore()
  const { messagesByConversation, typingUsersByConversation, fetchMessages, addMessage } = useMessageStore()

  const [replyTo, setReplyTo] = useState(null)
  const [showPinnedDocs, setShowPinnedDocs] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [pinnedDocuments, setPinnedDocuments] = useState([])
  const [members, setMembers] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const debouncedSearchRef = useRef(null)

  const conversation = conversations.find((c) => c.id === id)
  const messages = id ? messagesByConversation[id] || [] : []
  const typingUsers = id ? typingUsersByConversation[id] || [] : []

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/chat')
    }
  }

  useEffect(() => {
    if (id) {
      setActiveConversation(conversation || null)
      resetUnreadCount(id)
      fetchMessages(id)
      joinConversation(id)
      markAsRead(id)

      if (conversation?.type === 'group') {
        loadMembers()
      }
    }

    return () => {
      if (id) {
        leaveConversation(id)
      }
    }
  }, [id, conversation?.id])

  useEffect(() => {
    if (showSearch) {
      debouncedSearchRef.current = debounce(async (query) => {
        if (query.trim().length > 0) {
          setIsSearching(true)
          try {
            const response = await messageApi.searchMessages(id, query)
            setSearchResults(response.data || [])
          } catch (error) {
            console.error('Search failed:', error)
            setSearchResults([])
          } finally {
            setIsSearching(false)
          }
        } else {
          setSearchResults([])
        }
      }, 500)
    }
  }, [showSearch, id])

  const loadMembers = async () => {
    if (!id) return
    try {
      const response = await conversationApi.getConversationMembers(id)
      setMembers(response.data.map((cu) => ({
        id: cu.id,
        conversationId: cu.conversationId,
        userId: cu.userId,
        role: cu.role,
        nickname: cu.nickname,
        joinedAt: cu.joinedAt,
        invitedBy: null,
        isActive: true,
        user: cu.user,
      })))
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const loadPinnedDocuments = async () => {
    if (!id) return
    try {
      const response = await pinnedApi.getPinnedDocuments(id)
      setPinnedDocuments(response.data)
      setShowPinnedDocs(true)
    } catch (error) {
      console.error('Failed to load pinned documents:', error)
    }
  }

  const handleSendMessage = async (content, type, replyToId) => {
    if (!id) return
    try {
      await sendMessage(id, content, type, replyToId)
      setReplyTo(null)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleReply = (message) => setReplyTo(message)

  const handlePin = async (message) => {
    if (!id) return
    try {
      await pinnedApi.pinDocument(id, { messageId: message.id })
      loadPinnedDocuments()
    } catch (error) {
      console.error('Failed to pin message:', error)
    }
  }

  const handleDelete = async (message) => {
    if (!id) return
    try {
      await deleteMessage(id, message.id)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleRecall = async (message) => {
    if (!id) return
    try {
      await recallMessage(id, message.id)
    } catch (error) {
      console.error('Failed to recall message:', error)
    }
  }

  const handleAttachFile = async (files) => {
    if (!id || !files || files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const message = await sendFileMessage(id, file, null, replyTo?.id)
        if (message) addMessage(id, message)
      }
      setReplyTo(null)
    } catch (error) {
      console.error('Failed to attach file:', error)
      alert('Gửi file thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSendImage = async (files) => {
    if (!id || !files || files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const message = await sendFileMessage(id, file, null, replyTo?.id)
          if (message) addMessage(id, message)
        }
      }
      setReplyTo(null)
    } catch (error) {
      console.error('Failed to send image:', error)
      alert('Gửi ảnh thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSendVoice = async (audioBlob, mimeType) => {
    if (!id) return
    setIsUploading(true)
    try {
      const filename = `voice-${Date.now()}.webm`
      const file = new File([audioBlob], filename, { type: mimeType })
      const message = await sendFileMessage(id, file, null, replyTo?.id)
      if (message) addMessage(id, message)
      setReplyTo(null)
    } catch (error) {
      console.error('Failed to send voice:', error)
      alert('Gửi tin nhắn thoại thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUnpin = async (documentOrMessage) => {
    try {
      let doc
      if (documentOrMessage.message) {
        doc = documentOrMessage
      } else {
        doc = pinnedDocuments.find((d) => d.message?.id === documentOrMessage.id)
      }

      if (doc?.id) {
        await pinnedApi.unpinDocument(id, doc.id)
        setPinnedDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      }
    } catch (error) {
      console.error('Failed to unpin document:', error)
    }
  }

  const handleViewMessage = (message) => {
    setShowPinnedDocs(false)
    setTimeout(() => {
      const element = document.getElementById(`message-${message.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('highlight-message')
        setTimeout(() => element.classList.remove('highlight-message'), 2000)
      }
    }, 100)
  }

  const handleRemoveMember = async (member) => {
    if (!id) return
    try {
      await conversationApi.removeMember(id, member.userId)
      loadMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const handleChangeRole = async (member, role) => {
    if (!id) return
    try {
      await conversationApi.updateMemberRole(id, member.userId, role)
      loadMembers()
    } catch (error) {
      console.error('Failed to change role:', error)
    }
  }

  const handleShowMembers = async () => {
    await loadMembers()
    setShowMembers(true)
  }

  const handleSearch = () => setShowSearch(true)

  const handleSearchInput = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    debouncedSearchRef.current?.(query)
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const goToSearchMessage = (message) => {
    closeSearch()
    setTimeout(() => {
      const element = document.getElementById(`message-${message.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('highlight-message')
        setTimeout(() => element.classList.remove('highlight-message'), 2000)
      }
    }, 100)
  }

  // ==================== CALL HANDLERS ====================
  // NOTE: Incoming-call listeners (incoming_call, call_accepted, call_declined, etc.)
  // are handled centrally by CallModalHandler (root level) — DO NOT add them here.
  //
  // This section only handles the OUTGOING (caller) side: initiating a call
  // and WebRTC signaling for calls initiated by the current user.

  // Get callee info for direct conversation
  const getCalleeInfo = () => {
    if (conversation.type !== 'direct') return null
    const otherUser = conversation.participants?.find((p) => p.id !== user?.id)
    return otherUser?.user || otherUser
  }

  // Initiate audio call
  const handleCall = async () => {
    const callee = getCalleeInfo()
    if (!callee) {
      alert('Không thể gọi trong cuộc trò chuyện nhóm')
      return
    }

    // Pre-check: prevent double-call
    if (useCallStore.getState().hasActiveCall()) {
      alert('Bạn đang có một cuộc gọi đang diễn ra. Vui lòng kết thúc cuộc gọi hiện tại trước.')
      return
    }

    try {
      // Initialize local stream
      await webrtcService.initLocalStream('audio', false)

      // Set callee info in store — use a temp UUID until BE returns real callId
      const tempCallId = crypto.randomUUID()
      useCallStore.getState().initiateCall({
        callId: tempCallId,
        conversationId: id,
        calleeId: callee.id,
        calleeInfo: callee,
        type: 'audio',
      })

      socketService.initiateCall({
        callId: tempCallId,
        conversationId: id,
        calleeId: callee.id,
        type: 'audio',
      })

      // Join call room so we can receive WebRTC signaling (offer from callee)
      socketService.joinCallRoom(tempCallId)
    } catch (error) {
      console.error('Failed to start call:', error)
      alert(error.message || 'Không thể bắt đầu cuộc gọi')
      webrtcService.cleanup()
      useCallStore.getState().resetCall()
    }
  }

  // Initiate video call
  const handleVideoCall = async () => {
    const callee = getCalleeInfo()
    if (!callee) {
      alert('Không thể gọi video trong cuộc trò chuyện nhóm')
      return
    }

    // Pre-check: prevent double-call
    if (useCallStore.getState().hasActiveCall()) {
      alert('Bạn đang có một cuộc gọi đang diễn ra. Vui lòng kết thúc cuộc gọi hiện tại trước.')
      return
    }

    try {
      // Initialize local stream with video
      await webrtcService.initLocalStream('video', true)

      // Set callee info in store — use a temp UUID until BE returns real callId
      const tempCallId = crypto.randomUUID()
      useCallStore.getState().initiateCall({
        callId: tempCallId,
        conversationId: id,
        calleeId: callee.id,
        calleeInfo: callee,
        type: 'video',
      })

      socketService.initiateCall({
        callId: tempCallId,
        conversationId: id,
        calleeId: callee.id,
        type: 'video',
      })

      // Join call room so we can receive WebRTC signaling (offer from callee)
      socketService.joinCallRoom(tempCallId)
    } catch (error) {
      console.error('Failed to start video call:', error)
      alert(error.message || 'Không thể bắt đầu cuộc gọi video')
      webrtcService.cleanup()
      useCallStore.getState().resetCall()
    }
  }

  // ==================== CALLER WEBRTC SIGNALING ====================
  // Handles call_accepted, offer/answer/ICE from callee and creates peer connection.
  // Only active when caller is in CALLING or RINGING state.
  useEffect(() => {
    console.log(`[FE-CALLER] ★ CALLER_SIGNALING useEffect MOUNTED | socketId=${socketService.socket?.id} | socketConnected=${socketService.socket?.connected}`);

    const handleCallAccepted = async (data) => {
      try {
        console.log(`[FE-CALLER] ★ handleCallAccepted FIRED | data=`, data);
        console.log(`[FE-CALLER]   socketId=${socketService.socket?.id} | socketConnected=${socketService.socket?.connected}`);
        const store = useCallStore.getState();
        const currentState = store.callState;
        const currentCallId = store.currentCallId;
        console.log(`[FE-CALLER]   currentState="${currentState}" | currentCallId=${currentCallId} | peer=${!!webrtcService.peer} | expectedStates=["calling","ringing"]`);
        if (!['calling', 'ringing'].includes(currentState)) {
          console.log(`[FE-CALLER] ✗ SKIPPED: callState="${currentState}" not in ["calling","ringing"]`);
          return;
        }

        const localStream = webrtcService.getLocalStream();
        if (!localStream) {
          console.log(`[FE-CALLER] ✗ IGNORED: no localStream`);
          return;
        }

        const callId = data.callId || store.currentCallId;
        if (!callId) {
          console.log(`[FE-CALLER] ✗ IGNORED: no callId`);
          return;
        }

        const storedCallId = store.currentCallId;
        if (storedCallId && storedCallId !== callId) {
          console.log(`[FE-CALLER] → Leaving temp room call:${storedCallId}, joining call:${callId}`);
          socketService.leaveCallRoom(storedCallId);
          socketService.joinCallRoom(callId);
        }

        console.log(`[FE-CALLER] → Storing callId=${callId}`);
        store.setCallId(callId);

        if (!webrtcService.peer) {
          console.log(`[FE-CALLER] → Creating peer as INITIATOR...`);
          await webrtcService.createPeerAsInitiator(localStream, callId);
          console.log(`[FE-CALLER] → createPeerAsInitiator returned`);
        } else {
          console.log(`[FE-CALLER]   peer already exists, skipping`);
        }
      } catch (error) {
        console.error(`[FE-CALLER] ✗ handleCallAccepted EXCEPTION:`, error.message || error);
      }
    }

    const handleOfferReceived = async (data) => {
      try {
        const ourUserId = useAuthStore.getState().user?.id;
        if (data.from === ourUserId) {
          console.log(`[FE-CALLER] ✗ IGNORED: own offer echoed back from=${data.from} | ourUserId=${ourUserId}`);
          return;
        }

        console.log(`[FE-CALLER] ★ handleOfferReceived (from callee) | data=`, data);
        const store = useCallStore.getState();
        console.log(`[FE-CALLER]   callState=${store.callState} | peer=${!!webrtcService.peer}`);
        if (!['calling', 'ringing', 'connected'].includes(store.callState)) {
          console.log(`[FE-CALLER] ✗ IGNORED: callState not valid`);
          return;
        }

        const localStream = webrtcService.getLocalStream();
        if (!localStream) {
          console.log(`[FE-CALLER] ✗ IGNORED: no localStream`);
          return;
        }

        if (!webrtcService.peer) {
          console.log(`[FE-CALLER] → Creating peer as CALLEE (non-initiator)...`);
          await webrtcService.createPeerAsCallee(localStream, data.callId);
        }
        if (webrtcService.peer && data.offer) {
          console.log(`[FE-CALLER] → Signaling offer to peer...`);
          webrtcService.peer.signal(data.offer);
          console.log(`[FE-CALLER] → peer.signal(offer) called`);
        } else {
          console.log(`[FE-CALLER] ✗ No peer or no offer | peer=${!!webrtcService.peer} | hasOffer=${!!data.offer}`);
        }
      } catch (error) {
        console.error(`[FE-CALLER] ✗ handleOfferReceived EXCEPTION:`, error.message || error);
      }
    }

    const handleAnswerReceived = (data) => {
      console.log(`[FE-CALLER] ★ handleAnswerReceived | data=`, data, ` | peer=${!!webrtcService.peer}
`);
      if (webrtcService.peer) {
        webrtcService.handleSignal(data.answer);
      } else {
        console.log(`[FE-CALLER] ✗ IGNORED: no peer to handle answer`);
      }
    }

    const handleIceCandidateReceived = (data) => {
      console.log(`[FE-CALLER] handleIceCandidateReceived | peer=${!!webrtcService.peer}`, data);
      if (webrtcService.peer) {
        webrtcService.handleSignal(data.candidate);
      } else {
        console.log(`[FE-CALLER] ✗ IGNORED: no peer to handle ICE`);
      }
    }

    const handleCallEnded = () => {
      console.log(`[FE-CALLER] handleCallEnded`);
      webrtcService.cleanup()
      useCallStore.getState().resetCall()
    }
    const handleCallDeclined = () => {
      console.log(`[FE-CALLER] handleCallDeclined`);
      webrtcService.cleanup()
      useCallStore.getState().resetCall()
    }
    const handleCallNoAnswer = () => {
      console.log(`[FE-CALLER] handleCallNoAnswer`);
      webrtcService.cleanup()
      useCallStore.getState().resetCall()
    }
    const handleCallCancelled = () => {
      console.log(`[FE-CALLER] handleCallCancelled`);
      webrtcService.cleanup()
      useCallStore.getState().resetCall()
    }

    socketService.onCallAccepted(handleCallAccepted)
    socketService.onCallOfferReceived(handleOfferReceived)
    socketService.onCallAnswerReceived(handleAnswerReceived)
    socketService.onCallIceCandidateReceived(handleIceCandidateReceived)
    socketService.onCallEnded(handleCallEnded)
    socketService.onCallDeclined(handleCallDeclined)
    socketService.onCallNoAnswer(handleCallNoAnswer)
    socketService.onCallCancelled(handleCallCancelled)

    return () => {
      socketService.offCallAccepted(handleCallAccepted)
      socketService.offCallOfferReceived(handleOfferReceived)
      socketService.offCallAnswerReceived(handleAnswerReceived)
      socketService.offCallIceCandidateReceived(handleIceCandidateReceived)
      socketService.offCallEnded(handleCallEnded)
      socketService.offCallDeclined(handleCallDeclined)
      socketService.offCallNoAnswer(handleCallNoAnswer)
      socketService.offCallCancelled(handleCallCancelled)
    }
  }, [])



  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-4">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <svg
            className="h-10 w-10 lg:h-12 lg:w-12 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-base lg:text-lg font-semibold text-text-primary">
          Không tìm thấy cuộc trò chuyện
        </h3>
        <p className="mt-1 text-xs lg:text-sm text-text-secondary">
          Cuộc trò chuyện này có thể đã bị xóa hoặc không tồn tại
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search overlay */}
      {showSearch && (
        <div className="border-b border-border bg-white p-3 lg:p-4">
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 flex-1">
                <Search className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className="flex-1 bg-transparent border-0 outline-none text-sm lg:text-base placeholder:text-text-secondary/60"
                  autoFocus
                />
              </div>
              <button
                onClick={closeSearch}
                className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
          </div>

          {searchQuery && (
            <div className="mt-2 max-h-48 lg:max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="py-4 text-center text-sm text-text-secondary">Đang tìm kiếm...</div>
              ) : searchResults.length === 0 ? (
                <div className="py-4 text-center text-sm text-text-secondary">
                  Không tìm thấy tin nhắn nào
                </div>
              ) : (
                searchResults.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => goToSearchMessage(msg)}
                    className="flex w-full items-start gap-3 rounded-lg p-2 lg:p-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-secondary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{msg.sender?.displayName}</span>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="truncate text-sm text-text-secondary">{msg.content}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <ConversationHeader
        conversation={conversation}
        onBack={handleBack}
        onPin={loadPinnedDocuments}
        onShowMembers={handleShowMembers}
        onSearch={handleSearch}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
      />

      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={user?.id || ''}
          typingUsers={typingUsers}
          pinnedDocuments={pinnedDocuments}
          isDirect={conversation.type === 'direct'}
          onReply={handleReply}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onDelete={handleDelete}
          onRecall={handleRecall}
        />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        onSendImage={handleSendImage}
        onSendVoice={handleSendVoice}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={isUploading}
      />

      <PinnedDocuments
        isOpen={showPinnedDocs}
        onClose={() => setShowPinnedDocs(false)}
        documents={pinnedDocuments}
        onUnpin={handleUnpin}
        onViewMessage={handleViewMessage}
      />

      <GroupMemberList
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        members={members}
        currentUserId={user?.id || ''}
        onRemoveMember={handleRemoveMember}
        onChangeRole={handleChangeRole}
      />
    </div>
  )
}
