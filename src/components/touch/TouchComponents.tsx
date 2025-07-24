/**
 * Touch-Optimized Components
 * Mobile-first components with gesture support and haptic feedback
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { gestureService, GestureEvent, HapticPattern } from '@/lib/services/gesture-service';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Heart, 
  Share2, 
  Bookmark,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  RefreshCw
} from 'lucide-react';

// Swipeable Card Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  className?: string;
  hapticFeedback?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  leftAction,
  rightAction,
  className,
  hapticFeedback = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [actionRevealed, setActionRevealed] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const element = cardRef.current;
    gestureService.optimizeForTouch(element);

    // Handle swipe gestures
    const swipeCleanup = gestureService.onSwipe(element, 'any', (event: GestureEvent) => {
      if (hapticFeedback) {
        gestureService.triggerHaptic('selection');
      }

      if (event.direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (event.direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }

      setSwipeOffset(0);
      setActionRevealed(null);
    });

    // Handle drag for preview
    const dragCleanup = gestureService.addGestureListener(element, 'drag', (event: GestureEvent) => {
      setIsDragging(true);
      const offset = Math.max(-120, Math.min(120, event.deltaX));
      setSwipeOffset(offset);

      if (offset < -60 && leftAction) {
        setActionRevealed('left');
      } else if (offset > 60 && rightAction) {
        setActionRevealed('right');
      } else {
        setActionRevealed(null);
      }
    });

    // Handle tap
    const tapCleanup = gestureService.onTap(element, () => {
      if (!isDragging && onTap) {
        if (hapticFeedback) {
          gestureService.triggerHaptic('light');
        }
        onTap();
      }
      setIsDragging(false);
    });

    return () => {
      swipeCleanup();
      dragCleanup();
      tapCleanup();
    };
  }, [onSwipeLeft, onSwipeRight, onTap, leftAction, rightAction, hapticFeedback, isDragging]);

  return (
    <div className="relative overflow-hidden">
      {/* Left Action */}
      {leftAction && (
        <div 
          className={cn(
            "absolute left-0 top-0 h-full w-32 flex items-center justify-center transition-opacity",
            leftAction.color,
            actionRevealed === 'left' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="text-center text-white">
            {leftAction.icon}
            <div className="text-xs mt-1">{leftAction.label}</div>
          </div>
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div 
          className={cn(
            "absolute right-0 top-0 h-full w-32 flex items-center justify-center transition-opacity",
            rightAction.color,
            actionRevealed === 'right' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="text-center text-white">
            {rightAction.icon}
            <div className="text-xs mt-1">{rightAction.label}</div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <Card
        ref={cardRef}
        className={cn(
          "transition-transform duration-200 ease-out cursor-pointer",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          backgroundColor: actionRevealed ? 'rgba(255, 255, 255, 0.95)' : undefined
        }}
      >
        {children}
      </Card>
    </div>
  );
};

// Long Press Menu Component
interface LongPressMenuProps {
  children: React.ReactNode;
  menuItems: {
    icon: React.ReactNode;
    label: string;
    action: () => void;
    destructive?: boolean;
  }[];
  className?: string;
  hapticFeedback?: boolean;
}

export const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  menuItems,
  className,
  hapticFeedback = true
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    gestureService.optimizeForTouch(element);

    const longPressCleanup = gestureService.onLongPress(element, (event: GestureEvent) => {
      if (hapticFeedback) {
        gestureService.triggerHaptic('medium');
      }

      setMenuPosition({ x: event.startX, y: event.startY });
      setIsMenuVisible(true);
      event.preventDefault();
    });

    // Close menu on outside click
    const handleClickOutside = (event: Event) => {
      if (isMenuVisible && !element.contains(event.target as Node)) {
        setIsMenuVisible(false);
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      longPressCleanup();
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuVisible, hapticFeedback]);

  const handleMenuItemClick = (action: () => void) => {
    if (hapticFeedback) {
      gestureService.triggerHaptic('light');
    }
    action();
    setIsMenuVisible(false);
  };

  return (
    <div className="relative">
      <div ref={elementRef} className={className}>
        {children}
      </div>

      {/* Context Menu */}
      {isMenuVisible && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 min-w-40"
          style={{
            left: Math.min(menuPosition.x, window.innerWidth - 160),
            top: Math.min(menuPosition.y, window.innerHeight - 200)
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                item.destructive && "text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
              )}
              onClick={() => handleMenuItemClick(item.action)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Pinch-to-Zoom Image Component
interface PinchZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  hapticFeedback?: boolean;
}

export const PinchZoomImage: React.FC<PinchZoomImageProps> = ({
  src,
  alt,
  className,
  hapticFeedback = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    gestureService.optimizeForTouch(container);

    // Handle pinch to zoom
    const pinchCleanup = gestureService.onPinch(container, (event: GestureEvent) => {
      if (event.scale && event.scale !== 1) {
        const newScale = Math.max(0.5, Math.min(3, scale * event.scale));
        setScale(newScale);

        if (hapticFeedback && Math.abs(event.scale - 1) > 0.1) {
          gestureService.triggerHaptic('light');
        }
      }
    });

    // Handle drag to pan when zoomed
    const dragCleanup = gestureService.addGestureListener(container, 'drag', (event: GestureEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setPosition(prev => ({
          x: prev.x + event.deltaX,
          y: prev.y + event.deltaY
        }));
      }
    });

    // Handle double-tap to reset/zoom
    const doubleTapCleanup = gestureService.onDoubleTap(container, () => {
      if (hapticFeedback) {
        gestureService.triggerHaptic('medium');
      }

      if (scale === 1) {
        setScale(2);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    });

    return () => {
      pinchCleanup();
      dragCleanup();
      doubleTapCleanup();
    };
  }, [scale, hapticFeedback]);

  return (
    <div 
      ref={containerRef}
      className={cn("overflow-hidden touch-none", className)}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-transform origin-center"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          cursor: scale > 1 ? 'grab' : 'zoom-in'
        }}
        draggable={false}
      />
      
      {/* Zoom Controls */}
      {scale !== 1 && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setScale(Math.max(0.5, scale - 0.25));
              if (hapticFeedback) gestureService.triggerHaptic('light');
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
              if (hapticFeedback) gestureService.triggerHaptic('light');
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setScale(Math.min(3, scale + 0.25));
              if (hapticFeedback) gestureService.triggerHaptic('light');
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Haptic Button Component
interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  hapticPattern?: HapticPattern;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export const HapticButton: React.FC<HapticButtonProps> = ({
  children,
  hapticPattern = 'light',
  variant = 'default',
  size = 'default',
  className,
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      gestureService.triggerHaptic(hapticPattern);
      onClick?.(event);
    }
  }, [disabled, hapticPattern, onClick]);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

// Pull-to-Refresh Component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
  hapticFeedback?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
  hapticFeedback = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    const dragCleanup = gestureService.addGestureListener(container, 'drag', (event: GestureEvent) => {
      // Only allow pull-to-refresh from the top
      if (container.scrollTop === 0 && event.deltaY > 0) {
        const distance = Math.min(event.deltaY, refreshThreshold * 1.5);
        setPullDistance(distance);

        if (distance >= refreshThreshold && !canRefresh) {
          setCanRefresh(true);
          if (hapticFeedback) {
            gestureService.triggerHaptic('medium');
          }
        } else if (distance < refreshThreshold && canRefresh) {
          setCanRefresh(false);
        }

        event.preventDefault();
      }
    });

    const swipeCleanup = gestureService.onSwipe(container, 'down', async (event: GestureEvent) => {
      if (container.scrollTop === 0 && pullDistance >= refreshThreshold) {
        setIsRefreshing(true);
        if (hapticFeedback) {
          gestureService.triggerHaptic('success');
        }

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setCanRefresh(false);
        }
      } else {
        setPullDistance(0);
        setCanRefresh(false);
      }
    });

    return () => {
      dragCleanup();
      swipeCleanup();
    };
  }, [onRefresh, refreshThreshold, hapticFeedback, pullDistance, canRefresh]);

  const pullProgress = Math.min((pullDistance / refreshThreshold) * 100, 100);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ transform: `translateY(${Math.min(pullDistance * 0.5, 40)}px)` }}
    >
      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center py-4 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw 
              className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin",
                canRefresh && "text-green-600"
              )} 
            />
            <span className="text-sm">
              {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
          <Progress value={pullProgress} className="w-24 mt-2" />
        </div>
      )}

      {children}
    </div>
  );
};

