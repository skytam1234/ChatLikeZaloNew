import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/index.js'
import { Modal } from './Modal.jsx'
import { Button } from './Button.jsx'
import { AlertTriangle } from 'lucide-react'

export const SessionExpiredModal = ({ onLogin, onDismiss }) => {
  const { isSessionExpired, setSessionExpired } = useAuthStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isSessionExpired) {
      setIsVisible(true)
    }
  }, [isSessionExpired])

  const handleLogin = () => {
    setIsVisible(false)
    setSessionExpired(false)
    onLogin()
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setSessionExpired(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <Modal
      isOpen={isVisible}
      onClose={handleDismiss}
      title=""
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center p-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
          <AlertTriangle className="h-7 w-7 text-warning" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          Phiên đăng nhập đã hết hạn
        </h3>

        <p className="mb-6 text-sm text-text-secondary">
          Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng ứng dụng.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleLogin}
            className="w-full"
          >
            Đăng nhập lại
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full"
          >
            Hủy
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export const useSessionExpired = () => {
  const { isSessionExpired, setSessionExpired } = useAuthStore()

  const showSessionExpired = () => {
    setSessionExpired(true)
  }

  const hideSessionExpired = () => {
    setSessionExpired(false)
  }

  return {
    isSessionExpired,
    showSessionExpired,
    hideSessionExpired,
  }
}
