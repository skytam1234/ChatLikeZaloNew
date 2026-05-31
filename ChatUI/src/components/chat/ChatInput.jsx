import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/utils/cn.js'
import { Smile, Paperclip, Send, X, Image, Mic, AudioWaveform } from 'lucide-react'

export const ChatInput = ({
  onSendMessage,
  onTyping,
  onAttachFile,
  onSendImage,
  onSendVoice,
  replyTo,
  onCancelReply,
  disabled = false,
}) => {
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedUrl, setRecordedUrl] = useState('')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const textareaRef = useRef(null)
  const emojiContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiContainerRef.current && !emojiContainerRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [recordedUrl])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSendMessage(trimmedMessage, 'text', replyTo?.id)
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    onTyping?.()
  }

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleAttachClick = () => fileInputRef.current?.click()
  const handleImageClick = () => imageInputRef.current?.click()

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onAttachFile?.(files)
    }
    e.target.value = ''
  }

  const handleImageChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onSendImage?.(files)
    }
    e.target.value = ''
  }

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      const recorder = new MediaRecorder(stream, { mimeType })

      audioChunksRef.current = []
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setRecordedUrl(url)
        stream.getTracks().forEach((track) => track.stop())
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
      }

      recorder.start(100)
      setIsRecording(true)
      setRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Vui lòng cho phép truy cập micro để ghi âm tin nhắn thoại.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('Không tìm thấy micro. Vui lòng kết nối micro và thử lại.')
      } else {
        console.error('Recording error:', err)
        alert('Không thể bắt đầu ghi âm. Vui lòng thử lại.')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl('')
    setRecordingDuration(0)
    setIsRecording(false)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const handleSendRecording = () => {
    if (!recordedBlob) return
    onSendVoice?.(recordedBlob, recordedBlob.type || 'audio/webm')
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl('')
    setRecordingDuration(0)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
    '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
    '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
    '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
    '❣️', '💕', '💞', '💓', '💝', '💟', '😈', '👍', '👎', '👌',
  ]

  return (
    <div className="border-t border-border bg-white px-3 lg:px-4 pt-2 pb-2 lg:pb-3 pb-safe">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />

      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 p-2 lg:p-3">
          <div className="w-1 self-stretch rounded-full bg-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary truncate">
              Đang trả lời {replyTo.sender?.displayName || 'Người dùng'}
            </p>
            <p className="line-clamp-1 text-xs lg:text-sm text-text-secondary">
              {replyTo.content || 'Tin nhắn đã thu hồi'}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="rounded p-1 hover:bg-gray-200 active:bg-gray-300 touch-manipulation shrink-0"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      )}

      {/* Input row */}
      {recordedUrl ? (
        /* Preview after recording */
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-border px-3 py-2">
          <AudioWaveform className="h-5 w-5 text-primary shrink-0" />
          <audio src={recordedUrl} className="flex-1 h-8" controls />
          <button
            onClick={handleCancelRecording}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
            title="Hủy"
          >
            <X className="h-4 w-4 text-error" />
          </button>
          <button
            onClick={handleSendRecording}
            disabled={disabled}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Gửi"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : isRecording ? (
        /* Recording in progress */
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 animate-pulse shrink-0">
            <Mic className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-600">Đang ghi âm</p>
            <p className="text-xs text-red-500">{formatDuration(recordingDuration)}</p>
          </div>
          <button
            onClick={handleMicClick}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors"
            title="Dừng ghi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Normal input row */
        <div className="flex items-end gap-1 lg:gap-2">
          {/* Attach file */}
          <button
            onClick={handleAttachClick}
            className="shrink-0 flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 touch-manipulation transition-colors"
            title="Đính kèm file"
          >
            <Paperclip className="h-5 w-5 text-text-secondary" />
          </button>

          {/* Send image */}
          <button
            onClick={handleImageClick}
            className="shrink-0 flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 touch-manipulation transition-colors"
            title="Gửi ảnh"
          >
            <Image className="h-5 w-5 text-text-secondary" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin..."
            rows={1}
            disabled={disabled}
            className={cn(
              'min-h-[40px] lg:min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-gray-50 px-3 lg:px-4 py-2 text-sm lg:text-base',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[120px]'
            )}
            style={{ maxHeight: '120px' }}
          />

          {/* Emoji picker */}
          <div ref={emojiContainerRef} className="relative shrink-0">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={cn(
                'flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl transition-colors touch-manipulation',
                showEmoji ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 active:bg-gray-200 text-text-secondary'
              )}
              title="Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>

            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 w-72 lg:w-80 rounded-xl border border-border bg-white p-2 lg:p-3 shadow-xl z-50">
                <div className="grid grid-cols-8 gap-0.5 lg:gap-1">
                  {emojis.map((emoji, i) => (
                    <button
                      key={`emoji-${i}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg p-1 text-lg lg:text-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice recording */}
          <button
            onClick={handleMicClick}
            className="shrink-0 flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 touch-manipulation transition-colors"
            title="Ghi âm thoại"
          >
            <Mic className="h-5 w-5 text-text-secondary" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            className="shrink-0 flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
            title="Gửi tin nhắn"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
