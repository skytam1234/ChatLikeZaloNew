import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/index.js'
import { useNotificationStore } from '@/stores/notificationStore.js'
import { ROUTES } from '@/utils/constants.js'
import { Avatar } from '@/components/common/index.js'
import { Bell, Settings, LogOut, MessageCircle, Menu, UserCog, Shield, Phone, UserPlus } from 'lucide-react'
import { cn } from '@/utils/cn.js'
import { socketService } from '@/services/socketService.js'

export const Header = ({ onMenuClick, className }) => {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const { notifications, unreadCount, markAllAsRead } = useNotificationStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleBellClick = () => {
    if (showNotifications && unreadCount > 0) {
      markAllAsRead()
      socketService.markNotificationsRead()
    }
    setShowNotifications((v) => !v)
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
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-white py-2 shadow-xl animate-scaleIn max-h-96 overflow-y-auto">
              <div className="border-b border-border px-4 pb-3 mb-2">
                <p className="font-semibold text-text-primary">Thông báo</p>
                {notifications.length === 0 && (
                  <p className="text-xs text-text-secondary mt-1">Không có thông báo nào</p>
                )}
              </div>
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${!n.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{n.content}</p>
                    <p className="text-[10px] text-text-secondary mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                    </p>
                  </div>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>

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
