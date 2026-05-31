import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversationStore } from '@/stores/index.js'
import { useAuthStore } from '@/stores/index.js'
import { Badge, Input } from '@/components/common/index.js'
import { ConversationItem } from '@/components/chat/index.js'
import { Search, Users, MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/utils/cn.js'

const tabs = [
  { id: 'all', label: 'Tất cả', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'unread', label: 'Chưa đọc', icon: <Badge variant="error">!</Badge> },
  { id: 'groups', label: 'Nhóm', icon: <Users className="h-4 w-4" /> },
]

export const Sidebar = ({ className, onCloseMobile }) => {
  const navigate = useNavigate()
  const { conversations, fetchConversations, isLoading } = useConversationStore()
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const debouncedSearch = useCallback((value) => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(value)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const cleanup = debouncedSearch(searchInput)
    return cleanup
  }, [searchInput, debouncedSearch])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const filteredConversations = useMemo(() => {
    let filtered = conversations

    if (activeTab === 'unread') {
      filtered = filtered.filter((conv) => (conv.unreadCount ?? 0) > 0 || conv.hasUnreplied)
    } else if (activeTab === 'groups') {
      filtered = filtered.filter((conv) => conv.type === 'group')
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const currentUserId = currentUser?.id

      filtered = filtered.filter((conv) => {
        let displayName = ''

        if (conv.type === 'direct') {
          const otherParticipant = conv.participants?.find(
            (p) => p.id !== currentUserId
          )
          displayName = otherParticipant?.displayName || ''
        } else {
          displayName = conv.name || ''
        }

        return displayName.toLowerCase().includes(query)
      })
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return dateB - dateA
    })
  }, [conversations, activeTab, searchQuery, currentUser])

  const handleConversationClick = (conversation) => {
    navigate(`/chat/${conversation.id}`)
    onCloseMobile?.()
  }

  return (
    <div className={cn('flex flex-col h-full bg-white w-full lg:w-80 shrink-0', className)}>
      {/* Search */}
      <div className="p-3 lg:p-4">
        <div className="relative flex">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary pointer-events-none" />
          
          <Input
            placeholder="     Tìm kiếm..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-15 pr-4 "
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 border-b-2 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-medium transition-colors shrink-0',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 lg:p-8 text-center">
            <MessageSquare className="mb-3 h-10 w-10 lg:h-12 lg:w-12 text-text-secondary/50" />
            <p className="text-sm text-text-secondary">
              {searchQuery
                ? 'Không tìm thấy cuộc trò chuyện'
                : 'Chưa có cuộc trò chuyện nào'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New conversation button */}
      <div className="border-t border-border p-3 lg:p-4 pb-safe">
        <button
          onClick={() => {
            navigate('/chat/new')
            onCloseMobile?.()
          }}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 lg:px-4 py-3 text-sm font-medium text-white transition-colors',
            'hover:bg-primary-dark active:bg-primary-dark/90',
            'touch-manipulation'
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>
    </div>
  )
}
