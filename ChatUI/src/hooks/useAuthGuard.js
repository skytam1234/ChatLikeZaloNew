import { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/index.js'
import { ROUTES } from '@/utils/constants.js'
import { storage } from '@/utils/storage.js'
import { tokenService } from '@/utils/tokenService.js'

/**
 * @param {{ requiredAuth?: boolean, onSessionExpired?: () => void, onTokenExpiringSoon?: () => void }} options
 */
export const useAuthGuard = (options = {}) => {
  const { requiredAuth = true, onSessionExpired, onTokenExpiringSoon } = options
  const { isAuthenticated, isSessionExpired, refreshSession } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionExpired = urlParams.get('session')

    if (sessionExpired === 'expired') {
      onSessionExpired?.()
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location.pathname, onSessionExpired])

  useEffect(() => {
    const checkTokenExpiry = () => {
      const accessToken = storage.get('ACCESS_TOKEN')

      if (!accessToken) {
        if (requiredAuth && !isAuthenticated) {
          navigate(ROUTES.LOGIN, { replace: true })
        }
        return
      }

      if (tokenService.isTokenExpiringSoon(accessToken)) {
        onTokenExpiringSoon?.()
      }
    }

    const intervalId = setInterval(checkTokenExpiry, 60000)
    checkTokenExpiry()

    return () => clearInterval(intervalId)
  }, [navigate, isAuthenticated, requiredAuth, onTokenExpiringSoon])

  const attemptTokenRefresh = useCallback(async () => {
    if (!isSessionExpired) {
      const success = await refreshSession()
      return success
    }
    return false
  }, [isSessionExpired, refreshSession])

  return {
    isAuthenticated,
    isSessionExpired,
    attemptTokenRefresh,
  }
}

export const useSessionManager = () => {
  const { isAuthenticated, refreshSession, setSessionExpired } = useAuthStore()

  const refreshTokenIfNeeded = useCallback(async () => {
    if (!isAuthenticated) return false

    const accessToken = storage.get('ACCESS_TOKEN')
    if (!accessToken) return false

    if (tokenService.isTokenExpiringSoon(accessToken)) {
      return await refreshSession()
    }

    return true
  }, [isAuthenticated, refreshSession])

  const forceLogout = useCallback(() => {
    setSessionExpired(true)
    storage.clear()
    window.location.href = `${ROUTES.LOGIN}?session=expired`
  }, [setSessionExpired])

  return {
    refreshTokenIfNeeded,
    forceLogout,
  }
}
