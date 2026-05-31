import { STORAGE_KEYS } from './constants.js'

/**
 * @typedef {'ACCESS_TOKEN'|'REFRESH_TOKEN'|'USER'} StorageKey
 */

/**
 * LocalStorage utility with error handling
 */
export const storage = {
  /**
   * Get string value from storage
   * @param {StorageKey} key
   * @returns {string|null}
   */
  get: (key) => {
    try {
      return localStorage.getItem(STORAGE_KEYS[key])
    } catch {
      return null
    }
  },

  /**
   * Set string value to storage
   * @param {StorageKey} key
   * @param {string} value
   */
  set: (key, value) => {
    try {
      localStorage.setItem(STORAGE_KEYS[key], value)
    } catch {
      console.error('Failed to save to localStorage')
    }
  },

  /**
   * Remove value from storage
   * @param {StorageKey} key
   */
  remove: (key) => {
    try {
      localStorage.removeItem(STORAGE_KEYS[key])
    } catch {
      console.error('Failed to remove from localStorage')
    }
  },

  /**
   * Clear all storage keys
   */
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch {
      console.error('Failed to clear localStorage')
    }
  },

  /**
   * Get object from storage
   * @param {StorageKey} key
   * @returns {any|null}
   */
  getObject: (key) => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS[key])
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  /**
   * Set object to storage
   * @param {StorageKey} key
   * @param {any} value
   */
  setObject: (key, value) => {
    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
    } catch {
      console.error('Failed to save object to localStorage')
    }
  },
}
