import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Format message time to HH:mm or date string
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatMessageTime = (dateString) => {
  const date = parseISO(dateString)

  if (isToday(date)) {
    return format(date, 'HH:mm')
  }

  if (isYesterday(date)) {
    return 'Hôm qua'
  }

  const now = new Date()
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'dd/MM HH:mm')
  }

  return format(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Format full time with Vietnamese locale
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatFullTime = (dateString) => {
  const date = parseISO(dateString)
  return format(date, "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })
}

/**
 * Format relative time from now
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatRelativeTime = (dateString) => {
  const date = parseISO(dateString)
  return formatDistanceToNow(date, { addSuffix: true, locale: vi })
}

/**
 * Format conversation time for list display
 * @param {string|null} dateString - ISO date string
 * @returns {string}
 */
export const formatConversationTime = (dateString) => {
  if (!dateString) return ''

  const date = parseISO(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins}p`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}ngày`
  return format(date, 'dd/MM')
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Generate avatar color from id
 * @param {string} id - User or conversation id
 * @returns {string}
 */
export const generateAvatarColor = (id) => {
  if (!id) return '#9CA3AF'
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  ]
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

/**
 * Get message preview text
 * @param {{ content: string|null, messageType: string }} message - Message object
 * @returns {string}
 */
export const getMessagePreview = (message) => {
  if (message.messageType === 'image') return '📷 Đã gửi một ảnh'
  if (message.messageType === 'file') return '📎 Đã gửi một tệp'
  if (message.messageType === 'video') return '🎬 Đã gửi một video'
  if (message.messageType === 'audio') return '🎤 Đã gửi một tin nhắn thoại'
  if (message.messageType === 'sticker') return '💬 Đã gửi một nhãn dán'
  if (message.messageType === 'system') return message.content || ''
  return message.content || ''
}

/**
 * Check if two dates are the same day
 * @param {string} date1 - ISO date string
 * @param {string} date2 - ISO date string
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  const d1 = parseISO(date1)
  const d2 = parseISO(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Group messages by date
 * @param {Array<{createdAt: string}>} messages - Array of messages
 * @returns {Map<string, any[]>}
 */
export const groupMessagesByDate = (messages) => {
  const groups = new Map()

  messages.forEach(message => {
    const date = format(parseISO(message.createdAt), 'yyyy-MM-dd')
    const existing = groups.get(date) || []
    groups.set(date, [...existing, message])
  })

  return groups
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
