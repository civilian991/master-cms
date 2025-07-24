'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

// Advanced gesture recognition types
interface GesturePoint {
  x: number
  y: number
  timestamp: number
}

interface MultiTouchGesture {
  touches: GesturePoint[]
  center: GesturePoint
  distance: number
  angle: number
}

interface GesturePattern {
  type: 'swipe' | 'pinch' | 'rotate' | 'tap' | 'longPress' | 'doubleTap'
  confidence: number
  data: any
}

interface AdvancedGestureOptions {
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: number) => void
  onPinch?: (scale: number, velocity: number) => void
  onRotate?: (angle: number, velocity: number) => void
  onTap?: (position: GesturePoint) => void
  onDoubleTap?: (position: GesturePoint) => void
  onLongPress?: (position: GesturePoint) => void
  onMultiTouch?: (touches: GesturePoint[]) => void
  
  // Thresholds
  swipeThreshold?: number
  pinchThreshold?: number
  rotateThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  velocityThreshold?: number
  
  // Options
  enablePinch?: boolean
  enableRotate?: boolean
  enableMultiTouch?: boolean
  preventScroll?: boolean
  enabled?: boolean
}

export const useAdvancedGestures = (options: AdvancedGestureOptions = {}) => {
  const {
    onSwipe,
    onPinch,
    onRotate,
    onTap,
    onDoubleTap,
    onLongPress,
    onMultiTouch,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    rotateThreshold = 15,
    longPressDelay = 500,
    doubleTapDelay = 300,
    velocityThreshold = 100,
    enablePinch = true,
    enableRotate = true,
    enableMultiTouch = true,
    preventScroll = false,
    enabled = true
  } = options

  const elementRef = useRef<HTMLElement | null>(null)
  const gestureStateRef = useRef({
    touches: new Map<number, GesturePoint[]>(),
    lastTap: null as GesturePoint | null,
    longPressTimer: null as NodeJS.Timeout | null,
    initialDistance: 0,
    initialAngle: 0,
    initialScale: 1,
    isGesturing: false
  })

  // Utility functions
  const getDistance = useCallback((p1: GesturePoint, p2: GesturePoint): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getAngle = useCallback((p1: GesturePoint, p2: GesturePoint): number => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
  }, [])

  const getCenter = useCallback((points: GesturePoint[]): GesturePoint => {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length
    return { x, y, timestamp: Date.now() }
  }, [])

  const getVelocity = useCallback((points: GesturePoint[]): number => {
    if (points.length < 2) return 0
    
    const latest = points[points.length - 1]
    const previous = points[points.length - 2]
    const distance = getDistance(previous, latest)
    const timeDiff = latest.timestamp - previous.timestamp
    
    return timeDiff > 0 ? distance / timeDiff : 0
  }, [getDistance])

  const clearLongPressTimer = useCallback(() => {
    if (gestureStateRef.current.longPressTimer) {
      clearTimeout(gestureStateRef.current.longPressTimer)
      gestureStateRef.current.longPressTimer = null
    }
  }, [])

  const recognizeSwipe = useCallback((points: GesturePoint[]) => {
    if (points.length < 2) return null

    const start = points[0]
    const end = points[points.length - 1]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < swipeThreshold) return null

    const velocity = getVelocity(points)
    if (velocity < velocityThreshold) return null

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    
    let direction: 'up' | 'down' | 'left' | 'right'
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left'
    } else {
      direction = dy > 0 ? 'down' : 'up'
    }

    return { direction, velocity, confidence: Math.min(distance / swipeThreshold, 1) }
  }, [swipeThreshold, getVelocity, velocityThreshold])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return

    const touches = Array.from(e.touches).map((touch, index) => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }))

    // Store touch points
    for (let i = 0; i < touches.length; i++) {
      const touchId = e.touches[i].identifier
      gestureStateRef.current.touches.set(touchId, [touches[i]])
    }

    // Handle single touch
    if (touches.length === 1) {
      const touch = touches[0]
      
      // Check for double tap
      if (gestureStateRef.current.lastTap && onDoubleTap) {
        const timeDiff = touch.timestamp - gestureStateRef.current.lastTap.timestamp
        const distance = getDistance(touch, gestureStateRef.current.lastTap)
        
        if (timeDiff < doubleTapDelay && distance < 50) {
          onDoubleTap(touch)
          gestureStateRef.current.lastTap = null
          return
        }
      }

      // Start long press timer
      if (onLongPress) {
        gestureStateRef.current.longPressTimer = setTimeout(() => {
          onLongPress(touch)
        }, longPressDelay)
      }
    }

    // Handle multi-touch
    if (touches.length === 2 && (enablePinch || enableRotate)) {
      gestureStateRef.current.initialDistance = getDistance(touches[0], touches[1])
      gestureStateRef.current.initialAngle = getAngle(touches[0], touches[1])
      gestureStateRef.current.isGesturing = true
    }

    if (enableMultiTouch && onMultiTouch) {
      onMultiTouch(touches)
    }

    if (preventScroll) {
      e.preventDefault()
    }
  }, [
    enabled,
    onDoubleTap,
    onLongPress,
    onMultiTouch,
    enablePinch,
    enableRotate,
    enableMultiTouch,
    getDistance,
    getAngle,
    doubleTapDelay,
    longPressDelay,
    preventScroll
  ])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return

    clearLongPressTimer()

    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }))

    // Update touch history
    for (let i = 0; i < touches.length; i++) {
      const touchId = e.touches[i].identifier
      const history = gestureStateRef.current.touches.get(touchId) || []
      history.push(touches[i])
      
      // Keep only recent history (last 10 points)
      if (history.length > 10) {
        history.shift()
      }
      
      gestureStateRef.current.touches.set(touchId, history)
    }

    // Handle pinch and rotate gestures
    if (touches.length === 2 && gestureStateRef.current.isGesturing) {
      const currentDistance = getDistance(touches[0], touches[1])
      const currentAngle = getAngle(touches[0], touches[1])

      // Pinch gesture
      if (enablePinch && onPinch && gestureStateRef.current.initialDistance > 0) {
        const scale = currentDistance / gestureStateRef.current.initialDistance
        const scaleChange = Math.abs(scale - gestureStateRef.current.initialScale)
        
        if (scaleChange > pinchThreshold) {
          const velocity = getVelocity(touches)
          onPinch(scale, velocity)
          gestureStateRef.current.initialScale = scale
        }
      }

      // Rotate gesture
      if (enableRotate && onRotate) {
        let angleDiff = currentAngle - gestureStateRef.current.initialAngle
        
        // Normalize angle to -180 to 180
        if (angleDiff > 180) angleDiff -= 360
        if (angleDiff < -180) angleDiff += 360
        
        if (Math.abs(angleDiff) > rotateThreshold) {
          const velocity = getVelocity(touches)
          onRotate(angleDiff, velocity)
          gestureStateRef.current.initialAngle = currentAngle
        }
      }
    }

    if (preventScroll) {
      e.preventDefault()
    }
  }, [
    enabled,
    clearLongPressTimer,
    getDistance,
    getAngle,
    getVelocity,
    enablePinch,
    enableRotate,
    onPinch,
    onRotate,
    pinchThreshold,
    rotateThreshold,
    preventScroll
  ])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return

    clearLongPressTimer()

    const remainingTouches = Array.from(e.touches)
    
    // Clean up ended touches and process gestures
    const endedTouches = Array.from(e.changedTouches)
    
    endedTouches.forEach(touch => {
      const touchId = touch.identifier
      const history = gestureStateRef.current.touches.get(touchId)
      
      if (history && history.length > 1) {
        // Check for swipe gesture
        const swipe = recognizeSwipe(history)
        if (swipe && onSwipe) {
          onSwipe(swipe.direction, swipe.velocity)
        }
        
        // Check for tap gesture (short touch with minimal movement)
        if (history.length <= 3 && onTap) {
          const start = history[0]
          const end = history[history.length - 1]
          const distance = getDistance(start, end)
          const duration = end.timestamp - start.timestamp
          
          if (distance < 20 && duration < 300) {
            onTap(end)
            gestureStateRef.current.lastTap = end
          }
        }
      }
      
      gestureStateRef.current.touches.delete(touchId)
    })

    // Reset gesture state if no touches remain
    if (remainingTouches.length === 0) {
      gestureStateRef.current.isGesturing = false
      gestureStateRef.current.initialDistance = 0
      gestureStateRef.current.initialAngle = 0
      gestureStateRef.current.initialScale = 1
    }
  }, [
    enabled,
    clearLongPressTimer,
    recognizeSwipe,
    onSwipe,
    onTap,
    getDistance
  ])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const options: AddEventListenerOptions = { passive: !preventScroll }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchEnd, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      
      clearLongPressTimer()
      gestureStateRef.current.touches.clear()
    }
  }, [
    enabled,
    preventScroll,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearLongPressTimer
  ])

  return elementRef
}

