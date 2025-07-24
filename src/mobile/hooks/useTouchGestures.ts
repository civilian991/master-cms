import { useEffect, useRef, useState } from 'react'

interface TouchGestureState {
  isDragging: boolean
  isLongPress: boolean
  isPinching: boolean
  scale: number
  rotation: number
  velocity: { x: number; y: number }
  distance: { x: number; y: number }
}

interface TouchGestureHandlers {
  onTap?: (event: TouchEvent) => void
  onDoubleTap?: (event: TouchEvent) => void
  onLongPress?: (event: TouchEvent) => void
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', event: TouchEvent) => void
  onPinch?: (scale: number, event: TouchEvent) => void
  onRotate?: (rotation: number, event: TouchEvent) => void
  onDrag?: (delta: { x: number; y: number }, event: TouchEvent) => void
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: TouchGestureHandlers = {}
) {
  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isDragging: false,
    isLongPress: false,
    isPinching: false,
    scale: 1,
    rotation: 0,
    velocity: { x: 0, y: 0 },
    distance: { x: 0, y: 0 }
  })

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tapCountRef = useRef(0)
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialTouchesRef = useRef<TouchList | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      const touchData = { x: touch.clientX, y: touch.clientY, time: Date.now() }
      
      touchStartRef.current = touchData
      lastTouchRef.current = touchData
      initialTouchesRef.current = event.touches

      // Handle multi-touch for pinch/zoom
      if (event.touches.length === 2) {
        setGestureState(prev => ({ ...prev, isPinching: true }))
        event.preventDefault()
      }

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        setGestureState(prev => ({ ...prev, isLongPress: true }))
        handlers.onLongPress?.(event)
      }, 500) // 500ms for long press

      // Handle tap counting for double tap
      tapCountRef.current++
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current)
      }

      doubleTapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          handlers.onTap?.(event)
        }
        tapCountRef.current = 0
      }, 300) // 300ms window for double tap
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchStartRef.current || !lastTouchRef.current) return

      const touch = event.touches[0]
      const currentTime = Date.now()

      // Calculate movement delta
      const deltaX = touch.clientX - lastTouchRef.current.x
      const deltaY = touch.clientY - lastTouchRef.current.y
      
      // Calculate velocity
      const timeDelta = currentTime - lastTouchRef.current.time
      const velocityX = timeDelta > 0 ? deltaX / timeDelta : 0
      const velocityY = timeDelta > 0 ? deltaY / timeDelta : 0

      // Calculate total distance from start
      const distanceX = touch.clientX - touchStartRef.current.x
      const distanceY = touch.clientY - touchStartRef.current.y

      setGestureState(prev => ({
        ...prev,
        isDragging: true,
        velocity: { x: velocityX, y: velocityY },
        distance: { x: distanceX, y: distanceY }
      }))

      // Handle multi-touch gestures
      if (event.touches.length === 2 && initialTouchesRef.current?.length === 2) {
        const touch1 = event.touches[0]
        const touch2 = event.touches[1]
        const initialTouch1 = initialTouchesRef.current[0]
        const initialTouch2 = initialTouchesRef.current[1]

        // Calculate pinch scale
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        const initialDistance = Math.sqrt(
          Math.pow(initialTouch2.clientX - initialTouch1.clientX, 2) + 
          Math.pow(initialTouch2.clientY - initialTouch1.clientY, 2)
        )
        const scale = currentDistance / initialDistance

        // Calculate rotation
        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        )
        const initialAngle = Math.atan2(
          initialTouch2.clientY - initialTouch1.clientY,
          initialTouch2.clientX - initialTouch1.clientX
        )
        const rotation = (currentAngle - initialAngle) * (180 / Math.PI)

        setGestureState(prev => ({ ...prev, scale, rotation }))
        handlers.onPinch?.(scale, event)
        handlers.onRotate?.(rotation, event)

        event.preventDefault()
      } else {
        // Single touch drag
        handlers.onDrag?.({ x: deltaX, y: deltaY }, event)
      }

      // Clear long press if moving too much
      if (Math.abs(distanceX) > 10 || Math.abs(distanceY) > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      }

      lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: currentTime }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStartRef.current || !lastTouchRef.current) return

      const timeDelta = Date.now() - touchStartRef.current.time
      const distanceX = gestureState.distance.x
      const distanceY = gestureState.distance.y
      const absDistanceX = Math.abs(distanceX)
      const absDistanceY = Math.abs(distanceY)

      // Clear timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      // Detect swipe gestures
      if (timeDelta < 300 && (absDistanceX > 50 || absDistanceY > 50)) {
        if (absDistanceX > absDistanceY) {
          handlers.onSwipe?.(distanceX > 0 ? 'right' : 'left', event)
        } else {
          handlers.onSwipe?.(distanceY > 0 ? 'down' : 'up', event)
        }
      }

      // Handle double tap
      if (tapCountRef.current === 2 && timeDelta < 300) {
        if (doubleTapTimerRef.current) {
          clearTimeout(doubleTapTimerRef.current)
        }
        handlers.onDoubleTap?.(event)
        tapCountRef.current = 0
      }

      // Reset state
      setGestureState(prev => ({
        ...prev,
        isDragging: false,
        isLongPress: false,
        isPinching: false,
        scale: 1,
        rotation: 0,
        velocity: { x: 0, y: 0 },
        distance: { x: 0, y: 0 }
      }))

      touchStartRef.current = null
      lastTouchRef.current = null
      initialTouchesRef.current = null
    }

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)

      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current)
      }
    }
  }, [elementRef, handlers])

  return gestureState
} 