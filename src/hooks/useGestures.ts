/**
 * Gesture and Touch Hooks
 * React hooks for handling gestures and touch interactions
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { gestureService, GestureEvent, GestureOptions, SwipeDirection, HapticPattern } from '@/lib/services/gesture-service';

// Generic gesture hook
export function useGesture<T extends HTMLElement = HTMLElement>(
  gestureType: 'swipe' | 'tap' | 'double-tap' | 'long-press' | 'pinch' | 'drag',
  handler: (event: GestureEvent) => void,
  options: GestureOptions = {}
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const cleanup = gestureService.addGestureListener(
      elementRef.current,
      gestureType,
      handler,
      options
    );

    return cleanup;
  }, [gestureType, handler, options]);

  return elementRef;
}

// Swipe gesture hook
export function useSwipe<T extends HTMLElement = HTMLElement>(
  direction: SwipeDirection | 'any',
  handler: (event: GestureEvent) => void,
  options: GestureOptions = {}
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const cleanup = gestureService.onSwipe(
      elementRef.current,
      direction,
      handler,
      options
    );

    return cleanup;
  }, [direction, handler, options]);

  return elementRef;
}

// Tap gesture hook
export function useTap<T extends HTMLElement = HTMLElement>(
  handler: (event: GestureEvent) => void,
  options: GestureOptions = {}
) {
  return useGesture<T>('tap', handler, options);
}

// Double-tap gesture hook
export function useDoubleTap<T extends HTMLElement = HTMLElement>(
  handler: (event: GestureEvent) => void,
  options: GestureOptions = {}
) {
  return useGesture<T>('double-tap', handler, options);
}

// Long-press gesture hook
export function useLongPress<T extends HTMLElement = HTMLElement>(
  handler: (event: GestureEvent) => void,
  duration: number = 500
) {
  return useGesture<T>('long-press', handler, { timeThreshold: duration });
}

// Pinch gesture hook
export function usePinch<T extends HTMLElement = HTMLElement>(
  handler: (event: GestureEvent) => void,
  options: GestureOptions = {}
) {
  return useGesture<T>('pinch', handler, options);
}

// Drag gesture hook
export function useDrag<T extends HTMLElement = HTMLElement>(
  handler: (event: GestureEvent) => void,
  options: GestureOptions = {}
) {
  return useGesture<T>('drag', handler, options);
}

// Haptic feedback hook
export function useHaptic() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(gestureService.isHapticSupported());
  }, []);

  const triggerHaptic = useCallback(async (pattern: HapticPattern = 'light') => {
    return await gestureService.triggerHaptic(pattern);
  }, []);

  return {
    isSupported,
    triggerHaptic
  };
}

// Touch optimization hook
export function useTouchOptimization<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    gestureService.optimizeForTouch(elementRef.current);
  }, []);

  return elementRef;
}

// Swipeable card hook
export function useSwipeableCard<T extends HTMLElement = HTMLElement>(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  hapticFeedback?: boolean;
}) {
  const elementRef = useRef<T>(null);
  const [swipeState, setSwipeState] = useState({
    offset: 0,
    isDragging: false,
    direction: null as SwipeDirection | null
  });

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    // Optimize for touch
    gestureService.optimizeForTouch(element);

    // Handle swipe gestures
    const swipeCleanup = gestureService.onSwipe(element, 'any', (event) => {
      if (options.hapticFeedback !== false) {
        gestureService.triggerHaptic('selection');
      }

      if (event.direction === 'left' && options.onSwipeLeft) {
        options.onSwipeLeft();
      } else if (event.direction === 'right' && options.onSwipeRight) {
        options.onSwipeRight();
      }

      setSwipeState({ offset: 0, isDragging: false, direction: null });
    });

    // Handle drag for preview
    const dragCleanup = gestureService.addGestureListener(element, 'drag', (event) => {
      setSwipeState({
        offset: event.deltaX,
        isDragging: true,
        direction: Math.abs(event.deltaX) > 30 ? (event.deltaX > 0 ? 'right' : 'left') : null
      });
    });

    // Handle tap
    const tapCleanup = gestureService.onTap(element, () => {
      if (!swipeState.isDragging && options.onTap) {
        if (options.hapticFeedback !== false) {
          gestureService.triggerHaptic('light');
        }
        options.onTap();
      }
    });

    return () => {
      swipeCleanup();
      dragCleanup();
      tapCleanup();
    };
  }, [options, swipeState.isDragging]);

  return {
    elementRef,
    swipeState
  };
}

// Pull-to-refresh hook
export function usePullToRefresh<T extends HTMLElement = HTMLElement>(
  onRefresh: () => Promise<void>,
  threshold: number = 80
) {
  const elementRef = useRef<T>(null);
  const [pullState, setPullState] = useState({
    distance: 0,
    isRefreshing: false,
    canRefresh: false
  });

  const refresh = useCallback(async () => {
    if (pullState.isRefreshing) return;

    setPullState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      await onRefresh();
    } finally {
      setPullState({
        distance: 0,
        isRefreshing: false,
        canRefresh: false
      });
    }
  }, [onRefresh, pullState.isRefreshing]);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    const dragCleanup = gestureService.addGestureListener(element, 'drag', (event) => {
      // Only allow pull-to-refresh from the top
      if (element.scrollTop === 0 && event.deltaY > 0) {
        const distance = Math.min(event.deltaY, threshold * 1.5);
        const canRefresh = distance >= threshold;

        setPullState(prev => {
          if (canRefresh && !prev.canRefresh) {
            gestureService.triggerHaptic('medium');
          }
          return {
            ...prev,
            distance,
            canRefresh
          };
        });

        event.preventDefault();
      }
    });

    const swipeCleanup = gestureService.onSwipe(element, 'down', async (event) => {
      if (element.scrollTop === 0 && pullState.canRefresh) {
        gestureService.triggerHaptic('success');
        await refresh();
      } else {
        setPullState(prev => ({ ...prev, distance: 0, canRefresh: false }));
      }
    });

    return () => {
      dragCleanup();
      swipeCleanup();
    };
  }, [threshold, pullState.canRefresh, refresh]);

  return {
    elementRef,
    pullState,
    refresh
  };
}

// Pinch-to-zoom hook
export function usePinchZoom<T extends HTMLElement = HTMLElement>(options: {
  minScale?: number;
  maxScale?: number;
  hapticFeedback?: boolean;
} = {}) {
  const elementRef = useRef<T>(null);
  const [zoomState, setZoomState] = useState({
    scale: 1,
    position: { x: 0, y: 0 },
    isDragging: false
  });

  const { minScale = 0.5, maxScale = 3, hapticFeedback = true } = options;

  const resetZoom = useCallback(() => {
    setZoomState({
      scale: 1,
      position: { x: 0, y: 0 },
      isDragging: false
    });
    if (hapticFeedback) {
      gestureService.triggerHaptic('medium');
    }
  }, [hapticFeedback]);

  const zoomTo = useCallback((scale: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
    setZoomState(prev => ({
      ...prev,
      scale: clampedScale,
      position: clampedScale === 1 ? { x: 0, y: 0 } : prev.position
    }));
    if (hapticFeedback) {
      gestureService.triggerHaptic('light');
    }
  }, [minScale, maxScale, hapticFeedback]);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    gestureService.optimizeForTouch(element);

    // Handle pinch to zoom
    const pinchCleanup = gestureService.onPinch(element, (event) => {
      if (event.scale && event.scale !== 1) {
        const newScale = Math.max(minScale, Math.min(maxScale, zoomState.scale * event.scale));
        setZoomState(prev => ({ ...prev, scale: newScale }));

        if (hapticFeedback && Math.abs(event.scale - 1) > 0.1) {
          gestureService.triggerHaptic('light');
        }
      }
    });

    // Handle drag to pan when zoomed
    const dragCleanup = gestureService.addGestureListener(element, 'drag', (event) => {
      if (zoomState.scale > 1) {
        setZoomState(prev => ({
          ...prev,
          isDragging: true,
          position: {
            x: prev.position.x + event.deltaX,
            y: prev.position.y + event.deltaY
          }
        }));
      }
    });

    // Handle double-tap to reset/zoom
    const doubleTapCleanup = gestureService.onDoubleTap(element, () => {
      if (zoomState.scale === 1) {
        zoomTo(2);
      } else {
        resetZoom();
      }
    });

    return () => {
      pinchCleanup();
      dragCleanup();
      doubleTapCleanup();
    };
  }, [zoomState.scale, minScale, maxScale, hapticFeedback, zoomTo, resetZoom]);

  return {
    elementRef,
    zoomState,
    resetZoom,
    zoomTo
  };
}

// Long-press menu hook
export function useLongPressMenu<T extends HTMLElement = HTMLElement>(
  menuItems: Array<{
    label: string;
    action: () => void;
    destructive?: boolean;
  }>,
  hapticFeedback: boolean = true
) {
  const elementRef = useRef<T>(null);
  const [menuState, setMenuState] = useState({
    isVisible: false,
    position: { x: 0, y: 0 }
  });

  const showMenu = useCallback((x: number, y: number) => {
    setMenuState({
      isVisible: true,
      position: { x, y }
    });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const handleMenuAction = useCallback((action: () => void) => {
    if (hapticFeedback) {
      gestureService.triggerHaptic('light');
    }
    action();
    hideMenu();
  }, [hapticFeedback, hideMenu]);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    gestureService.optimizeForTouch(element);

    const longPressCleanup = gestureService.onLongPress(element, (event) => {
      if (hapticFeedback) {
        gestureService.triggerHaptic('medium');
      }
      showMenu(event.startX, event.startY);
      event.preventDefault();
    });

    // Close menu on outside click
    const handleOutsideClick = (event: Event) => {
      if (menuState.isVisible && !element.contains(event.target as Node)) {
        hideMenu();
      }
    };

    if (menuState.isVisible) {
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      longPressCleanup();
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [hapticFeedback, showMenu, hideMenu, menuState.isVisible]);

  return {
    elementRef,
    menuState,
    hideMenu,
    handleMenuAction
  };
}

// Touch slider hook
export function useTouchSlider<T extends HTMLElement = HTMLElement>(
  value: number,
  onValueChange: (value: number) => void,
  options: {
    min?: number;
    max?: number;
    step?: number;
    hapticFeedback?: boolean;
  } = {}
) {
  const elementRef = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { min = 0, max = 100, step = 1, hapticFeedback = true } = options;

  const updateValue = useCallback((clientX: number) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = min + (max - min) * percentage;
    const steppedValue = Math.round(newValue / step) * step;

    if (Math.abs(steppedValue - value) >= step) {
      onValueChange(steppedValue);
      if (hapticFeedback) {
        gestureService.triggerHaptic('selection');
      }
    }
  }, [value, onValueChange, min, max, step, hapticFeedback]);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    gestureService.optimizeForTouch(element);

    const dragCleanup = gestureService.addGestureListener(element, 'drag', (event) => {
      setIsDragging(true);
      updateValue(event.endX);
    });

    const tapCleanup = gestureService.onTap(element, (event) => {
      if (!isDragging) {
        updateValue(event.startX);
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
  }, [updateValue, isDragging, hapticFeedback]);

  return {
    elementRef,
    isDragging
  };
}

// Gesture cleanup hook
export function useGestureCleanup() {
  useEffect(() => {
    return () => {
      gestureService.cleanup();
    };
  }, []);
} 