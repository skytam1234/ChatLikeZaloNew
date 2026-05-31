/**
 * @typedef {Object} TokenPayload
 * @property {string} [userId]
 * @property {string} [email]
 * @property {string} [username]
 * @property {string[]} [roles]
 * @property {number} [iat]
 * @property {number} [exp]
 * @property {string} [type]
 * @property {any} [key]
 */

/**
 * Decode base64url string
 * @param {string} str
 * @returns {string}
 */
const base64UrlDecode = (str) => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
  const decoded = atob(base64 + padding)
  return decodeURIComponent(
    decoded
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

export const tokenService = {
  /**
   * Decode JWT token
   * @param {string} token
   * @returns {TokenPayload|null}
   */
  decodeToken: (token) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const payload = parts[1]
      const decoded = base64UrlDecode(payload)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  },

  /**
   * Check if token is expired
   * @param {string} token
   * @returns {boolean}
   */
  isTokenExpired: (token) => {
    const payload = tokenService.decodeToken(token)
    if (!payload || !payload.exp) {
      return true
    }
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  },

  /**
   * Check if token is expiring soon
   * @param {string} token
   * @param {number} bufferSeconds
   * @returns {boolean}
   */
  isTokenExpiringSoon: (token, bufferSeconds = 300) => {
    const payload = tokenService.decodeToken(token)
    if (!payload || !payload.exp) {
      return true
    }
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < (now + bufferSeconds)
  },

  /**
   * Get token expiration date
   * @param {string} token
   * @returns {Date|null}
   */
  getTokenExpirationDate: (token) => {
    const payload = tokenService.decodeToken(token)
    if (!payload || !payload.exp) {
      return null
    }
    return new Date(payload.exp * 1000)
  },

  /**
   * Get time until token expiration
   * @param {string} token
   * @returns {number|null}
   */
  getTimeUntilExpiration: (token) => {
    const payload = tokenService.decodeToken(token)
    if (!payload || !payload.exp) {
      return null
    }
    const now = Math.floor(Date.now() / 1000)
    return (payload.exp - now) * 1000
  },
}
