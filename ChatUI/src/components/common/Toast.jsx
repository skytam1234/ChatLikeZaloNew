import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn.js'

const ToastContext = createContext(undefined)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const ToastContainer = ({ toasts, removeToast }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-primary" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-success/20',
    error: 'bg-red-50 border-error/20',
    warning: 'bg-yellow-50 border-warning/20',
    info: 'bg-blue-50 border-primary/20',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border p-4 shadow-lg',
            bgColors[toast.type]
          )}
        >
          {icons[toast.type]}
          <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      ))}
    </div>
  )
}
