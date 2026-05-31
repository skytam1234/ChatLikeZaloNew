import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/utils/cn.js'

const WAVEFORM_BARS = 30

const generateWaveformHeights = (duration, progress) => {
  const heights = []
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    const seed = Math.sin(i * 0.5 + (duration || 0)) * 10000
    const random = seed - Math.floor(seed)
    const baseHeight = 20 + random * 60
    const position = i / WAVEFORM_BARS
    const isPlayed = position <= progress
    heights.push({ height: baseHeight, isPlayed, position })
  }
  return heights
}

const isValidDuration = (seconds) => {
  return typeof seconds === 'number' && !isNaN(seconds) && isFinite(seconds) && seconds > 0
}

const formatTime = (seconds) => {
  if (!isValidDuration(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const AudioPlayer = ({ src, duration: propDuration, isOwn, onError }) => {
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(() => {
    return isValidDuration(propDuration) ? propDuration : 0
  })
  const [hasError, setHasError] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateDuration = () => {
      if (isValidDuration(audio.duration)) {
        setTotalDuration(audio.duration)
        setIsReady(true)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = () => {
      setHasError(true)
      onError?.()
    }

    const handleCanPlay = () => {
      updateDuration()
    }

    const handleLoadedMetadata = () => {
      updateDuration()
    }

    const handleDurationChange = () => {
      updateDuration()
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    if (audio.readyState >= 1) {
      updateDuration()
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [propDuration, src])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || hasError) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {
        setHasError(true)
        onError?.()
      })
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, hasError, onError])

  const handleProgressClick = useCallback((e) => {
    const audio = audioRef.current
    const progressBar = progressRef.current
    if (!audio || !progressBar || hasError || !isValidDuration(totalDuration)) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * totalDuration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }, [totalDuration, hasError])

  const progress = isValidDuration(totalDuration) ? currentTime / totalDuration : 0
  const waveformData = generateWaveformHeights(totalDuration, progress)

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 sm:p-3 rounded-2xl min-w-[120px]',
          isOwn
            ? 'bg-white/10'
            : 'bg-gray-200/60'
        )}
      >
        <svg
          className={cn('w-5 h-5 shrink-0', isOwn ? 'text-white/70' : 'text-text-secondary')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 8v4m-4 4h8" />
        </svg>
        <span className={cn('text-xs italic', isOwn ? 'text-white/70' : 'text-text-secondary')}>
          Tài liệu đã xóa
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl min-w-[200px] sm:min-w-[240px]',
        isOwn
          ? 'bg-gradient-to-r from-primary to-blue-500'
          : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={cn(
          'flex items-center justify-center rounded-full transition-all active:scale-90',
          isOwn
            ? 'w-9 h-9 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 text-white'
            : 'w-9 h-9 sm:w-10 sm:h-10 bg-primary hover:bg-primary-dark text-white'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        ) : (
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1 sm:gap-1.5">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-6 sm:h-8 flex items-center gap-[2px] cursor-pointer select-none"
        >
          {waveformData.map((bar, index) => (
            <div
              key={index}
              className={cn(
                'w-1 rounded-full transition-all duration-150',
                bar.isPlayed
                  ? isOwn
                    ? 'bg-white'
                    : 'bg-primary'
                  : isOwn
                    ? 'bg-white/40'
                    : 'bg-blue-300'
              )}
              style={{
                height: `${bar.height}%`,
                minHeight: '4px',
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-[10px] sm:text-xs font-medium tabular-nums',
              isOwn ? 'text-white/90' : 'text-text-secondary'
            )}
          >
            {formatTime(currentTime)}
          </span>
          <span
            className={cn(
              'text-[10px] sm:text-xs tabular-nums',
              isOwn ? 'text-white/80' : 'text-text-secondary'
            )}
          >
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  )
}
