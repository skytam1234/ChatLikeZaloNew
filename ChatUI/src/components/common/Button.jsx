import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn.js'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm sm:text-base font-semibold transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
  'active:scale-[0.97] touch-manipulation select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-[0_2px_8px_rgba(0,104,255,0.25)] hover:bg-primary-dark hover:shadow-[0_4px_16px_rgba(0,104,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
        destructive: 'bg-error text-white shadow-[0_2px_8px_rgba(244,67,54,0.25)] hover:bg-red-600 hover:shadow-[0_4px_16px_rgba(244,67,54,0.4)] hover:-translate-y-0.5 active:translate-y-0',
        outline: 'border border-border bg-white hover:bg-gray-50 active:bg-gray-100 text-text-primary',
        secondary: 'bg-gray-100 text-text-primary hover:bg-gray-200 active:bg-gray-200/80',
        ghost: 'hover:bg-gray-100 active:bg-gray-200 text-text-primary',
        link: 'text-primary underline-offset-4 hover:underline active:scale-[0.98]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
