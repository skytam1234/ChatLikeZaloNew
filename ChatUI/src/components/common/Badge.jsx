import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn.js'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        secondary: 'bg-gray-100 text-text-primary',
        success: 'bg-success text-white',
        warning: 'bg-warning text-white',
        error: 'bg-error text-white',
        outline: 'border border-border text-text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
