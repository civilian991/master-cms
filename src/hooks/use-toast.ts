import { useState, useCallback, useEffect } from 'react'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

export interface ToastItem extends ToastOptions {
  id: string
  timestamp: number
}

// Simple in-memory toast store
let toastStore: ToastItem[] = []
let toastListeners: Set<(toasts: ToastItem[]) => void> = new Set()

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function addToast(options: ToastOptions) {
  const toast: ToastItem = {
    ...options,
    id: generateId(),
    timestamp: Date.now()
  }
  
  toastStore.push(toast)
  toastListeners.forEach(listener => listener([...toastStore]))
  
  // Auto-remove after duration
  const duration = options.duration || 4000
  setTimeout(() => {
    removeToast(toast.id)
  }, duration)
  
  return toast.id
}

function removeToast(id: string) {
  toastStore = toastStore.filter(toast => toast.id !== id)
  toastListeners.forEach(listener => listener([...toastStore]))
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(toastStore)
  
  // Subscribe to toast changes
  useEffect(() => {
    toastListeners.add(setToasts)
    return () => {
      toastListeners.delete(setToasts)
    }
  }, [])
  
  const toast = useCallback((options: ToastOptions) => {
    // For now, just use console.log and alerts for demonstration
    // In a real app, you'd want to render these in a toast container
    const message = options.title && options.description 
      ? `${options.title}: ${options.description}`
      : options.title || options.description || ''
    
    if (options.variant === 'destructive') {
      console.error('Error:', message)
      // Could show a red notification in a real implementation
    } else if (options.variant === 'success') {
      console.log('Success:', message)
      // Could show a green notification in a real implementation
    } else {
      console.log('Info:', message)
    }
    
    return addToast(options)
  }, [])
  
  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])
  
  return { 
    toast,
    toasts,
    dismiss
  }
} 