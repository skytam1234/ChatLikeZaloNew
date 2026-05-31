import React, { forwardRef, useState } from 'react'
import { cn } from '@/utils/cn.js'
import { getInitials, generateAvatarColor } from '@/utils/helpers.js'
import { API_URL } from '@/utils/constants.js'

const isRelativeUrl = (url) => url?.startsWith('/') && !url.startsWith('//')
const resolveUrl = (url) => {
  if (isRelativeUrl(url)) return `${API_URL}${url}`
  return url
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const statusSizeClasses = {
  sm: 'h-2.5 w-2.5 border',
  md: 'h-3 w-3 border-2',
  lg: 'h-3.5 w-3.5 border-2',
  xl: 'h-4 w-4 border-2',
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-gray-400',
  away: 'bg-warning',
  busy: 'bg-error',
}

const Avatar = forwardRef(({
  className,
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  avatarUrl,
  showOnline,
  isOnline,
  ...props
}, ref) => {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name || alt)
  const bgColor = generateAvatarColor(name || alt)
  const imageSrc = src || avatarUrl
  const resolvedSrc = imageSrc && !imgError ? resolveUrl(imageSrc) : null

  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt || name}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusSizeClasses[size],
            isOnline ? statusColors.online : statusColors.offline
          )}
        />
      )}
    </div>
  )
})
Avatar.displayName = 'Avatar'

export { Avatar }
