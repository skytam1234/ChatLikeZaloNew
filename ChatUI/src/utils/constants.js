const VITE_API_URL = import.meta.env.VITE_API_URL
const VITE_SOCKET_URL = import.meta.env.VITE_SOCKET_URL

const DEV_API = 'http://localhost:3000'
const DEV_SOCKET = 'http://localhost:3000'

export const API_URL = VITE_API_URL || DEV_API
export const SOCKET_URL = VITE_SOCKET_URL || DEV_SOCKET

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  USER: 'USER',
}

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CHAT: '/chat',
  CHAT_ID: '/chat/:id',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  CALL_HISTORY: '/call-history',
  NOT_FOUND: '*',
}

export const SOCKET_EVENTS = {
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MARK_SEEN: 'mark_seen',
  MARK_DELIVERED: 'mark_delivered',
  NEW_MESSAGE: 'new_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_SEEN: 'message_seen',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
}

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  VIDEO: 'video',
  AUDIO: 'audio',
  STICKER: 'sticker',
  SYSTEM: 'system',
}

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  SEEN: 'seen',
}

export const CONVERSATION_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group',
}

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy',
}

export const TYPING_TIMEOUT = 3000
export const TYPING_DEBOUNCE = 500
