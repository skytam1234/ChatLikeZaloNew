import { useCallback, useRef } from 'react'
import { authApi } from '@/api/index.js'
import { storage } from '@/utils/storage.js'
import { tokenService } from '@/utils/tokenService.js'

/** @type {Array<{resolve: (token: string) => void, reject: (error: Error) => void}>} */
const refreshSubscribers = []

const addSubscriber = (callback) => {
  refreshSubscribers.push(callback)
}

const notifySubscribers = (token, error) => {
  refreshSubscribers.forEach(callback => {
    if (error) {
      callback.reject(error)
    } else if (token) {
      callback.resolve(token)
    }
  })
  refreshSubscribers.length = 0
}

export const useTokenRefresh = () => {
  const refreshInProgressRef = useRef(false)

  const refreshToken = useCallback(async () => {
    const currentRefreshToken = storage.get('REFRESH_TOKEN')

    if (!currentRefreshToken) {
      throw new Error('No refresh token available')
    }

    if (tokenService.isTokenExpired(currentRefreshToken)) {
      throw new Error('Refresh token has expired')
    }

    if (refreshInProgressRef.current) {
      return new Promise((resolve, reject) => {
        addSubscriber({ resolve, reject })
      })
    }

    refreshInProgressRef.current = true

    try {
      const response = await authApi.refreshToken(currentRefreshToken)
      const { accessToken, refreshToken: newRefreshToken } = response.data

      storage.set('ACCESS_TOKEN', accessToken)
      storage.set('REFRESH_TOKEN', newRefreshToken)

      notifySubscribers(accessToken, null)
      return accessToken
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Token refresh failed')
      notifySubscribers(null, err)
      storage.clear()
      throw err
    } finally {
      refreshInProgressRef.current = false
    }
  }, [])

  const refreshTokenSilently = useCallback(async () => {
    try {
      return await refreshToken()
    } catch {
      return null
    }
  }, [refreshToken])

  const onTokenRefreshError = useCallback((_callback) => {
    const unsubscribe = () => {
      // Cleanup function if needed
    }
    return unsubscribe
  }, [])

  return {
    refreshToken,
    refreshTokenSilently,
    isRefreshing: refreshInProgressRef.current,
    onTokenRefreshError,
  }
}

export const getNewAccessToken = async () => {
  const currentRefreshToken = storage.get('REFRESH_TOKEN')

  if (!currentRefreshToken) {
    return null
  }

  if (tokenService.isTokenExpired(currentRefreshToken)) {
    return null
  }

  // Use a simpler approach without module-level isRefreshing
  if (refreshSubscribers.length > 0) {
    return new Promise((resolve, reject) => {
      addSubscriber({ resolve, reject })
    })
  }

  try {
    const response = await authApi.refreshToken(currentRefreshToken)
    const { accessToken, refreshToken: newRefreshToken } = response.data

    storage.set('ACCESS_TOKEN', accessToken)
    storage.set('REFRESH_TOKEN', newRefreshToken)

    notifySubscribers(accessToken, null)
    return accessToken
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Token refresh failed')
    notifySubscribers(null, err)
    storage.clear()
    throw err
  }
}
