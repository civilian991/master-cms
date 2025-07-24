// Performance optimization utilities for Epic 11 Phase 3

/**
 * GPU-accelerated animation utilities
 * Using transform and opacity for 60fps performance
 */

// Check if the browser supports GPU acceleration
export const supportsGPUAcceleration = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  return !!gl
}

// Force GPU layer promotion for smooth animations
export const promoteToGPULayer = (element: HTMLElement): void => {
  element.style.willChange = 'transform, opacity'
  element.style.transform = 'translateZ(0)' // Force hardware acceleration
  element.style.backfaceVisibility = 'hidden'
}

// Clean up GPU layer promotion when animation is complete
export const cleanupGPULayer = (element: HTMLElement): void => {
  element.style.willChange = 'auto'
  element.style.transform = ''
  element.style.backfaceVisibility = ''
}

/**
 * Reduced Motion Support
 * Respects user's motion preferences for accessibility
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Get animation duration based on user preference
export const getAnimationDuration = (normalDuration: number): number => {
  return prefersReducedMotion() ? 0 : normalDuration
}

// Get safe animation classes that respect motion preferences
export const getSafeAnimationClass = (animationClass: string): string => {
  return prefersReducedMotion() ? '' : animationClass
}

/**
 * Intersection Observer for performance
 * Lazy load animations and heavy components
 */
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Lazy animation trigger using Intersection Observer
export const setupLazyAnimation = (
  element: HTMLElement,
  animationClass: string,
  cleanup?: () => void
): (() => void) => {
  if (prefersReducedMotion()) {
    return () => {}
  }

  const observer = createIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationClass)
          observer?.unobserve(entry.target)
          
          // Cleanup after animation
          if (cleanup) {
            const animationDuration = parseFloat(
              getComputedStyle(entry.target).animationDuration
            ) * 1000
            
            setTimeout(cleanup, animationDuration)
          }
        }
      })
    },
    { threshold: 0.2 }
  )

  if (observer) {
    observer.observe(element)
    return () => observer.disconnect()
  }

  return () => {}
}

/**
 * Touch and Gesture Utilities
 * Optimized for mobile performance
 */
export interface TouchPosition {
  x: number
  y: number
  timestamp: number
}

export class TouchTracker {
  private startPosition: TouchPosition | null = null
  private currentPosition: TouchPosition | null = null
  private threshold = 10 // minimum distance for gesture recognition

  start(touch: Touch): void {
    this.startPosition = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
  }

  move(touch: Touch): void {
    this.currentPosition = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
  }

  end(): TouchGesture | null {
    if (!this.startPosition || !this.currentPosition) return null

    const deltaX = this.currentPosition.x - this.startPosition.x
    const deltaY = this.currentPosition.y - this.startPosition.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = this.currentPosition.timestamp - this.startPosition.timestamp

    if (distance < this.threshold) {
      return { type: 'tap', distance, duration }
    }

    const velocity = distance / duration
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return {
        type: deltaX > 0 ? 'swipe-right' : 'swipe-left',
        distance,
        duration,
        velocity,
        angle
      }
    } else {
      return {
        type: deltaY > 0 ? 'swipe-down' : 'swipe-up',
        distance,
        duration,
        velocity,
        angle
      }
    }
  }

  reset(): void {
    this.startPosition = null
    this.currentPosition = null
  }
}

export interface TouchGesture {
  type: 'tap' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down'
  distance: number
  duration: number
  velocity?: number
  angle?: number
}

/**
 * Bundle Optimization Utilities
 */

// Dynamic import wrapper with error handling
export const safeDynamicImport = async <T>(
  importFn: () => Promise<T>
): Promise<T | null> => {
  try {
    return await importFn()
  } catch (error) {
    console.warn('Dynamic import failed:', error)
    return null
  }
}

// Preload component for better UX
export const preloadComponent = (importFn: () => Promise<any>): void => {
  if (typeof window !== 'undefined') {
    // Preload on idle
    requestIdleCallback(() => {
      importFn().catch(() => {
        // Silently handle preload failures
      })
    })
  }
}

/**
 * Memory Management
 */

// Cleanup event listeners to prevent memory leaks
export const createCleanupManager = () => {
  const cleanup: (() => void)[] = []

  return {
    add: (cleanupFn: () => void) => {
      cleanup.push(cleanupFn)
    },
    addEventListener: (
      element: HTMLElement | Window,
      event: string,
      handler: EventListener,
      options?: AddEventListenerOptions
    ) => {
      element.addEventListener(event, handler, options)
      cleanup.push(() => element.removeEventListener(event, handler))
    },
    addIntersectionObserver: (observer: IntersectionObserver) => {
      cleanup.push(() => observer.disconnect())
      return observer
    },
    cleanup: () => {
      cleanup.forEach(fn => fn())
      cleanup.length = 0
    }
  }
}

/**
 * Animation Performance Monitoring
 */
export const trackAnimationPerformance = (name: string) => {
  if (typeof window === 'undefined' || !window.performance) return () => {}

  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Animation "${name}" took ${duration.toFixed(2)}ms`)
      
      // Warn if animation is taking too long (>16ms for 60fps)
      if (duration > 16) {
        console.warn(`Animation "${name}" may cause frame drops (${duration.toFixed(2)}ms)`)
      }
    }
  }
}

/**
 * Viewport and Device Detection
 */
export const getViewportInfo = () => {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      touchDevice: false
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const isDesktop = width >= 1024
  const touchDevice = 'ontouchstart' in window

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    touchDevice
  }
}

// Debounced resize handler for performance
export const createResizeHandler = (
  callback: (viewport: ReturnType<typeof getViewportInfo>) => void,
  delay = 150
) => {
  let timeoutId: NodeJS.Timeout

  return () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(getViewportInfo())
    }, delay)
  }
} 