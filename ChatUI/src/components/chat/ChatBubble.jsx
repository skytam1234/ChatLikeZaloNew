import React, { useState, useRef } from 'react'
import { cn } from '@/utils/cn.js'
import { Avatar } from '@/components/common/index.js'
import { formatMessageTime } from '@/utils/helpers.js'
import { Check, CheckCheck, FileX2, FileText, Film, Mic } from 'lucide-react'
import { AudioPlayer } from './AudioPlayer.jsx'
import { API_URL } from '@/utils/constants.js'

const getMetadata = (message) => {
  if (!message.metadata) return {}
  if (typeof message.metadata === 'string') {
    try {
      return JSON.parse(message.metadata)
    } catch {
      return {}
    }
  }
  return message.metadata
}

  const getMediaUrl = (message) => {
    const meta = getMetadata(message)
    const content = message.content
    let url = meta.url

    if (!url && content && content.startsWith('http') && (content.includes('.jpg') || content.includes('.png') || content.includes('.gif') || content.includes('.mp4') || content.includes('.webp'))) {
      url = content
    }
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const getDownloadUrl = (message) => {
    const meta = getMetadata(message)
    let filename = meta?.filename || getFileName()
    
    // Extract category from path if available
    const path = meta?.path || ''
    const pathParts = path.split('/')
    const category = pathParts.length > 1 ? pathParts[0] : 'attachments'
    
    // Build download URL: /api/upload/:category/:filename/download
    return `${API_URL}/api/upload/${category}/${filename}/download`
  }

export const ChatBubble = ({
  message,
  isOwn,
  sender,
  showAvatar = true,
  isPinned = false,
  isDirect = false,
  showTime = true,
  onReply,
  onPin,
  onUnpin,
  onDelete,
  onRecall,
  onReplyClick,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [fileMissing, setFileMissing] = useState(false)
  const [imageError, setImageError] = useState(false)
  const pressTimerRef = useRef(null)
  const bubbleRef = useRef(null)

  const meta = getMetadata(message)

  const getFileName = () => {
    return meta?.originalName || meta?.filename || `download_${message.id}`
  }

  const getFileSize = () => {
    if (meta?.size) {
      const bytes = Number(meta.size)
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    }
    return ''
  }

  const isDownloadable = () => {
    if (message.isRecalled || message.isDeleted) return false
    return ['image', 'file', 'video', 'audio'].includes(message.messageType)
  }

  const getReplyPreviewContent = (replyMsg) => {
    if (!replyMsg) return null
    if (replyMsg.isRecalled) return <span className="italic">Tin nhắn đã thu hồi</span>
    if (replyMsg.isDeleted) return <span className="italic">Tin nhắn đã xóa</span>

    switch (replyMsg.messageType) {
      case 'image': {
        const src = getMediaUrl(replyMsg)
        return src ? (
          <div className="flex items-center gap-2">
            <img className="w-8 h-8 rounded object-cover shrink-0" src={src} alt="reply" />
            <span className="text-xs">Đã gửi một ảnh</span>
          </div>
        ) : (
          <span>📷 Đã gửi một ảnh</span>
        )
      }
      case 'file': {
        const meta = getMetadata(replyMsg)
        const filename = meta?.originalName || meta?.filename || 'Tệp đính kèm'
        return (
          <div className="flex items-center gap-2">
            <FileX2 className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs">{filename}</span>
          </div>
        )
      }
      case 'video': {
        const src = getMediaUrl(replyMsg)
        return src ? (
          <div className="flex items-center gap-2">
            <video
              src={src}
              className="w-8 h-8 rounded object-cover shrink-0"
              muted
              preload="metadata"
            />
            <span className="text-xs">Đã gửi một video</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 shrink-0" />
            <span className="text-xs">Đã gửi một video</span>
          </div>
        )
      }
      case 'audio': {
        const src = getMediaUrl(replyMsg)
        return (
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 shrink-0" />
            <span className="text-xs">Đã gửi một tin nhắn thoại</span>
          </div>
        )
      }
      case 'sticker': return <span>{replyMsg.content || '💬 Đã gửi một nhãn dán'}</span>
      case 'system': return <span>{replyMsg.content || ''}</span>
      default: return <span className="line-clamp-1">{replyMsg.content || ''}</span>
    }
  }

  const replyHeaderTextColor = isOwn ? 'text-white/80' : 'text-primary'
  const replyBorderColor = isOwn ? 'border-white/30' : 'border-gray-300'

  const renderReplyHeader = (replyMsg) => {
    return (
      <div className="mb-1.5 pl-1 pr-2">
        <div className={`flex items-start gap-1.5 text-xs ${replyHeaderTextColor}`}>
          <div className={`w-0.5 min-h-[20px] self-stretch rounded-full shrink-0 ${replyBorderColor}`} />
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-[11px] leading-tight ${replyHeaderTextColor}`}>
              {replyMsg.senderName || replyMsg.sender?.displayName || 'Người dùng'}
            </p>
            <div className={`mt-0.5 leading-tight ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
              {getReplyPreviewContent(replyMsg)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleDownload = async () => {
    const url = getMediaUrl(message)
    const downloadUrl = getDownloadUrl(message)
    let filename = getFileName()

    if (!url) return

    try {
      // Try to get the actual filename from URL if metadata doesn't have it
      if (filename.startsWith('download_')) {
        const urlParts = url.split('/')
        const urlFilename = urlParts[urlParts.length - 1]?.split('?')[0]
        if (urlFilename && urlFilename.includes('.')) {
          filename = urlFilename
        }
      }

      // Use showSaveFilePicker to let user choose where to save
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
        })
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
          },
        })
        if (!response.ok) throw new Error('Download failed')
        const blob = await response.blob()
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        // Fallback: download directly with anchor
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      handleCloseMenu()
    } catch (err) {
      // User cancelled the picker or error occurred
      if (err.name !== 'AbortError') {
        console.error('Download failed:', err)
      }
      handleCloseMenu()
    }
  }

  const renderContent = () => {
    if (message.isRecalled) {
      return <span className="italic text-text-secondary text-sm lg:text-base">Tin nhắn đã được thu hồi</span>
    }
    if (message.isDeleted) {
      return <span className="italic text-text-secondary text-sm lg:text-base">Tin nhắn đã bị xóa</span>
    }

    const renderDeletedFile = () => (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-xl min-w-[120px]',
        isOwn ? 'bg-white/10' : 'bg-gray-200/60'
      )}>
        <FileX2 className={cn('w-5 h-5 shrink-0', isOwn ? 'text-white/70' : 'text-text-secondary')} />
        <span className={cn('text-xs italic', isOwn ? 'text-white/70' : 'text-text-secondary')}>
          Tài liệu đã xóa
        </span>
      </div>
    )

    switch (message.messageType) {
      case 'image': {
        if (fileMissing || imageError) return renderDeletedFile()
        const src = getMediaUrl(message)
        return (
          <img
            src={src}
            alt="Hình ảnh"
            className="max-w-[220px] sm:max-w-[260px] lg:max-w-[300px] rounded-xl border border-gray-200/40 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(src, '_blank')}
            onError={() => {
              setImageError(true)
            }}
            loading="lazy"
          />
        )
      }
      case 'file': {
        if (fileMissing) return renderDeletedFile()
        const href = getMediaUrl(message)
        return (
          <a
            href={href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 lg:gap-3 rounded-xl p-2 lg:p-3 transition-colors max-w-[240px] sm:max-w-[280px]',
              isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-200/80 hover:bg-gray-200'
            )}
            onClick={(e) => { if (!href) e.preventDefault() }}
          >
            <span className="text-xl lg:text-2xl shrink-0">📎</span>
            <div className="min-w-0 flex-1">
              <p className={cn('font-medium truncate max-w-[140px] sm:max-w-[180px] lg:max-w-[200px]', isOwn ? 'text-white' : 'text-text-primary text-sm lg:text-base')}>
                {getFileName()}
              </p>
              {getFileSize() && (
                <p className={cn('text-xs', isOwn ? 'text-white/70' : 'text-text-secondary')}>
                  {getFileSize()}
                </p>
              )}
            </div>
          </a>
        )
      }
      case 'video': {
        if (fileMissing) return renderDeletedFile()
        const src = getMediaUrl(message)
        return (
          <video
            src={src}
            controls
            className="max-w-[220px] sm:max-w-[260px] lg:max-w-[300px] rounded-xl"
            onError={() => setImageError(true)}
          />
        )
      }
      case 'audio': {
        if (fileMissing) return renderDeletedFile()
        const src = getMediaUrl(message)
        return (
          <AudioPlayer src={src} duration={meta?.duration} isOwn={isOwn} onError={() => setFileMissing(true)} />
        )
      }
      case 'sticker':
        return <span className="text-3xl lg:text-4xl">{message.content}</span>
      default:
        return <p className="whitespace-pre-wrap text-sm lg:text-base leading-relaxed">{message.content}</p>
    }
  }

  const renderStatus = () => {
    if (!isOwn) return null
    const status = message.status
    return (
      <span className="ml-1 flex items-center">
        {status === 'seen' ? (
          <CheckCheck className="h-3.5 w-3.5 text-primary" />
        ) : status === 'delivered' ? (
          <CheckCheck className="h-3.5 w-3.5 text-text-secondary" />
        ) : (
          <Check className="h-3.5 w-3.5 text-text-secondary" />
        )}
      </span>
    )
  }

  // Long press handlers (like Zalo)
  const calculateMenuPosition = () => {
    if (!bubbleRef.current) return { top: 0, left: 0 }

    const rect = bubbleRef.current.getBoundingClientRect()
    const menuWidth = 200
    const menuHeight = 250

    let top = rect.bottom + 8
    let left = isOwn ? rect.right - menuWidth : rect.left

    if (left < 8) left = 8
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8
    }

    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 8
    }

    return { top, left }
  }

  const handleShowMenu = () => {
    const pos = calculateMenuPosition()
    setMenuPosition(pos)
    setShowMenu(true)
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    pressTimerRef.current = setTimeout(() => {
      handleShowMenu()
    }, 500)
  }

  const handleMouseUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const handleMouseLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const handleTouchStart = (e) => {
    pressTimerRef.current = setTimeout(() => {
      handleShowMenu()
      e.preventDefault()
    }, 500)
  }

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    handleShowMenu()
  }

  const handleCloseMenu = () => {
    setShowMenu(false)
  }

  const handleAction = (action) => {
    action()
    handleCloseMenu()
  }

  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs lg:text-sm text-text-secondary">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <>
      <div
        ref={bubbleRef}
        className={cn(
          'group relative flex gap-1.5 lg:gap-2 px-2 lg:px-4 py-0.5 select-none',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {!isOwn && showAvatar && (
          <Avatar
            src={sender?.avatarUrl}
            name={sender?.displayName || sender?.username}
            size="sm"
            className="self-end shrink-0 w-7 h-7 lg:w-8 lg:h-8"
          />
        )}
        {!isOwn && !showAvatar && <div className="w-7 lg:w-8 shrink-0" />}

        <div className={cn('max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]', isOwn && 'items-end')}>
          <div
            className={cn(
              'rounded-2xl px-3 lg:px-4 py-2',
              isOwn ? 'rounded-tr-sm bg-primary text-white' : 'rounded-tl-sm bg-gray-100 text-text-primary'
            )}
          >
            {message.replyTo && (
              <div
                className="mb-1.5 cursor-pointer"
                onClick={() => onReplyClick?.(message.replyTo.id)}
              >
                {renderReplyHeader(message.replyTo)}
              </div>
            )}
            {renderContent()}
          </div>

          <div
            className={cn(
              'mt-0.5 lg:mt-1 flex items-center gap-1 text-[10px] lg:text-xs text-text-secondary',
              isOwn && 'justify-end'
            )}
          >
            {showTime && (
              <>
                <span>{formatMessageTime(message.createdAt)}</span>
                {message.isEdited && <span className="hidden lg:inline">(đã sửa)</span>}
                {renderStatus()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Menu - Zalo style */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseMenu}
          />
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[200px]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {onReply && (
              <button
                onClick={() => handleAction(() => onReply(message))}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Trả lời
              </button>
            )}

            {isPinned ? (
              <button
                onClick={() => handleAction(() => onUnpin?.(message))}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Bỏ ghim
              </button>
            ) : onPin && (
              <button
                onClick={() => handleAction(() => onPin(message))}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Ghim tin nhắn
              </button>
            )}

            {/* Sao chép - chỉ hiện cho tin nhắn text */}
            {message.messageType === 'text' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content || '')
                  handleCloseMenu()
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Sao chép
              </button>
            )}

            {/* Tải xuống - chỉ hiện cho file/image/video/audio */}
            {isDownloadable() && (
              <button
                onClick={handleDownload}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải xuống
              </button>
            )}

            {isOwn && onRecall && !message.isRecalled && (
              <button
                onClick={() => handleAction(() => onRecall(message))}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-warning hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Thu hồi
              </button>
            )}

            {isOwn && onDelete && !message.isRecalled && (
              <button
                onClick={() => handleAction(() => onDelete(message))}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-error hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
