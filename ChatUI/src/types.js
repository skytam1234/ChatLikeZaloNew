/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} displayName
 * @property {string|null} avatarUrl
 * @property {string|null} phoneNumber
 * @property {'online'|'offline'|'away'|'busy'} status
 * @property {string} lastSeenAt
 * @property {boolean} isActive
 * @property {boolean} isVerified
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {string} displayName
 */

/**
 * @typedef {Object} AuthResponse
 * @property {User} user
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} userId
 * @property {string} token
 * @property {string|null} refreshToken
 * @property {Record<string, unknown>} deviceInfo
 * @property {string|null} ipAddress
 * @property {string|null} userAgent
 * @property {string} expiresAt
 * @property {string|null} refreshExpiresAt
 * @property {boolean} isActive
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ConversationUser
 * @property {string} id
 * @property {string} conversationId
 * @property {string} userId
 * @property {string|null} nickname
 * @property {'owner'|'admin'|'member'} role
 * @property {string} joinedAt
 * @property {string|null} leftAt
 * @property {boolean} isMuted
 * @property {boolean} isPinned
 * @property {'all'|'mentions'|'none'} notifications
 * @property {boolean} customNotification
 * @property {User} [user]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {'direct'|'group'} type
 * @property {string|null} name
 * @property {string|null} avatarUrl
 * @property {string|null} description
 * @property {string} createdBy
 * @property {string|null} lastMessageId
 * @property {string|null} lastMessageAt
 * @property {boolean} isArchived
 * @property {boolean} isPinned
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {ConversationUser[]} [users]
 * @property {Message|null} [lastMessage]
 * @property {number} [unreadCount]
 * @property {boolean} [hasUnreplied]
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} conversationId
 * @property {string} senderId
 * @property {string|null} content
 * @property {'text'|'image'|'file'|'video'|'audio'|'sticker'|'system'} messageType
 * @property {Record<string, unknown>} metadata
 * @property {string|null} replyToId
 * @property {string|null} forwardedFromId
 * @property {boolean} isEdited
 * @property {boolean} isDeleted
 * @property {boolean} isRecalled
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {User} [sender]
 * @property {Message} [replyTo]
 * @property {MessageStatus[]} [statuses]
 */

/**
 * @typedef {Object} MessageStatus
 * @property {string} id
 * @property {string} messageId
 * @property {string} userId
 * @property {'sent'|'delivered'|'seen'} status
 * @property {string|null} seenAt
 * @property {string|null} deliveredAt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} TypingUser
 * @property {string} userId
 * @property {string} username
 * @property {number} startedAt
 */

/**
 * @typedef {Object} PinnedDocument
 * @property {string} id
 * @property {string} conversationId
 * @property {string} messageId
 * @property {string} pinnedBy
 * @property {string|null} title
 * @property {string|null} description
 * @property {string} pinnedAt
 * @property {number} pinOrder
 * @property {Message} [message]
 * @property {User} [pinnedByUser]
 */

/**
 * @typedef {Object} GroupMember
 * @property {string} id
 * @property {string} conversationId
 * @property {string} userId
 * @property {'owner'|'admin'|'member'} role
 * @property {string|null} nickname
 * @property {string} joinedAt
 * @property {string|null} invitedBy
 * @property {boolean} isActive
 * @property {User} [user]
 */

export {}