// Hook for gesture-based navigation
interface NavigationGestureOptions {
  onBack?: () => void
  onForward?: () => void
  onRefresh?: () => void
  onMenu?: () => void
  enabled?: boolean
}

export const useNavigationGestures = (options: NavigationGestureOptions = {}) => {
  const { onBack, onForward, onRefresh, onMenu, enabled = true } = options

  return useAdvancedGestures({
    onSwipe: (direction, velocity) => {
      switch (direction) {
        case 'right':
          if (velocity > 200 && onBack) onBack()
          break
        case 'left':
          if (velocity > 200 && onForward) onForward()
          break
        case 'down':
          if (velocity > 150 && onRefresh) onRefresh()
          break
      }
    },
    onLongPress: () => {
      if (onMenu) onMenu()
    },
    swipeThreshold: 80,
    velocityThreshold: 150,
    enabled
  })
}

// Hook for content manipulation gestures
interface ContentGestureOptions {
  onZoom?: (scale: number) => void
  onRotate?: (angle: number) => void
  onMove?: (dx: number, dy: number) => void
  enabled?: boolean
}

export const useContentGestures = (options: ContentGestureOptions = {}) => {
  const { onZoom, onRotate, onMove, enabled = true } = options
  const [isDragging, setIsDragging] = useState(false)
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null)

  const gestureRef = useAdvancedGestures({
    onPinch: (scale) => {
      if (onZoom) onZoom(scale)
    },
    onRotate: (angle) => {
      if (onRotate) onRotate(angle)
    },
    onTouchStart: (touches) => {
      if (touches.length === 1 && onMove) {
        setIsDragging(true)
        lastPositionRef.current = { x: touches[0].x, y: touches[0].y }
      }
    },
    onTouchMove: (touches) => {
      if (isDragging && touches.length === 1 && onMove && lastPositionRef.current) {
        const dx = touches[0].x - lastPositionRef.current.x
        const dy = touches[0].y - lastPositionRef.current.y
        onMove(dx, dy)
        lastPositionRef.current = { x: touches[0].x, y: touches[0].y }
      }
    },
    onTouchEnd: () => {
      setIsDragging(false)
      lastPositionRef.current = null
    },
    enablePinch: true,
    enableRotate: true,
    preventScroll: true,
    enabled
  })

  return gestureRef
} 