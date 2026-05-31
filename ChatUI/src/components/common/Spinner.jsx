import React from 'react'
import { cn } from '@/utils/cn.js'
import { Loader2 } from 'lucide-react'

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export const Spinner = ({ className, size = 'md' }) => {
  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
    />
  )
}

export const LoadingOverlay = ({ isLoading, children, className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Spinner size="lg" />
        </div>
      )}
    </div>
  )
}
