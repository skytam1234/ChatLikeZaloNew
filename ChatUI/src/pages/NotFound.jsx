import React from 'react'
import { Link } from 'react-router-dom'

export const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-text-primary">
          Trang không tìm thấy
        </h2>
        <p className="mt-2 text-text-secondary">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  )
}
