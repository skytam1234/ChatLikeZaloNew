import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/utils/constants.js'
import { SettingsLayout, SettingsSidebar } from '@/components/settings/SettingsLayout.jsx'
import { ProfileTab } from './tabs/ProfileTab.jsx'
import { PasswordTab } from './tabs/PasswordTab.jsx'
import { SessionsTab } from './tabs/SessionsTab.jsx'
import { NotificationsTab } from './tabs/NotificationsTab.jsx'
import { User, Lock, Monitor, Bell, ChevronLeft } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Thông tin cá nhân', icon: User },
  { id: 'password', label: 'Đổi mật khẩu', icon: Lock },
  { id: 'sessions', label: 'Quản lý phiên', icon: Monitor },
  { id: 'notifications', label: 'Cài đặt thông báo', icon: Bell },
]

export const SettingsPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState('profile')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />
      case 'password':
        return <PasswordTab />
      case 'sessions':
        return <SessionsTab />
      case 'notifications':
        return <NotificationsTab />
      default:
        return <ProfileTab />
    }
  }

  return (
    <SettingsLayout
      sidebar={
        <SettingsSidebar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
    >
      {/* Mobile top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => navigate(ROUTES.CHAT)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200"
          aria-label="Quay về trang chủ"
        >
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-base font-semibold text-text-primary">
          {TABS.find((t) => t.id === activeTab)?.label}
        </h1>
      </div>

      {/* Mobile tab bar */}
      <div className="flex border-b border-border bg-white px-2 lg:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] leading-tight text-center px-1">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl p-6">
        {renderTabContent()}
      </div>
    </SettingsLayout>
  )
}
