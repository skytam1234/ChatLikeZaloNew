import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi.js'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/common/index.js'
import { ROUTES } from '@/utils/constants.js'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const validateEmail = () => {
    if (!email) {
      setError('Email là bắt buộc')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmail()) return

    setIsLoading(true)
    setError('')

    try {
      await authApi.forgotPassword(email)
      setEmailSent(true)
    } catch (err) {
      // Backend luôn trả về success message để tránh enumeration
      // Nên nếu có lỗi network thì mới hiển thị
      const errorMessage = err?.response?.data?.error || err?.message
      if (errorMessage && !errorMessage.includes('network')) {
        setError(errorMessage)
      } else {
        // Vẫn hiển thị thành công để tránh reveal email tồn tại
        setEmailSent(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4">
        <Card className="relative w-full max-w-[420px] border-0 shadow-xl">
          <CardContent className="px-6 py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-text-primary">
              Kiểm tra email của bạn
            </h2>
            <p className="mb-2 text-sm text-text-secondary">
              Chúng tôi đã gửi link khôi phục mật khẩu đến
            </p>
            <p className="mb-6 font-semibold text-text-primary">{email}</p>
            <p className="mb-8 text-sm text-text-secondary">
              Nhấn vào link trong email để đặt lại mật khẩu. Link sẽ hết hạn sau 1 giờ.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full btn-login"
                size="lg"
              >
                Quay lại đăng nhập
              </Button>
              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                className="w-full text-sm text-text-secondary hover:text-primary"
              >
                Gửi lại email khác
              </button>
            </div>
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
            <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-text-primary">
            Quên mật khẩu?
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Nhập email của bạn để nhận link khôi phục mật khẩu
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={handleChange}
              error={error}
              disabled={isLoading}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold tracking-wide btn-login"
              isLoading={isLoading}
            >
              Gửi link khôi phục
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
