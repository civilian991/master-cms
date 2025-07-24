'use client'

import React, { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useSwipeGestures, useHapticFeedback } from '@/hooks/mobile/useSwipeGestures'
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'

// Swipeable card container with gesture feedback
interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onTap?: () => void
  leftAction?: {
    label: string
    icon: React.ComponentType<any>
    color: 'red' | 'blue' | 'green' | 'gray'
  }
  rightAction?: {
    label: string
    icon: React.ComponentType<any>
    color: 'red' | 'blue' | 'green' | 'gray'
  }
  className?: string
  disabled?: boolean
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  leftAction,
  rightAction,
  className,
  disabled = false
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const { impact } = useHapticFeedback()
  
  const cardRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

  const resetCard = useCallback(() => {
    setIsAnimating(true)
    setSwipeOffset(0)
    setTimeout(() => setIsAnimating(false), 300)
  }, [])

  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      if (disabled || !onSwipeLeft) return
      impact('medium')
      onSwipeLeft()
      resetCard()
    },
    onSwipeRight: () => {
      if (disabled || !onSwipeRight) return
      impact('medium')
      onSwipeRight()
      resetCard()
    },
    onTap: () => {
      if (disabled || !onTap) return
      impact('light')
      onTap()
    },
    threshold: 80,
    enabled: !disabled
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    startXRef.current = e.touches[0].clientX
    setIsAnimating(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isAnimating) return
    
    currentXRef.current = e.touches[0].clientX
    const diff = currentXRef.current - startXRef.current
    const maxOffset = 120
    
    // Apply resistance for better feel
    const resistance = 0.6
    const offset = Math.max(-maxOffset, Math.min(maxOffset, diff * resistance))
    setSwipeOffset(offset)
  }

  const handleTouchEnd = () => {
    if (disabled) return
    
    const threshold = 60
    if (Math.abs(swipeOffset) > threshold) {
      if (swipeOffset > 0 && onSwipeRight) {
        impact('medium')
        onSwipeRight()
      } else if (swipeOffset < 0 && onSwipeLeft) {
        impact('medium')
        onSwipeLeft()
      }
    }
    resetCard()
  }

  const actionColors = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    gray: 'bg-gray-500 text-white'
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action background */}
      {rightAction && swipeOffset > 0 && (
        <div className={cn(
          'absolute inset-y-0 left-0 flex items-center justify-start pl-6',
          'transition-all duration-200',
          actionColors[rightAction.color]
        )}
        style={{ width: Math.min(swipeOffset + 20, 120) }}>
          <rightAction.icon size={24} />
          {swipeOffset > 40 && (
            <span className="ml-2 font-medium">{rightAction.label}</span>
          )}
        </div>
      )}

      {/* Right action background */}
      {leftAction && swipeOffset < 0 && (
        <div className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end pr-6',
          'transition-all duration-200',
          actionColors[leftAction.color]
        )}
        style={{ width: Math.min(Math.abs(swipeOffset) + 20, 120) }}>
          {Math.abs(swipeOffset) > 40 && (
            <span className="mr-2 font-medium">{leftAction.label}</span>
          )}
          <leftAction.icon size={24} />
        </div>
      )}

      {/* Main card content */}
      <div
        ref={swipeRef}
        className={cn(
          'relative bg-white border border-gray-200 rounded-lg',
          'touch-target transition-transform',
          isAnimating && 'duration-300 ease-out',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 0.3s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
  threshold?: number
  className?: string
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const { success, error } = useHapticFeedback()

  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const scrollTop = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const container = containerRef.current
    if (!container) return

    scrollTop.current = container.scrollTop
    if (scrollTop.current === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling) return

    const container = containerRef.current
    if (!container || container.scrollTop > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    if (diff > 0) {
      e.preventDefault()
      const resistance = 0.4
      const distance = Math.min(diff * resistance, threshold * 1.5)
      setPullDistance(distance)
      
      // Haptic feedback at threshold
      if (distance >= threshold && pullDistance < threshold) {
        success()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
        success()
      } catch (err) {
        error()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }

  const refreshProgress = Math.min(pullDistance / threshold, 1)

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'bg-gray-50 border-b border-gray-200 transition-all duration-200',
          (isPulling || isRefreshing) ? 'opacity-100' : 'opacity-0'
        )}
        style={{ 
          height: Math.max(pullDistance, isRefreshing ? 60 : 0),
          transform: `translateY(-${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`
        }}
      >
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCwIcon 
            size={20} 
            className={cn(
              'transition-transform duration-200',
              (isRefreshing || refreshProgress >= 1) && 'animate-spin'
            )}
            style={{ 
              transform: `rotate(${refreshProgress * 180}deg)` 
            }}
          />
          <span className="text-sm font-medium">
            {isRefreshing 
              ? 'Refreshing...' 
              : refreshProgress >= 1 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {children}
    </div>
  )
}

// Touch-optimized carousel/slider
interface TouchCarouselProps {
  items: React.ReactNode[]
  className?: string
  showIndicators?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  onSlideChange?: (index: number) => void
}

export const TouchCarousel: React.FC<TouchCarouselProps> = ({
  items,
  className,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  onSlideChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { impact } = useHapticFeedback()

  const carouselRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return
    
    setIsTransitioning(true)
    setCurrentIndex(index)
    onSlideChange?.(index)
    impact('light')
    
    setTimeout(() => setIsTransitioning(false), 300)
  }, [currentIndex, isTransitioning, onSlideChange, impact])

  const nextSlide = useCallback(() => {
    const next = (currentIndex + 1) % items.length
    goToSlide(next)
  }, [currentIndex, items.length, goToSlide])

  const prevSlide = useCallback(() => {
    const prev = (currentIndex - 1 + items.length) % items.length
    goToSlide(prev)
  }, [currentIndex, items.length, goToSlide])

  // Auto-play functionality
  React.useEffect(() => {
    if (autoPlay && items.length > 1) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval)
      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current)
        }
      }
    }
  }, [autoPlay, autoPlayInterval, nextSlide, items.length])

  const swipeRef = useSwipeGestures({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    threshold: 50
  })

  if (items.length === 0) return null

  return (
    <div className={cn('relative w-full', className)}>
      {/* Carousel container */}
      <div 
        ref={swipeRef}
        className="relative overflow-hidden rounded-lg touch-pan-y"
      >
        <div 
          className={cn(
            'flex transition-transform duration-300 ease-out',
            isTransitioning && 'transition-transform'
          )}
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${items.length * 100}%`
          }}
        >
          {items.map((item, index) => (
            <div 
              key={index} 
              className="w-full flex-shrink-0"
              style={{ width: `${100 / items.length}%` }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2',
              'bg-black/20 hover:bg-black/40 text-white',
              'rounded-full p-2 touch-target',
              'transition-all duration-200 backdrop-blur-sm'
            )}
            disabled={isTransitioning}
          >
            <ChevronLeftIcon size={20} />
          </button>
          
          <button
            onClick={nextSlide}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'bg-black/20 hover:bg-black/40 text-white',
              'rounded-full p-2 touch-target',
              'transition-all duration-200 backdrop-blur-sm'
            )}
            disabled={isTransitioning}
          >
            <ChevronRightIcon size={20} />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                'touch-target min-w-[32px] min-h-[32px] flex items-center justify-center',
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              )}
              disabled={isTransitioning}
            >
              <div className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentIndex ? 'bg-blue-600' : 'bg-white/75'
              )} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Touch-optimized button with press states
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  hapticFeedback?: boolean
  pressAnimation?: boolean
  children: React.ReactNode
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'md',
  hapticFeedback = true,
  pressAnimation = true,
  children,
  className,
  onClick,
  disabled,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const { impact } = useHapticFeedback()

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]'
  }

  const handleTouchStart = () => {
    if (disabled) return
    setIsPressed(true)
    if (hapticFeedback) impact('light')
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (hapticFeedback) impact('medium')
    onClick?.(e)
  }

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-150',
        'touch-manipulation select-none',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        pressAnimation && isPressed && 'scale-95',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
} 