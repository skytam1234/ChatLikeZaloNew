import { useAuthContext } from '@/contexts/index.js'
import { useCallback, useEffect, useRef } from 'react'
import { tokenService } from '@/utils/tokenService.js'
import { storage } from '@/utils/storage.js'

const TOKEN_EXPIRY_BUFFER = 300000 // 5 minutes before expiry

export const useAuth = () => {
  const context = useAuthContext()
  const refreshTimerRef = useRef(null)

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    const accessToken = storage.get('ACCESS_TOKEN')
    if (!accessToken) return

    const timeUntilExpiry = tokenService.getTimeUntilExpiration(accessToken)
    if (timeUntilExpiry === null) return

    const refreshTime = Math.max(timeUntilExpiry - TOKEN_EXPIRY_BUFFER, 0)

    refreshTimerRef.current = setTimeout(() => {
      context.handleTokenRefresh?.()
    }, refreshTime)
  }, [context])

  useEffect(() => {
    if (context.isAuthenticated) {
      scheduleTokenRefresh()
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [context.isAuthenticated, scheduleTokenRefresh])

  return {
    ...context,
    scheduleTokenRefresh,
  }
}

export const useTokenChecker = () => {
  const accessToken = storage.get('ACCESS_TOKEN')
  const refreshToken = storage.get('REFRESH_TOKEN')

  return {
    isAccessTokenValid: accessToken ? !tokenService.isTokenExpired(accessToken) : false,
    isAccessTokenExpiringSoon: accessToken ? tokenService.isTokenExpiringSoon(accessToken) : false,
    isRefreshTokenValid: refreshToken ? !tokenService.isTokenExpired(refreshToken) : false,
    accessTokenExpiration: accessToken ? tokenService.getTokenExpirationDate(accessToken) : null,
    refreshTokenExpiration: refreshToken ? tokenService.getTokenExpirationDate(refreshToken) : null,
  }
}
