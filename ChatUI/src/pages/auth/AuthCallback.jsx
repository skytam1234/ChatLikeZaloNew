import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/index.js'
import { ROUTES } from '@/utils/constants.js'
import { Spinner } from '@/components/common/index.js'

/**
 * Handles the OAuth callback from the backend.
 * Receives { tokens, user } as a base64url-encoded token in the URL query param,
 * stores them, and redirects to the chat page.
 */
export const AuthCallback = () => {
  const navigate = useNavigate()
  const hasProcessed = useRef(false)
  const { setAuth } = useAuthStore()

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const error = params.get('error')

        if (error || !token) {
          navigate(`${ROUTES.LOGIN}?error=google_auth_failed`, { replace: true })
          return
        }

        // Decode the base64url payload (must use TextDecoder for proper UTF-8 handling)
        let payload
        try {
          const binaryString = atob(token)
          const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0))
          const decoder = new TextDecoder('utf-8')
          payload = JSON.parse(decoder.decode(bytes))
        } catch {
          navigate(`${ROUTES.LOGIN}?error=invalid_token`, { replace: true })
          return
        }

        const { tokens, user } = payload

        if (!tokens?.accessToken || !user) {
          navigate(`${ROUTES.LOGIN}?error=invalid_token`, { replace: true })
          return
        }

        // Store tokens and user in auth store
        setAuth(tokens.accessToken, tokens.refreshToken, user)

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)

        // Navigate to chat
        navigate(ROUTES.CHAT, { replace: true })
      } catch (err) {
        navigate(`${ROUTES.LOGIN}?error=google_auth_failed`, { replace: true })
      }
    }

    processCallback()
  }, [navigate, setAuth])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-text-secondary">Đang đăng nhập...</p>
      </div>
    </div>
  )
}
