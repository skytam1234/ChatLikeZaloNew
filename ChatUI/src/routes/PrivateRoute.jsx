import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/contexts/index.js'
import { Spinner } from '@/components/common/index.js'
import { ROUTES } from '@/utils/constants.js'

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuthContext()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}

export const AdminRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to={ROUTES.CHAT} replace />
  }

  return <Outlet />
}
