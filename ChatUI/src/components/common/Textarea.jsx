import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn.js'

const Textarea = forwardRef(({ className, error, label, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error focus-visible:ring-error',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}
    </div>
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
