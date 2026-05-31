import React, { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/index.js'
import { useSettingsStore } from '@/stores/index.js'
import { Avatar } from '@/components/common/index.js'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/index.js'
import { Upload, Camera } from 'lucide-react'
import { cn } from '@/utils/cn.js'

export const ProfileTab = () => {
  const { user, setUser } = useAuthContext()
  const { updateProfile, profileLoading, profileError, uploadAvatar } = useSettingsStore()

  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setPhoneNumber(user.phoneNumber || '')
      setAvatarUrl(user.avatarUrl || '')
    }
  }, [user])

  const validateForm = () => {
    const newErrors = {}
    if (!displayName?.trim()) {
      newErrors.displayName = 'Tên hiển thị là bắt buộc'
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Tên hiển thị phải có ít nhất 2 ký tự'
    }
    if (phoneNumber && !/^[0-9]{10,11}$/.test(phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    let finalAvatarUrl = avatarUrl

    if (avatarFile) {
      setAvatarUploading(true)
      const uploadResult = await uploadAvatar(avatarFile)
      setAvatarUploading(false)

      if (!uploadResult.success) {
        setErrors({ avatar: uploadResult.error || 'Tải ảnh lên thất bại' })
        return
      }

      finalAvatarUrl = uploadResult.url
    }

    const result = await updateProfile({
      displayName: displayName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      avatarUrl: finalAvatarUrl || undefined,
    })

    if (result.success && result.user) {
      setUser(result.user)
      setAvatarFile(null)
      setSuccessMessage('Cập nhật thông tin thành công!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const isGoogleAccount = !!user?.googleId

  return (
    <form onSubmit={handleSave}>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar section */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Avatar
                src={avatarUrl}
                name={displayName || user?.username}
                size="xl"
                className="h-20 w-20 sm:h-24 sm:w-24"
              />
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setAvatarFile(file)
                      const previewUrl = URL.createObjectURL(file)
                      setAvatarUrl(previewUrl)
                    }
                  }}
                />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-medium text-text-primary">Ảnh đại diện</p>
              <p className="mt-1 text-sm text-text-secondary">
                Nhấp vào biểu tượng camera để tải lên ảnh mới
              </p>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-lg bg-success/10 p-3 text-sm text-success font-medium">
              {successMessage}
            </div>
          )}

          {profileError && (
            <div className="rounded-lg bg-error/10 p-3 text-sm text-error">
              {profileError}
            </div>
          )}

          {/* Account type badge */}
          {isGoogleAccount && (
            <div className="rounded-lg bg-warning/10 p-3 text-sm text-warning flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Tài khoản Google — đăng nhập qua Google</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Tên đăng nhập</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="flex h-10 w-full cursor-not-allowed rounded-xl border border-border bg-gray-50 px-4 py-2 text-sm text-text-secondary opacity-60"
            />
            <p className="mt-1 text-xs text-text-secondary">Tên đăng nhập không thể thay đổi</p>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="flex h-10 w-full cursor-not-allowed rounded-xl border border-border bg-gray-50 px-4 py-2 text-sm text-text-secondary opacity-60"
            />
            <p className="mt-1 text-xs text-text-secondary">
              {isGoogleAccount
                ? 'Email được quản lý bởi Google'
                : 'Liên hệ hỗ trợ để thay đổi email'}
            </p>
          </div>

          {/* Display name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Tên hiển thị <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên hiển thị của bạn"
              className={cn(
                'flex h-10 sm:h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm sm:text-base ring-offset-white',
                'placeholder:text-text-secondary placeholder:text-sm sm:placeholder:text-base',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'transition-colors active:border-primary/50',
                errors.displayName ? 'border-error focus-visible:ring-error' : 'border-border'
              )}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs sm:text-sm text-error">{errors.displayName}</p>
            )}
          </div>

          {/* Phone number */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Số điện thoại</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nhập số điện thoại của bạn"
              className={cn(
                'flex h-10 sm:h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm sm:text-base ring-offset-white',
                'placeholder:text-text-secondary placeholder:text-sm sm:placeholder:text-base',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'transition-colors active:border-primary/50',
                errors.phoneNumber ? 'border-error focus-visible:ring-error' : 'border-border'
              )}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-xs sm:text-sm text-error">{errors.phoneNumber}</p>
            )}
          </div>
        </CardContent>

        <div className="flex justify-end p-6 pt-0">
          <Button type="submit" isLoading={profileLoading || avatarUploading} size="lg">
            {avatarUploading ? 'Đang tải ảnh...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </Card>
    </form>
  )
}
