'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPullToRefresh?: () => void;
  swipeThreshold?: number;
  longPressThreshold?: number;
  doubleTapThreshold?: number;
  pullToRefreshThreshold?: number;
  enablePullToRefresh?: boolean;
  preventDefaultScroll?: boolean;
}

export interface TouchState {
  isScrolledToTop: boolean;
  isPulling: boolean;
  pullDistance: number;
  isLongPressing: boolean;
  gestureType: 'none' | 'swipe' | 'pinch' | 'long-press' | 'double-tap' | 'pull-refresh';
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchIn,
    onPinchOut,
    onLongPress,
    onDoubleTap,
    onPullToRefresh,
    swipeThreshold = 50,
    longPressThreshold = 500,
    doubleTapThreshold = 300,
    pullToRefreshThreshold = 100,
    enablePullToRefresh = false,
    preventDefaultScroll = false,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressingRef = useRef(false);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const pullStartYRef = useRef<number | null>(null);

  const [touchState, setTouchState] = useState<TouchState>({
    isScrolledToTop: true,
    isPulling: false,
    pullDistance: 0,
    isLongPressing: false,
    gestureType: 'none',
  });

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // Check if element is scrolled to top
  const checkScrollPosition = useCallback(() => {
    if (!elementRef.current) return true;
    const scrollTop = elementRef.current.scrollTop || 0;
    const isAtTop = scrollTop <= 5; // Small threshold for floating point precision
    setTouchState(prev => ({ ...prev, isScrolledToTop: isAtTop }));
    return isAtTop;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };

    // Check for double tap
    if (now - lastTapTimeRef.current < doubleTapThreshold && onDoubleTap) {
      onDoubleTap();
      setTouchState(prev => ({ ...prev, gestureType: 'double-tap' }));
      lastTapTimeRef.current = 0; // Reset to prevent triple tap
      return;
    }
    lastTapTimeRef.current = now;

    // Set up long press detection
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressingRef.current = true;
        setTouchState(prev => ({ ...prev, isLongPressing: true, gestureType: 'long-press' }));
        onLongPress();
        
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, longPressThreshold);
    }

    // Initialize pinch detection
    if (e.touches.length === 2) {
      initialPinchDistanceRef.current = getTouchDistance(e.touches);
      setTouchState(prev => ({ ...prev, gestureType: 'pinch' }));
    }

    // Initialize pull to refresh
    if (enablePullToRefresh && checkScrollPosition() && e.touches.length === 1) {
      pullStartYRef.current = touch.clientY;
    }

    if (preventDefaultScroll) {
      e.preventDefault();
    }
  }, [
    onDoubleTap,
    onLongPress,
    doubleTapThreshold,
    longPressThreshold,
    getTouchDistance,
    checkScrollPosition,
    enablePullToRefresh,
    preventDefaultScroll,
  ]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Cancel long press if finger moves too much
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isLongPressingRef.current) {
        isLongPressingRef.current = false;
        setTouchState(prev => ({ ...prev, isLongPressing: false }));
      }
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && initialPinchDistanceRef.current) {
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialPinchDistanceRef.current;
      
      if (scale > 1.1 && onPinchOut) {
        onPinchOut(scale);
      } else if (scale < 0.9 && onPinchIn) {
        onPinchIn(scale);
      }
    }

    // Handle pull to refresh
    if (enablePullToRefresh && pullStartYRef.current !== null && touchState.isScrolledToTop) {
      const pullDistance = Math.max(0, touch.clientY - pullStartYRef.current);
      const isPulling = pullDistance > 20;
      
      setTouchState(prev => ({
        ...prev,
        isPulling,
        pullDistance,
        gestureType: isPulling ? 'pull-refresh' : 'none',
      }));

      if (pullDistance > pullToRefreshThreshold && onPullToRefresh) {
        // Add haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(25);
        }
      }
    }

    if (preventDefaultScroll && (touchState.isPulling || e.touches.length > 1)) {
      e.preventDefault();
    }
  }, [
    getTouchDistance,
    onPinchIn,
    onPinchOut,
    enablePullToRefresh,
    pullToRefreshThreshold,
    onPullToRefresh,
    touchState.isScrolledToTop,
    touchState.isPulling,
    preventDefaultScroll,
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle swipe gestures
    if (!isLongPressingRef.current && deltaTime < 500) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > swipeThreshold || absY > swipeThreshold) {
        setTouchState(prev => ({ ...prev, gestureType: 'swipe' }));

        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }
    }

    // Handle pull to refresh
    if (enablePullToRefresh && touchState.pullDistance > pullToRefreshThreshold && onPullToRefresh) {
      onPullToRefresh();
    }

    // Reset state
    touchStartRef.current = null;
    isLongPressingRef.current = false;
    initialPinchDistanceRef.current = null;
    pullStartYRef.current = null;

    setTouchState(prev => ({
      ...prev,
      isPulling: false,
      pullDistance: 0,
      isLongPressing: false,
      gestureType: 'none',
    }));
  }, [
    swipeThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    enablePullToRefresh,
    pullToRefreshThreshold,
    onPullToRefresh,
    touchState.pullDistance,
  ]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    checkScrollPosition();
  }, [checkScrollPosition]);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add passive event listeners for better performance
    const touchStartOptions: AddEventListenerOptions = { passive: !preventDefaultScroll };
    const touchMoveOptions: AddEventListenerOptions = { passive: !preventDefaultScroll };

    element.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    element.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('scroll', handleScroll);
      
      // Clean up timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll, preventDefaultScroll]);

  // Check scroll position on mount
  useEffect(() => {
    checkScrollPosition();
  }, [checkScrollPosition]);

  return {
    ref: elementRef,
    touchState,
    // Helper functions
    resetGesture: useCallback(() => {
      setTouchState(prev => ({
        ...prev,
        gestureType: 'none',
        isPulling: false,
        pullDistance: 0,
        isLongPressing: false,
      }));
    }, []),
    
    // Manual trigger functions
    triggerHapticFeedback: useCallback((duration: number = 50) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
      }
    }, []),
  };
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasTouch: false,
    hasHaptic: false,
    hasShare: false,
    hasInstallPrompt: false,
    hasNotifications: false,
    hasGeolocation: false,
    hasCamera: false,
    isStandalone: false,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    const detectCapabilities = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasHaptic = 'vibrate' in navigator;
      const hasShare = 'share' in navigator;
      const hasNotifications = 'Notification' in window;
      const hasGeolocation = 'geolocation' in navigator;
      const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      const isAndroid = /android/i.test(userAgent);

      setCapabilities({
        hasTouch,
        hasHaptic,
        hasShare,
        hasInstallPrompt: false, // Will be set by beforeinstallprompt event
        hasNotifications,
        hasGeolocation,
        hasCamera,
        isStandalone,
        isMobile,
        isIOS,
        isAndroid,
      });
    };

    detectCapabilities();

    // Listen for install prompt
    const handleBeforeInstallPrompt = () => {
      setCapabilities(prev => ({ ...prev, hasInstallPrompt: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return capabilities;
}

// Hook for PWA install functionality
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInAppBrowser = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInAppBrowser);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      const result = await installPrompt.prompt();
      const { outcome } = await result.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
} 