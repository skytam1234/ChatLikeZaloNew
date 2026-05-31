import React, { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/index.js'
import { useSettingsStore } from '@/stores/index.js'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/index.js'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn.js'

export const PasswordTab = () => {
  const { user } = useAuthContext()
  const { changePassword, passwordLoading, passwordError } = useSettingsStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const isGoogleAccount = !!user?.googleId

  useEffect(() => {
    if (passwordError) {
      setErrors({ general: passwordError })
    }
  }, [passwordError])

  const validateForm = () => {
    const newErrors = {}

    if (!currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại là bắt buộc'
    }

    if (!newPassword) {
      newErrors.newPassword = 'Mật khẩu mới là bắt buộc'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc'
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const result = await changePassword(currentPassword, newPassword)
    if (result.success) {
      setSuccessMessage('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  if (isGoogleAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>Thay đổi mật khẩu để bảo vệ tài khoản</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-warning/10 p-4 text-sm text-warning flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Không thể đổi mật khẩu</p>
              <p className="mt-1 text-warning/80">
                Tài khoản này được đăng nhập qua Google. Mật khẩu được quản lý bởi Google.
                Để bảo mật tài khoản, vui lòng thay đổi mật khẩu Google của bạn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>
            Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {successMessage && (
            <div className="rounded-lg bg-success/10 p-3 text-sm text-success font-medium">
              {successMessage}
            </div>
          )}

          {errors.general && (
            <div className="rounded-lg bg-error/10 p-3 text-sm text-error flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Current password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className={cn(
                  'flex h-10 sm:h-11 w-full rounded-xl border bg-white px-4 py-2 pr-11 text-sm sm:text-base ring-offset-white',
                  'placeholder:text-text-secondary placeholder:text-sm sm:placeholder:text-base',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'transition-colors active:border-primary/50',
                  errors.currentPassword ? 'border-error focus-visible:ring-error' : 'border-border'
                )}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary touch-manipulation"
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs sm:text-sm text-error">{errors.currentPassword}</p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className={cn(
                  'flex h-10 sm:h-11 w-full rounded-xl border bg-white px-4 py-2 pr-11 text-sm sm:text-base ring-offset-white',
                  'placeholder:text-text-secondary placeholder:text-sm sm:placeholder:text-base',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'transition-colors active:border-primary/50',
                  errors.newPassword ? 'border-error focus-visible:ring-error' : 'border-border'
                )}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary touch-manipulation"
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs sm:text-sm text-error">{errors.newPassword}</p>
            )}
            {/* Password strength indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[4, 8, 12].map((len) => (
                    <div
                      key={len}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        newPassword.length >= len ? 'bg-success' : 'bg-gray-200'
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {newPassword.length < 4
                    ? 'Yếu'
                    : newPassword.length < 8
                    ? 'Trung bình'
                    : 'Mạnh'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={cn(
                  'flex h-10 sm:h-11 w-full rounded-xl border bg-white px-4 py-2 pr-11 text-sm sm:text-base ring-offset-white',
                  'placeholder:text-text-secondary placeholder:text-sm sm:placeholder:text-base',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'transition-colors active:border-primary/50',
                  errors.confirmPassword ? 'border-error focus-visible:ring-error' : 'border-border'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary touch-manipulation"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs sm:text-sm text-error">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>

        <div className="flex justify-end p-6 pt-0">
          <Button type="submit" isLoading={passwordLoading} size="lg">
            Đổi mật khẩu
          </Button>
        </div>
      </Card>
    </form>
  )
}
