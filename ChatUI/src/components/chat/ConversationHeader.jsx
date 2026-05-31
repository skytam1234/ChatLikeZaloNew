import React from 'react'
import { cn } from '@/utils/cn.js'
import { Avatar, Button } from '@/components/common/index.js'
import { ArrowLeft, MoreVertical, Pin, Users, Search, Phone, Video } from 'lucide-react'
import { useAuthContext } from '@/contexts/index.js'

export const ConversationHeader = ({
  conversation,
  onBack,
  onPin,
  onShowMembers,
  onSearch,
  onCall,
  onVideoCall,
}) => {
  const { user } = useAuthContext()
  const [showMenu, setShowMenu] = React.useState(false)

  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Nhóm chat'
    }
    const otherUser = conversation.participants?.find((p) => p.id !== user?.id)
    return otherUser?.displayName || otherUser?.username || 'Người dùng'
  }

  const getAvatarUrl = () => {
    if (conversation.type === 'group') return conversation.avatarUrl
    const otherUser = conversation.participants?.find((p) => p.id !== user?.id)
    return otherUser?.avatarUrl
  }

  const getStatus = () => {
    if (conversation.type === 'group') return undefined
    const otherUser = conversation.participants?.find((p) => p.id !== user?.id)
    return otherUser?.isOnline ? 'online' : 'offline'
  }

  const getStatusText = () => {
    if (conversation.type === 'group') {
      return `${conversation.participants?.length || 0} thành viên`
    }
    const otherUser = conversation.participants?.find((p) => p.id !== user?.id)
    if (otherUser?.isOnline) return 'Đang hoạt động'
    return 'Offline'
  }

  const name = getConversationName()
  const avatarUrl = getAvatarUrl()
  const status = getStatus()
  const statusText = getStatusText()

  return (
    <div className="flex h-14 lg:h-16 items-center justify-between border-b border-border bg-white px-3 lg:px-4 shrink-0">
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 lg:h-10 lg:w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar
          src={avatarUrl}
          name={name}
          size="md"
          className="shrink-0"
          status={status}
        />

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-text-primary text-sm lg:text-base">
            {name}
          </h2>
          <p className="hidden lg:block text-xs text-text-secondary truncate">
            {statusText}
          </p>
          <p className="lg:hidden text-xs text-text-secondary truncate">
            {conversation.type === 'group'
              ? `${conversation.participants?.length || 0} thành viên`
              : statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 lg:gap-1">
        <Button variant="ghost" size="icon" onClick={onSearch} title="Tìm kiếm" className="h-9 w-9 lg:h-10 lg:w-10">
          <Search className="h-4 w-4 lg:h-5 lg:w-5 text-text-secondary" />
        </Button>

        {conversation.type === 'group' && (
          <Button variant="ghost" size="icon" onClick={onShowMembers} title="Thành viên" className="h-9 w-9 lg:h-10 lg:w-10">
            <Users className="h-4 w-4 lg:h-5 lg:w-5 text-text-secondary" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => { onPin?.(); setShowMenu(false) }}
          title="Ghim"
          className="h-9 w-9 lg:h-10 lg:w-10"
        >
          <Pin className={cn('h-4 w-4 lg:h-5 lg:w-5', conversation.isPinned ? 'text-primary' : 'text-text-secondary')} />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu((v) => !v)}
            className="h-9 w-9 lg:h-10 lg:w-10"
          >
            <MoreVertical className="h-4 w-4 lg:h-5 lg:w-5 text-text-secondary" />
          </Button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 lg:w-56 rounded-xl border border-border bg-white py-2 shadow-xl animate-scaleIn">
                {conversation.type === 'direct' && (
                  <>
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={() => { onCall?.(); setShowMenu(false) }}
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      Gọi điện
                    </button>
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={() => { onVideoCall?.(); setShowMenu(false) }}
                    >
                      <Video className="h-4 w-4 text-primary" />
                      Video call
                    </button>
                    <div className="my-1 border-t border-border" />
                  </>
                )}
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => { onPin?.(); setShowMenu(false) }}
                >
                  <Pin className="h-4 w-4" />
                  {conversation.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
