import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/index.js'
import { useConversationStore } from '@/stores/index.js'
import { conversationApi } from '@/api/index.js'
import { Button, Modal, Avatar } from '@/components/common/index.js'
import { Users, MessageCircle } from 'lucide-react'

export const ChatLayout = ({ onOpenSidebar: _onOpenSidebar }) => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { conversations, fetchConversations } = useConversationStore()
  const [showNewChat, setShowNewChat] = useState(false)

  React.useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleCreateConversation = async (type) => {
    if (type === 'direct') {
      navigate('/chat/new')
      setShowNewChat(false)
      return
    }
    try {
      const response = await conversationApi.createConversation({
        type: 'group',
        participantIds: [],
      })
      navigate(`/chat/${response.data.id}`)
      setShowNewChat(false)
      fetchConversations()
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-4 lg:p-8">
      <div className="mb-6 lg:mb-8 text-center max-w-md mx-auto w-full px-4">
        <div className="mx-auto mb-4 flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-2xl bg-primary">
          <MessageCircle className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
          Chào, {user?.displayName || user?.username}!
        </h1>
        <p className="mt-2 text-sm lg:text-base text-text-secondary px-2">
          Chọn một cuộc trò chuyện để bắt đầu nhắn tin
        </p>
      </div>

      <div className="mb-4 lg:mb-6 flex gap-3 lg:gap-4">
        <Button
          onClick={() => setShowNewChat(true)}
          className="gap-2 text-sm lg:text-base px-4 lg:px-6"
        >
          <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
          <span className="hidden xs:inline">Cuộc trò chuyện mới</span>
          <span className="xs:hidden">Mới</span>
        </Button>
      </div>

      {/* Recent conversations on mobile */}
      {conversations.length > 0 && (
        <div className="w-full max-w-md px-4 lg:hidden">
          <p className="mb-2 text-sm font-medium text-text-secondary px-2">
            Gần đây
          </p>
          <div className="space-y-2">
            {conversations.slice(0, 3).map((conv) => {
              const otherUser = conv.type === 'direct'
                ? conv.participants?.find((p) => p.id !== user?.id)
                : null
              const name = conv.type === 'group'
                ? conv.name
                : otherUser?.displayName || otherUser?.username || 'Người dùng'

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 text-left hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  <Avatar
                    name={name}
                    src={otherUser?.avatarUrl || conv.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{name}</p>
                    <p className="truncate text-xs text-text-secondary">
                      {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {conversations.length === 0 && (
        <div className="text-center px-4">
          <p className="text-sm lg:text-base text-text-secondary">
            Bạn chưa có cuộc trò chuyện nào
          </p>
          <p className="mt-1 text-xs lg:text-sm text-text-secondary">
            Bắt đầu bằng cách tạo cuộc trò chuyện mới
          </p>
        </div>
      )}

      <Modal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        title="Tạo cuộc trò chuyện mới"
        size="md"
      >
        <div className="space-y-3 lg:space-y-4 ">
          <Button
            onClick={() => handleCreateConversation('direct')}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <Avatar name={user?.displayName || ''} size="md" />
            <div className="text-left">
              <p className="font-medium">Nhắn tin cá nhân</p>
              <p className="text-xs text-text-secondary hidden sm:block">
                Trò chuyện riêng tư với một người
              </p>
            </div>
          </Button>

          <Button
            onClick={() => handleCreateConversation('group')}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">Tạo nhóm chat</p>
              <p className="text-xs text-text-secondary hidden sm:block">
                Trò chuyện với nhiều người
              </p>
            </div>
          </Button>
        </div>
      </Modal>
    </div>
  )
}
