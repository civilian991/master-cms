'use client'

import { useRef, useEffect, useCallback } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: () => void
  threshold?: number
  longPressDelay?: number
  preventScroll?: boolean
  enabled?: boolean
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export const useSwipeGestures = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500,
    preventScroll = false,
    enabled = true
  } = options

  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return

    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
    touchEndRef.current = null

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress()
        clearLongPressTimer()
      }, longPressDelay)
    }

    if (preventScroll) {
      e.preventDefault()
    }
  }, [enabled, onLongPress, longPressDelay, preventScroll, clearLongPressTimer])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return

    // Clear long press timer on move
    clearLongPressTimer()

    const touch = e.touches[0]
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    if (preventScroll) {
      e.preventDefault()
    }
  }, [enabled, preventScroll, clearLongPressTimer])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return

    clearLongPressTimer()

    const touchStart = touchStartRef.current
    const touchEnd = touchEndRef.current || {
      x: touchStart.x,
      y: touchStart.y,
      timestamp: Date.now()
    }

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = touchEnd.timestamp - touchStart.timestamp

    // Check for tap (small movement, short duration)
    if (distance < 10 && duration < 200 && onTap) {
      onTap()
      return
    }

    // Check for swipe gestures
    if (distance >= threshold) {
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Horizontal swipe
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
      // Vertical swipe
      else {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    // Reset touch points
    touchStartRef.current = null
    touchEndRef.current = null
  }, [
    enabled,
    threshold,
    onTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    clearLongPressTimer
  ])

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer()
    touchStartRef.current = null
    touchEndRef.current = null
  }, [clearLongPressTimer])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const options: AddEventListenerOptions = { passive: !preventScroll }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchCancel, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      clearLongPressTimer()
    }
  }, [
    enabled,
    preventScroll,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    clearLongPressTimer
  ])

  return elementRef
}

// Hook for pull-to-refresh functionality
interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  resistance?: number
  enabled?: boolean
}

export const usePullToRefresh = (options: PullToRefreshOptions) => {
  const {
    onRefresh,
    threshold = 80,
    resistance = 0.3,
    enabled = true
  } = options

  const elementRef = useRef<HTMLElement | null>(null)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)
  const isPullingRef = useRef<boolean>(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshingRef.current) return

    const element = elementRef.current
    if (!element || element.scrollTop > 0) return

    startYRef.current = e.touches[0].clientY
    isPullingRef.current = true
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isPullingRef.current || isRefreshingRef.current) return

    const element = elementRef.current
    if (!element || element.scrollTop > 0) {
      isPullingRef.current = false
      return
    }

    currentYRef.current = e.touches[0].clientY
    const pullDistance = (currentYRef.current - startYRef.current) * resistance

    if (pullDistance > 0) {
      e.preventDefault()
      element.style.transform = `translateY(${Math.min(pullDistance, threshold * 1.5)}px)`
      
      // Visual feedback based on threshold
      if (pullDistance >= threshold) {
        element.classList.add('refresh-ready')
      } else {
        element.classList.remove('refresh-ready')
      }
    }
  }, [enabled, threshold, resistance])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPullingRef.current || isRefreshingRef.current) return

    const element = elementRef.current
    if (!element) return

    const pullDistance = (currentYRef.current - startYRef.current) * resistance

    if (pullDistance >= threshold) {
      isRefreshingRef.current = true
      element.classList.add('refreshing')
      
      try {
        await onRefresh()
      } finally {
        isRefreshingRef.current = false
        element.classList.remove('refreshing', 'refresh-ready')
        element.style.transform = ''
      }
    } else {
      element.classList.remove('refresh-ready')
      element.style.transform = ''
    }

    isPullingRef.current = false
  }, [enabled, threshold, resistance, onRefresh])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return elementRef
}

// Hook for pinch-to-zoom gestures
interface PinchZoomOptions {
  onZoom?: (scale: number) => void
  onZoomStart?: () => void
  onZoomEnd?: () => void
  minScale?: number
  maxScale?: number
  enabled?: boolean
}

export const usePinchZoom = (options: PinchZoomOptions = {}) => {
  const {
    onZoom,
    onZoomStart,
    onZoomEnd,
    minScale = 0.5,
    maxScale = 3,
    enabled = true
  } = options

  const elementRef = useRef<HTMLElement | null>(null)
  const initialDistanceRef = useRef<number>(0)
  const initialScaleRef = useRef<number>(1)
  const isPinchingRef = useRef<boolean>(false)

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length !== 2) return

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    
    initialDistanceRef.current = getDistance(touch1, touch2)
    isPinchingRef.current = true
    
    if (onZoomStart) {
      onZoomStart()
    }
    
    e.preventDefault()
  }, [enabled, getDistance, onZoomStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isPinchingRef.current || e.touches.length !== 2) return

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const currentDistance = getDistance(touch1, touch2)
    
    const scale = currentDistance / initialDistanceRef.current
    const clampedScale = Math.min(Math.max(scale, minScale), maxScale)
    
    if (onZoom) {
      onZoom(clampedScale)
    }
    
    e.preventDefault()
  }, [enabled, getDistance, onZoom, minScale, maxScale])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length > 0) return

    if (isPinchingRef.current && onZoomEnd) {
      onZoomEnd()
    }
    
    isPinchingRef.current = false
  }, [enabled, onZoomEnd])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return elementRef
}

// Utility hook for haptic feedback
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const impact = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30
    }
    vibrate(patterns[intensity])
  }, [vibrate])

  const success = useCallback(() => {
    vibrate([10, 50, 10])
  }, [vibrate])

  const error = useCallback(() => {
    vibrate([50, 100, 50])
  }, [vibrate])

  const selection = useCallback(() => {
    vibrate(5)
  }, [vibrate])

  return {
    vibrate,
    impact,
    success,
    error,
    selection
  }
} 