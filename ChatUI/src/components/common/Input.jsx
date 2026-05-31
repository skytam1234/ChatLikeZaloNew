import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn.js'

const Input = forwardRef(({ className, type, error, label, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'flex h-10 sm:h-11 w-full rounded-xl border border-border bg-white px-3 sm:px-4 py-2 text-sm sm:text-base ring-offset-white',
          'placeholder:text-text-secondary placeholder:text-sm sm:placeholder:text-base',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors active:border-primary/50',
          error && 'border-error focus-visible:ring-error',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-error">{error}</p>
      )}
    </div>
  )
})
Input.displayName = 'Input'

export { Input }
