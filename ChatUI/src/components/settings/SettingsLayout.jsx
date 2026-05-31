import React from 'react'
import { cn } from '@/utils/cn.js'

export const SettingsLayout = ({ sidebar, children, className }) => {
  return (
    <div className={cn('flex h-full overflow-hidden bg-background-secondary', className)}>
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-border bg-white overflow-y-auto hidden lg:block">
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export const SettingsSidebar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="p-4">
      <h2 className="mb-6 px-2 text-lg font-semibold text-text-primary">Quản lý tài khoản</h2>
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
            )}
          >
            <tab.icon className="h-5 w-5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
