import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/index.js'
import { ROUTES } from '@/utils/constants.js'
import { Avatar } from '@/components/common/index.js'
import { Bell, Settings, LogOut, MessageCircle, Menu, UserCog, Shield, Phone } from 'lucide-react'
import { cn } from '@/utils/cn.js'

export const Header = ({ onMenuClick, className }) => {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-border bg-white px-3 lg:px-4 shrink-0',
        className
      )}
    >
      {/* Left: hamburger menu (mobile) + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5 text-text-secondary" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary hidden sm:block">ChatUI</span>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-1 lg:gap-2">
        <button className="relative rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200 touch-manipulation">
          <Bell className="h-5 w-5 text-text-secondary" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
        </button>

        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200 touch-manipulation hidden sm:block"
          aria-label="Quản lý thông tin"
        >
          <Settings className="h-5 w-5 text-text-secondary" />
        </button>

        {/* User avatar / dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          >
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || user?.username}
              size="sm"
              status={user?.status === 'online' ? 'online' : 'offline'}
            />
            <span className="text-sm font-medium text-text-primary hidden md:block max-w-[120px] truncate">
              {user?.displayName || user?.username}
            </span>
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-white py-2 shadow-xl animate-scaleIn">
                <div className="border-b border-border px-4 pb-3 mb-2">
                  <p className="font-medium text-text-primary truncate">
                    {user?.displayName || user?.username}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => { setShowDropdown(false); navigate(ROUTES.SETTINGS) }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-100 active:bg-gray-200"
                >
                  <UserCog className="h-4 w-4 text-text-secondary" />
                  Quản lý thông tin
                </button>

                <button
                  onClick={() => { setShowDropdown(false); navigate(ROUTES.CALL_HISTORY) }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-100 active:bg-gray-200"
                >
                  <Phone className="h-4 w-4 text-text-secondary" />
                  Lịch sử cuộc gọi
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => { setShowDropdown(false); navigate(ROUTES.ADMIN) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Shield className="h-4 w-4 text-primary" />
                    Quản trị hệ thống
                  </button>
                )}

                <div className="my-1 border-t border-border" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 active:bg-error/10"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
