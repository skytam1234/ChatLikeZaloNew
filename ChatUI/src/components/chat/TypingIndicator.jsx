import React from 'react'
import { Avatar } from '@/components/common/index.js'

export const TypingIndicator = ({ users }) => {
  if (users.length === 0) return null

  const getText = () => {
    if (users.length === 1) {
      return `${users[0].username} đang nhắn...`
    }
    if (users.length === 2) {
      return `${users[0].username} và ${users[1].username} đang nhắn...`
    }
    return `${users[0].username} và ${users.length - 1} người khác đang nhắn...`
  }

  return (
    <div className="flex items-center gap-2 px-2 sm:px-4">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar
            key={user.userId}
            name={user.username}
            size="sm"
            className="ring-2 ring-white w-6 h-6 sm:w-8 sm:h-8"
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs sm:text-sm text-text-secondary truncate max-w-[150px] sm:max-w-none">
          {getText()}
        </span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
