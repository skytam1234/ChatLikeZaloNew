import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/index.js'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/common/index.js'
import { ROUTES } from '@/utils/constants.js'
import { Eye, EyeOff, MessageCircle, AlertCircle } from 'lucide-react'
import { googleAuthApi } from '@/api/googleAuthApi.js'

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const session = urlParams.get('session')
    if (session === 'expired') {
      setSessionExpired(true)
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location.pathname])

  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Email là bắt buộc'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await login(email, password)
      const from = location.state?.from?.pathname
      navigate(from || ROUTES.CHAT)
    } catch {
      // Error handled by context
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4 overflow-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-[420px] border-0 shadow-xl">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary">
            <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-text-primary">
            Chào mừng bạn!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Đăng nhập để tiếp tục với ChatUI
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {sessionExpired && (
              <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isLoading}
            />

            <div className="relative">
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-secondary hover:text-text-primary touch-manipulation"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-text-secondary">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm font-medium text-primary hover:underline touch-manipulation"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold tracking-wide btn-login"
              isLoading={isLoading}
            >
              Đăng nhập
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-gray-200" />
              <span className="absolute bg-white px-3 text-xs text-text-secondary">
                hoặc
              </span>
            </div>

            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full font-semibold tracking-wide gap-2"
              onClick={() => googleAuthApi.login()}
              disabled={isLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Đăng nhập với Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center px-4 sm:px-6 pb-6 sm:pb-8">
          <p className="text-sm text-text-secondary">
            Chưa có tài khoản?{' '}
            <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
