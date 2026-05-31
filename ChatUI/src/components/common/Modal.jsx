import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn.js'

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
  showCloseButton = true,
  size = 'md',
}) => {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full sm:rounded-xl bg-white shadow-2xl',
          'animate-slideInUp sm:animate-scaleIn',
          'max-h-[90vh] sm:max-h-[85vh] overflow-y-auto',
          'rounded-t-2xl sm:rounded-xl',
          sizeClasses[size],
          className
        )}
      >
        {/* Mobile drag indicator */}
        <div className="sticky top-0 bg-white pt-2 pb-1 sm:hidden">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 sm:right-4 top-3 sm:top-4 rounded-lg p-1.5 hover:bg-gray-100 active:bg-gray-200 touch-manipulation z-10"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        )}
        
        {title && (
          <h2 className="pr-10 sm:pr-12 mb-1 text-lg sm:text-xl font-semibold text-text-primary px-4 sm:px-6 pt-2 sm:pt-6">
            {title}
          </h2>
        )}
        
        {description && (
          <p className="mb-4 text-sm text-text-secondary px-4 sm:px-6">
            {description}
          </p>
        )}
        
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}