// Touch-Optimized Slider Component
interface TouchSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  hapticFeedback?: boolean;
}

export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  hapticFeedback = true
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    gestureService.optimizeForTouch(slider);

    const dragCleanup = gestureService.addGestureListener(slider, 'drag', (event: GestureEvent) => {
      setIsDragging(true);
      
      const rect = slider.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, event.endX / rect.width));
      const newValue = min + (max - min) * percentage;
      const steppedValue = Math.round(newValue / step) * step;

      if (Math.abs(steppedValue - value) >= step) {
        onValueChange(steppedValue);
        if (hapticFeedback) {
          gestureService.triggerHaptic('selection');
        }
      }
    });

    const tapCleanup = gestureService.onTap(slider, (event: GestureEvent) => {
      if (!isDragging) {
        const rect = slider.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, event.startX / rect.width));
        const newValue = min + (max - min) * percentage;
        const steppedValue = Math.round(newValue / step) * step;

        onValueChange(steppedValue);
        if (hapticFeedback) {
          gestureService.triggerHaptic('light');
        }
      }
      setIsDragging(false);
    });

    return () => {
      dragCleanup();
      tapCleanup();
    };
  }, [value, onValueChange, min, max, step, hapticFeedback, isDragging]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div 
      ref={sliderRef}
      className={cn(
        "relative h-12 flex items-center cursor-pointer touch-none",
        className
      )}
    >
      {/* Track */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        {/* Fill */}
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Thumb */}
      <div 
        className="absolute w-6 h-6 bg-white border-2 border-blue-600 rounded-full shadow-md transform -translate-y-1/2 transition-all duration-200"
        style={{ 
          left: `${percentage}%`, 
          transform: `translateX(-50%) translateY(-50%) ${isDragging ? 'scale(1.2)' : 'scale(1)'}` 
        }}
      />
      
      {/* Value Display */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <Badge variant="secondary" className="text-xs">
          {value}
        </Badge>
      </div>
    </div>
  );
};

