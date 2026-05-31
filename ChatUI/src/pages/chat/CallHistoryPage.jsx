import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/common/index.js'
import { Phone, Video, ArrowLeft, RefreshCw } from 'lucide-react'
import { callApi } from '@/api/callApi.js'
import { useAuthContext } from '@/contexts/index.js'

const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const m = mins % 60
    return `${hrs}:${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const getStatusLabel = (call, currentUserId) => {
  switch (call.status) {
    case 'missed':
      return { text: 'Không trả lời', className: 'text-red-500' }
    case 'declined':
      return { text: 'Từ chối', className: 'text-red-500' }
    case 'ended':
      return { text: 'Kết thúc', className: 'text-gray-500' }
    case 'accepted':
      return { text: 'Đã trả lời', className: 'text-green-500' }
    case 'pending':
      return { text: 'Đang chờ', className: 'text-yellow-500' }
    case 'ringing':
      return { text: 'Đang chuông', className: 'text-yellow-500' }
    default:
      return { text: call.status, className: 'text-gray-500' }
  }
}

export const CallHistoryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 20

  const fetchCalls = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      const params = { page: pageNum, limit: LIMIT }
      if (filter !== 'all') {
        params.filter = filter
      }
      const response = await callApi.getCallHistory(params)
      const newCalls = response.data || []

      if (append) {
        setCalls((prev) => {
          const existingIds = new Set(prev.map((c) => c.id))
          return [...prev, ...newCalls.filter((c) => !existingIds.has(c.id))]
        })
      } else {
        setCalls(newCalls)
      }
      setHasMore(newCalls.length === LIMIT)
    } catch (error) {
      console.error('Failed to fetch call history:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setPage(1)
    fetchCalls(1, false)
  }, [filter])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchCalls(nextPage, true)
    }
  }

  const handleCallAgain = (call) => {
    const otherUserId = call.callerId === user?.id ? call.calleeId : call.callerId
    navigate(`/chat/new?callUserId=${otherUserId}`)
  }

  const getOtherParticipant = (call) => {
    return call.callerId === user?.id ? call.callee : call.caller
  }

  const groupedCalls = {}
  calls.forEach((call) => {
    const date = formatDate(call.startedAt || call.createdAt)
    if (!groupedCalls[date]) groupedCalls[date] = []
    groupedCalls[date].push(call)
  })

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Lịch sử cuộc gọi</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white shrink-0">
        {['all', 'answered', 'missed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'answered' ? 'Đã trả lời' : 'Không trả lời'}
          </button>
        ))}
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto">
        {calls.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Phone className="h-12 w-12 text-text-secondary/30 mb-3" />
            <p className="text-sm text-text-secondary">
              {filter === 'all'
                ? 'Chưa có lịch sử cuộc gọi nào'
                : filter === 'missed'
                ? 'Không có cuộc gọi nhỡ'
                : 'Không có cuộc gọi đã trả lời'}
            </p>
          </div>
        ) : (
          Object.entries(groupedCalls).map(([date, dateCalls]) => (
            <div key={date}>
              <div className="px-4 py-2 bg-gray-50 border-b border-border">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{date}</p>
              </div>
              {dateCalls.map((call) => {
                const otherUser = getOtherParticipant(call)
                const isVideo = call.type === 'video'
                const status = getStatusLabel(call, user?.id)
                const isIncoming = call.calleeId === user?.id

                return (
                  <div
                    key={call.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer border-b border-border/50"
                    onClick={() => handleCallAgain(call)}
                  >
                    {/* Avatar with status ring */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={otherUser?.avatarUrl}
                        name={otherUser?.displayName || otherUser?.username || 'User'}
                        size="md"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                          call.status === 'accepted'
                            ? 'bg-green-500'
                            : call.status === 'missed' || call.status === 'declined'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                      >
                        {isVideo ? (
                          <Video className="h-2.5 w-2.5 text-white" />
                        ) : (
                          <Phone className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {otherUser?.displayName || otherUser?.username || 'Người dùng'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs ${status.className}`}>{status.text}</span>
                        {call.duration > 0 && (
                          <>
                            <span className="text-xs text-text-secondary">·</span>
                            <span className="text-xs text-text-secondary">
                              {formatDuration(call.duration)}
                            </span>
                          </>
                        )}
                        <span className="text-xs text-text-secondary">·</span>
                        <span className="text-xs text-text-secondary">
                          {formatTime(call.startedAt || call.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCallAgain(call)
                      }}
                    >
                      <Phone className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                )
              })}
            </div>
          ))
        )}

        {/* Load more */}
        {hasMore && calls.length > 0 && (
          <div className="flex justify-center py-4">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                'Tải thêm'
              )}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && calls.length === 0 && (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CallHistoryPage
