import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/index.js'
import { SessionExpiredModal } from '@/components/common/index.js'
import { storage } from '@/utils/storage.js'
import { ROUTES } from '@/utils/constants.js'
import { tokenService } from '@/utils/tokenService.js'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    isSessionExpired,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    clearError: storeClearError,
    checkAuth,
    refreshSession,
    setLoading,
    setUser,
  } = useAuthStore()
  const [_showExpiredModal, setShowExpiredModal] = useState(false)
  const refreshTimerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Auth pages (login/register) - don't auto check auth
  const isAuthPage = [ROUTES.LOGIN, ROUTES.REGISTER].includes(location.pathname)

  useEffect(() => {
    // Only check auth if NOT on auth pages
    if (!isAuthPage) {
      checkAuth()
    } else {
      // On auth pages, ensure isLoading is false so routes render
      setLoading(false)
    }
  }, [checkAuth, isAuthPage, setLoading])

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }

    if (isAuthenticated) {
      const scheduleRefresh = () => {
        const accessToken = storage.get('ACCESS_TOKEN')
        if (!accessToken) return

        const timeUntilExpiry = tokenService.getTimeUntilExpiration(accessToken)
        if (timeUntilExpiry === null) return

        const refreshTime = Math.max(timeUntilExpiry - 300000, 0)

        refreshTimerRef.current = setTimeout(async () => {
          const success = await refreshSession()
          if (!success) {
            setShowExpiredModal(true)
          }
        }, refreshTime)
      }

      scheduleRefresh()
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [isAuthenticated, refreshSession])

  const login = useCallback(async (email, password) => {
    await storeLogin({ email, password })
  }, [storeLogin])

  const register = useCallback(async (username, email, password, displayName) => {
    await storeRegister({ username, email, password, displayName })
  }, [storeRegister])

  const logout = useCallback(async () => {
    await storeLogout()
  }, [storeLogout])

  const clearError = useCallback(() => {
    storeClearError()
  }, [storeClearError])

  const handleTokenRefresh = useCallback(async () => {
    const success = await refreshSession()
    if (!success) {
      setShowExpiredModal(true)
    }
  }, [refreshSession])

  const handleLoginRedirect = useCallback(() => {
    const currentPath = location.pathname
    const from = location.state?.from?.pathname
    navigate(ROUTES.LOGIN, {
      state: { from: from || currentPath },
      replace: true,
    })
  }, [navigate, location])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        isSessionExpired,
        login,
        register,
        logout,
        clearError,
        handleTokenRefresh,
        setUser,
      }}
    >
      {children}
      <SessionExpiredModal
        onLogin={handleLoginRedirect}
        onDismiss={() => {
          setShowExpiredModal(false)
          logout()
        }}
      />
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