// Gesture Demo Component
export const GestureDemo: React.FC = () => {
  const [gestureLog, setGestureLog] = useState<string[]>([]);
  const [hapticSupported, setHapticSupported] = useState(false);

  useEffect(() => {
    setHapticSupported(gestureService.isHapticSupported());
  }, []);

  const addToLog = (gesture: string) => {
    setGestureLog(prev => [`${new Date().toLocaleTimeString()}: ${gesture}`, ...prev.slice(0, 4)]);
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Gesture & Touch Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Haptic Feedback Support:</span>
            <Badge variant={hapticSupported ? "default" : "secondary"}>
              {hapticSupported ? 'Supported' : 'Not Available'}
            </Badge>
          </div>

          {/* Gesture Log */}
          <div>
            <h4 className="font-medium mb-2">Gesture Log</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-sm">
              {gestureLog.length === 0 ? (
                <div className="text-muted-foreground">Try gestures below...</div>
              ) : (
                gestureLog.map((log, index) => (
                  <div key={index} className="font-mono text-xs">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Swipeable Card Demo */}
          <div>
            <h4 className="font-medium mb-2">Swipeable Card</h4>
            <SwipeableCard
              onSwipeLeft={() => addToLog('Swiped left')}
              onSwipeRight={() => addToLog('Swiped right')}
              onTap={() => addToLog('Tapped card')}
              leftAction={{
                icon: <Heart className="h-5 w-5" />,
                color: 'bg-red-500',
                label: 'Like'
              }}
              rightAction={{
                icon: <Share2 className="h-5 w-5" />,
                color: 'bg-blue-500',
                label: 'Share'
              }}
            >
              <CardContent className="p-4">
                <p className="text-sm">Swipe left/right or tap me!</p>
              </CardContent>
            </SwipeableCard>
          </div>

          {/* Haptic Buttons */}
          <div>
            <h4 className="font-medium mb-2">Haptic Buttons</h4>
            <div className="flex gap-2 flex-wrap">
              <HapticButton 
                hapticPattern="light" 
                size="sm"
                onClick={() => addToLog('Light haptic')}
              >
                Light
              </HapticButton>
              <HapticButton 
                hapticPattern="medium" 
                size="sm"
                onClick={() => addToLog('Medium haptic')}
              >
                Medium
              </HapticButton>
              <HapticButton 
                hapticPattern="heavy" 
                size="sm"
                onClick={() => addToLog('Heavy haptic')}
              >
                Heavy
              </HapticButton>
              <HapticButton 
                hapticPattern="success" 
                size="sm"
                onClick={() => addToLog('Success haptic')}
              >
                Success
              </HapticButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 