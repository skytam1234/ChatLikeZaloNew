import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { cn } from '@/utils/cn.js'

export const MainLayout = ({ sidebarOpen, onSidebarToggle, className }) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('drawer-open')
    } else {
      document.body.classList.remove('drawer-open')
    }
    return () => document.body.classList.remove('drawer-open')
  }, [sidebarOpen])

  return (
    <div className={cn('flex flex-col h-screen bg-background overflow-hidden', className)}>
      <Header onMenuClick={onSidebarToggle} />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={onSidebarToggle}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        {isMobile ? (
          <div
            className={cn(
              'sidebar-drawer border-r border-border',
              !sidebarOpen && 'is-closed'
            )}
          >
            <Sidebar onCloseMobile={onSidebarToggle} />
          </div>
        ) : (
          <div className="border-r border-border">
            <Sidebar />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
