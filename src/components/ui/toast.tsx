"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell } from "lucide-react"

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

export interface Toast {
  id: string
  title?: string
  message: string
  variant: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider Component
interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    }

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts)
      return updated
    })

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <div className={cn("fixed z-50 pointer-events-none", positionClasses[position])}>
        <div className="space-y-3 w-80">
          {toasts.map((toast, index) => (
            <ToastComponent
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

// Individual Toast Component
interface ToastComponentProps {
  toast: Toast
  onClose: () => void
  style?: React.CSSProperties
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onClose, style }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
      toast.onClose?.()
    }, 300)
  }

  const variantStyles = {
    default: {
      bg: 'bg-white border-gray-200',
      icon: Bell,
      iconColor: 'text-gray-600'
    },
    success: {
      bg: 'bg-white border-success-200',
      icon: CheckCircle,
      iconColor: 'text-success-600'
    },
    error: {
      bg: 'bg-white border-error-200',
      icon: AlertCircle,
      iconColor: 'text-error-600'
    },
    warning: {
      bg: 'bg-white border-warning-200',
      icon: AlertTriangle,
      iconColor: 'text-warning-600'
    },
    info: {
      bg: 'bg-white border-brand-200',
      icon: Info,
      iconColor: 'text-brand-600'
    }
  }

  const variant = variantStyles[toast.variant]
  const Icon = variant.icon

  return (
    <div
      className={cn(
        "relative pointer-events-auto border-l-4 rounded-lg shadow-elevated backdrop-blur-sm",
        "transform transition-all duration-300 ease-out",
        variant.bg,
        isExiting 
          ? "animate-[toast-slide-out_0.3s_ease-in_forwards]" 
          : "animate-[toast-slide-in_0.3s_ease-out]"
      )}
      style={style}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 mt-0.5", variant.iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-heading text-gray-900 mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-body text-gray-700">
              {toast.message}
            </p>
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className={cn(
                  "mt-3 text-sm font-medium hover:underline transition-colors",
                  variant.iconColor
                )}
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-lg overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all ease-linear",
              variant.iconColor.replace('text-', 'bg-')
            )}
            style={{
              animation: `progress-bar ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  )
}

// Helper hooks for easy toast usage
export const useSuccessToast = () => {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string, action?: Toast['action']) => {
    return addToast({ message, title, variant: 'success', action })
  }, [addToast])
}

export const useErrorToast = () => {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string, action?: Toast['action']) => {
    return addToast({ message, title, variant: 'error', action, duration: 7000 })
  }, [addToast])
}

export const useWarningToast = () => {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string, action?: Toast['action']) => {
    return addToast({ message, title, variant: 'warning', action })
  }, [addToast])
}

export const useInfoToast = () => {
  const { addToast } = useToast()
  return useCallback((message: string, title?: string, action?: Toast['action']) => {
    return addToast({ message, title, variant: 'info', action })
  }, [addToast])
} 