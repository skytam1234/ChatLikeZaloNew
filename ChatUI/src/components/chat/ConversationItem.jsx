import React from 'react'
import { cn } from '@/utils/cn.js'
import { Avatar, Badge } from '@/components/common/index.js'
import { formatConversationTime, getMessagePreview } from '@/utils/helpers.js'
import { Pin } from 'lucide-react'
import { useAuthContext } from '@/contexts/index.js'

export const ConversationItem = ({
  conversation,
  isActive = false,
  onClick,
}) => {
  const { user } = useAuthContext()

  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Nhóm chat'
    }

    const otherUser = conversation.participants?.find(
      (p) => p.id !== user?.id
    )
    return otherUser?.displayName || otherUser?.username || 'Người dùng'
  }

  const getAvatarUrl = () => {
    if (conversation.type === 'group') {
      return conversation.avatarUrl
    }
    const otherUser = conversation.participants?.find(
      (p) => p.id !== user?.id
    )
    return otherUser?.avatarUrl
  }

  const getStatus = () => {
    if (conversation.type === 'group') return undefined
    const otherUser = conversation.participants?.find(
      (p) => p.id !== user?.id
    )
    return otherUser?.isOnline ? 'online' : 'offline'
  }

  const name = getConversationName()
  const avatarUrl = getAvatarUrl()
  const status = getStatus()
  const lastMessage = conversation.lastMessage
  const unreadCount = conversation.unreadCount || 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-3 lg:px-4 py-3 text-left transition-colors hover:bg-gray-50',
        isActive && 'bg-primary/5',
        conversation.isPinned && 'bg-amber-50/50'
      )}
    >
      <div className="relative">
        <Avatar
          src={avatarUrl}
          name={name}
          size="lg"
          status={status}
        />
        {conversation.isPinned && (
          <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-0.5">
            <Pin className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium text-text-primary">
            {name}
          </h3>
          <span className="ml-2 shrink-0 text-xs text-text-secondary">
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="line-clamp-1 text-sm text-text-secondary">
            {getMessagePreview(lastMessage || { content: 'Chưa có tin nhắn', messageType: 'text' })}
          </p>

          <div className="ml-2 flex shrink-0 items-center gap-1">
            {conversation.hasUnreplied && (
              <Badge variant="warning" className="text-[10px]">
                Chưa trả lời
              </Badge>
            )}
            {unreadCount > 0 && (
              <Badge variant="default" className="min-w-[20px] justify-center rounded-full bg-primary px-1.5 text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        {conversation.type === 'group' && (
          <p className="mt-0.5 text-xs text-text-secondary">
            {conversation.participants?.length || 0} thành viên
          </p>
        )}
      </div>
    </button>
  )
}
