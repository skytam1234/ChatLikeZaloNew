import React, { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn.js'
import { Avatar } from '@/components/common/index.js'
import { Phone, PhoneOff, Video } from 'lucide-react'

/**
 * IncomingCallModal - Shows when receiving a call
 */
export const IncomingCallModal = ({
  isOpen,
  caller,
  callType,
  onAccept,
  onDecline,
}) => {
  const audioRef = useRef(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    if (isOpen && !isPlayingRef.current) {
      try {
        audioRef.current = new Audio('/tiengChuong.mp3')
        audioRef.current.loop = true
        audioRef.current.volume = 0.8
        isPlayingRef.current = true
        audioRef.current.play().catch(() => {
          isPlayingRef.current = false
        })
      } catch {
        isPlayingRef.current = false
      }
    }

    return () => {
      // Stop and release audio when modal unmounts (accept, decline, or external accept)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
        isPlayingRef.current = false
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const isVideoCall = callType === 'video'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header gradient */}
        <div
          className={cn(
            'h-48 flex flex-col items-center justify-center',
            isVideoCall ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
          )}
        >
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full border-2 border-white/10 animate-ping" />
            <div className="absolute w-48 h-48 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute w-32 h-32 rounded-full border-2 border-white/30 animate-ping" style={{ animationDelay: '1s' }} />
          </div>

          {/* Avatar */}
          <div className="relative z-10">
            <Avatar
              src={caller?.avatarUrl}
              name={caller?.displayName || 'Unknown'}
              size="xl"
              className="w-24 h-24 border-4 border-white shadow-lg"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {isVideoCall ? (
                <>
                  <Video className="w-3 h-3" />
                  Video call
                </>
              ) : (
                <>
                  <Phone className="w-3 h-3" />
                  Audio call
                </>
              )}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-text-primary mb-1">
            {caller?.displayName || 'Người dùng'}
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            đang gọi cho bạn...
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Decline button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onDecline}
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer z-10 relative"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="mt-2 text-xs text-text-secondary font-medium">Từ chối</span>
            </div>

            {/* Accept button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onAccept}
                className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer z-10 relative"
              >
                {isVideoCall ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </button>
              <span className="mt-2 text-xs text-text-secondary font-medium">Trả lời</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal
