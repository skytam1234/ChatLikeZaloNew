import React, { useEffect, useRef, useMemo } from 'react'
import { ChatBubble } from './ChatBubble.jsx'
import { TypingIndicator } from './TypingIndicator.jsx'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'

export const MessageList = ({
  messages,
  currentUserId,
  typingUsers,
  pinnedDocuments = [],
  isDirect = false,
  onReply,
  onPin,
  onUnpin,
  onDelete,
  onRecall,
  isLoading = false,
}) => {
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateA - dateB
    })
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages.length])

  const groupMessagesByDate = (msgs) => {
    const groups = new Map()
    msgs.forEach((msg) => {
      const date = format(parseISO(msg.createdAt), 'yyyy-MM-dd')
      const existing = groups.get(date) || []
      groups.set(date, [...existing, msg])
    })
    return groups
  }

  const formatDateHeader = (dateStr) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Hôm nay'
    if (isYesterday(date)) return 'Hôm qua'
    return format(date, "EEEE, dd 'tháng' M yyyy", { locale: vi })
  }

  const shouldShowAvatar = (message, messages, isDirect) => {
    if (isDirect && !isOwnMessage(message, currentUserId)) return false
    const currentIndex = messages.findIndex((m) => m.id === message.id)
    if (currentIndex <= 0) return true
    const prevMessage = messages[currentIndex - 1]
    if (prevMessage.sender?.id !== message.sender?.id) return true
    const timeDiff =
      parseISO(message.createdAt).getTime() - parseISO(prevMessage.createdAt).getTime()
    return timeDiff > 60000
  }

  const isOwnMessage = (message, userId) => message.sender?.id === userId

  const groupedMessages = groupMessagesByDate(sortedMessages)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-4">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <svg
            className="h-10 w-10 lg:h-12 lg:w-12 text-primary"
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
          Bắt đầu cuộc trò chuyện
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Gửi tin nhắn để bắt đầu cuộc trò chuyện
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full flex-col overflow-y-auto p-2 lg:p-4 custom-scrollbar"
    >
      {Array.from(groupedMessages.entries()).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex items-center justify-center py-2 lg:py-4">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs lg:text-sm font-medium text-text-secondary">
              {formatDateHeader(date)}
            </span>
          </div>

          {dateMessages.map((message, index) => {
            const isPinned = pinnedDocuments.some((doc) => doc.message?.id === message.id)
            const isLastInGroup = index === dateMessages.length - 1
            return (
              <div key={message.id} id={`message-${message.id}`}>
                <ChatBubble
                  message={message}
                  isOwn={message.sender?.id === currentUserId}
                  sender={message.sender}
                  showAvatar={shouldShowAvatar(message, dateMessages, isDirect)}
                  isPinned={isPinned}
                  isDirect={isDirect}
                  showTime={isLastInGroup}
                  onReply={onReply}
                  onPin={onPin}
                  onUnpin={onUnpin}
                  onDelete={onDelete}
                  onRecall={onRecall}
                />
              </div>
            )
          })}
        </div>
      ))}

      {typingUsers.length > 0 && (
        <div className="mt-2">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
