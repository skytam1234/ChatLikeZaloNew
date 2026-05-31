import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi.js'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/common/index.js'
import { ROUTES } from '@/utils/constants.js'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Link khôi phục không hợp lệ hoặc đã hết hạn')
    }
  }, [token])

  const validateForm = () => {
    const newErrors = {}

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!token) return

    setIsLoading(true)
    setError('')

    try {
      await authApi.resetPassword(token, password)
      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Link khôi phục không hợp lệ hoặc đã hết hạn'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field) => (e) => {
    const value = e.target.value
    if (field === 'password') setPassword(value)
    else setConfirmPassword(value)

    // Clear error when typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4">
        <Card className="relative w-full max-w-[420px] border-0 shadow-xl">
          <CardContent className="px-6 py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-text-primary">
              Đặt lại mật khẩu thành công
            </h2>
            <p className="mb-8 text-sm text-text-secondary">
              Mật khẩu của bạn đã được đặt lại. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
            </p>
            <Button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full btn-login"
              size="lg"
            >
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-[420px] border-0 shadow-xl">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary">
            <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-text-primary">
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Nhập mật khẩu mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4">
          {error && !token && (
            <div className="mb-4 rounded-lg bg-error/10 p-4 text-sm text-error flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Link không hợp lệ</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {error && token && (
            <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Mật khẩu mới"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={handleChange('password')}
                error={errors.password}
                disabled={isLoading || !token}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-secondary hover:text-text-primary touch-manipulation"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Xác nhận mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={errors.confirmPassword}
                disabled={isLoading || !token}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-text-secondary hover:text-text-primary touch-manipulation"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Password requirements */}
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-text-secondary">Mật khẩu phải có:</p>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-success' : ''}`}>
                  <span className={password.length >= 8 ? 'text-success' : 'text-gray-400'}>✓</span>
                  Ít nhất 8 ký tự
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold tracking-wide btn-login"
              isLoading={isLoading}
              disabled={!token}
            >
              Đặt lại mật khẩu
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center px-4 sm:px-6 pb-6 sm:pb-8">
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
