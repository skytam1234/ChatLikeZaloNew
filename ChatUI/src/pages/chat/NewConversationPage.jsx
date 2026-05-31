import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/index.js'
import { useConversationStore } from '@/stores/index.js'
import { conversationApi, userApi } from '@/api/index.js'
import { Button, Avatar } from '@/components/common/index.js'
import { Search, Users, X, ArrowLeft } from 'lucide-react'

export const NewConversationPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { fetchConversations, addConversation } = useConversationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState([])

  const handleSearch = React.useCallback(async (query) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const response = await userApi.searchUsers(query)
      const filtered = (response.data || []).filter((u) => u.id !== user?.id)
      setSearchResults(filtered)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [user?.id])

  const handleStartDirectChat = async (targetUser) => {
    setIsCreating(true)
    try {
      const response = await conversationApi.createConversation({
        type: 'direct',
        targetUserId: targetUser.id,
      })
      const newConversation = response.data
      addConversation(newConversation)
      navigate(`/chat/${newConversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0) return
    setIsCreating(true)
    try {
      const response = await conversationApi.createConversation({
        type: 'group',
        name: groupName.trim(),
        participantIds: groupMembers.map((m) => m.id),
      })
      const newConversation = response.data
      addConversation(newConversation)
      navigate(`/chat/${newConversation.id}`)
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const addToGroup = (u) => {
    if (!groupMembers.find((m) => m.id === u.id)) {
      setGroupMembers([...groupMembers, u])
      setSearchResults(searchResults.filter((r) => r.id !== u.id))
      setSearchQuery('')
    }
  }

  const removeFromGroup = (u) => {
    setGroupMembers(groupMembers.filter((m) => m.id !== u.id))
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-border px-3 sm:px-4 py-3">
        <button
          onClick={() => navigate('/chat')}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-text-primary flex-1">
          {showGroupForm ? 'Tạo nhóm chat' : 'Cuộc trò chuyện mới'}
        </h2>
        {showGroupForm && (
          <button
            onClick={() => {
              setShowGroupForm(false)
              setGroupName('')
              setGroupMembers([])
            }}
            className="text-sm text-primary hover:underline touch-manipulation"
          >
            Hủy
          </button>
        )}
      </div>

      {/* Tab: Direct / Group */}
      {!showGroupForm && (
        <div className="flex gap-2 border-b border-border px-3 sm:px-4 py-2 sm:py-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGroupForm(true)}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden xs:inline">Tạo nhóm</span>
            <span className="xs:hidden">Nhóm</span>
          </Button>
        </div>
      )}

      {/* Search input */}
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-gray-50 px-10 py-2.5 sm:py-2 text-sm sm:text-base text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-safe">
          <p className="px-2 py-1.5 text-xs font-medium uppercase text-text-secondary">
            Kết quả tìm kiếm
          </p>
          {searchResults.map((u) => (
            <button
              key={u.id}
              onClick={() =>
                showGroupForm ? addToGroup(u) : handleStartDirectChat(u)
              }
              disabled={isCreating}
              className="flex w-full items-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5 sm:py-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 touch-manipulation"
            >
              <Avatar
                name={u.displayName || u.username}
                avatarUrl={u.avatarUrl}
                size="md"
                showOnline
                isOnline={u.isOnline}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">
                  {u.displayName || u.username}
                </p>
                {u.email && (
                  <p className="truncate text-xs text-text-secondary hidden sm:block">
                    {u.email}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
          <p className="text-sm sm:text-base text-text-secondary">
            Không tìm thấy người dùng nào
          </p>
        </div>
      )}

      {/* Group form */}
      {showGroupForm && (
        <div className="flex flex-1 flex-col px-3 sm:px-4 py-3">
          <input
            type="text"
            placeholder="Tên nhóm chat"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border bg-gray-50 px-3 py-2.5 sm:py-2 text-sm sm:text-base text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* Selected members */}
          {groupMembers.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {groupMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs sm:text-sm font-medium text-primary"
                >
                  {m.displayName || m.username}
                  <button
                    onClick={() => removeFromGroup(m)}
                    className="ml-0.5 hover:text-primary-dark touch-manipulation"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Show member count hint */}
          {groupMembers.length === 0 && (
            <p className="mb-3 text-xs sm:text-sm text-text-secondary">
              Tìm và chọn thành viên để thêm vào nhóm
            </p>
          )}

          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || groupMembers.length === 0}
            className="mt-auto w-full text-sm sm:text-base"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
          </Button>
        </div>
      )}

      {/* Empty state when not searching */}
      {!showGroupForm && searchQuery.length < 2 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
          <p className="text-sm sm:text-base text-text-secondary">
            Tìm kiếm người dùng để bắt đầu cuộc trò chuyện
          </p>
        </div>
      )}
    </div>
  )
}
