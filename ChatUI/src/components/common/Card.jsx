import React from 'react'
import { cn } from '@/utils/cn.js'

export const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle = ({ className, ...props }) => {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

export const CardDescription = ({ className, ...props }) => {
  return (
    <p
      className={cn('text-sm text-text-secondary', className)}
      {...props}
    />
  )
}

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
}
