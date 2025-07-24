/**
 * Gesture and Touch Service
 * Handles mobile gestures, haptic feedback, and touch optimization
 */

export type GestureType = 'swipe' | 'pinch' | 'tap' | 'double-tap' | 'long-press' | 'drag' | 'rotate';
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification' | 'success' | 'warning' | 'error';

export interface GestureEvent {
  type: GestureType;
  element: HTMLElement;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  velocity: number;
  direction?: SwipeDirection;
  scale?: number;
  rotation?: number;
  duration: number;
  touches: number;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface GestureOptions {
  threshold?: number;
  velocity?: number;
  timeThreshold?: number;
  preventScroll?: boolean;
  passive?: boolean;
  capture?: boolean;
}

export interface TouchPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

export interface GestureHandler {
  (event: GestureEvent): void;
}

export class GestureService {
  private static instance: GestureService;
  private activeElements = new Map<HTMLElement, GestureListener>();
  private hapticSupport: boolean = false;

  public static getInstance(): GestureService {
    if (!GestureService.instance) {
      GestureService.instance = new GestureService();
    }
    return GestureService.instance;
  }

  private constructor() {
    this.detectHapticSupport();
  }

  /**
   * Detect if haptic feedback is supported
   */
  private detectHapticSupport(): void {
    this.hapticSupport = 'vibrate' in navigator || 
                        'hapticFeedback' in navigator ||
                        ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any));
  }

  /**
   * Add gesture listener to element
   */
  public addGestureListener(
    element: HTMLElement,
    gestureType: GestureType,
    handler: GestureHandler,
    options: GestureOptions = {}
  ): () => void {
    if (!this.activeElements.has(element)) {
      this.activeElements.set(element, new GestureListener(element, options));
    }

    const gestureListener = this.activeElements.get(element)!;
    gestureListener.addHandler(gestureType, handler);

    // Return cleanup function
    return () => {
      gestureListener.removeHandler(gestureType, handler);
      if (gestureListener.isEmpty()) {
        gestureListener.destroy();
        this.activeElements.delete(element);
      }
    };
  }

  /**
   * Remove all gesture listeners from element
   */
  public removeAllGestureListeners(element: HTMLElement): void {
    const gestureListener = this.activeElements.get(element);
    if (gestureListener) {
      gestureListener.destroy();
      this.activeElements.delete(element);
    }
  }

  /**
   * Trigger haptic feedback
   */
  public async triggerHaptic(pattern: HapticPattern = 'light'): Promise<boolean> {
    if (!this.hapticSupport) {
      return false;
    }

    try {
      // Web Vibration API
      if ('vibrate' in navigator) {
        const vibrationPatterns = {
          light: [10],
          medium: [20],
          heavy: [30],
          selection: [5],
          impact: [15],
          notification: [10, 50, 10],
          success: [5, 25, 5, 25, 5],
          warning: [20, 100, 20],
          error: [50, 50, 50]
        };

        const vibrationPattern = vibrationPatterns[pattern] || vibrationPatterns.light;
        navigator.vibrate(vibrationPattern);
        return true;
      }

      // iOS Haptic Feedback (if available)
      if ('hapticFeedback' in navigator) {
        const hapticType = {
          light: 'impactLight',
          medium: 'impactMedium',
          heavy: 'impactHeavy',
          selection: 'selectionChanged',
          impact: 'impactMedium',
          notification: 'notificationSuccess',
          success: 'notificationSuccess',
          warning: 'notificationWarning',
          error: 'notificationError'
        }[pattern] || 'impactLight';

        (navigator as any).hapticFeedback[hapticType]?.();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }

  /**
   * Check if haptic feedback is supported
   */
  public isHapticSupported(): boolean {
    return this.hapticSupport;
  }

  /**
   * Create swipe gesture shorthand
   */
  public onSwipe(
    element: HTMLElement,
    direction: SwipeDirection | 'any',
    handler: GestureHandler,
    options: GestureOptions = {}
  ): () => void {
    return this.addGestureListener(element, 'swipe', (event) => {
      if (direction === 'any' || event.direction === direction) {
        handler(event);
      }
    }, options);
  }

  /**
   * Create tap gesture shorthand
   */
  public onTap(
    element: HTMLElement,
    handler: GestureHandler,
    options: GestureOptions = {}
  ): () => void {
    return this.addGestureListener(element, 'tap', handler, options);
  }

  /**
   * Create double-tap gesture shorthand
   */
  public onDoubleTap(
    element: HTMLElement,
    handler: GestureHandler,
    options: GestureOptions = {}
  ): () => void {
    return this.addGestureListener(element, 'double-tap', handler, options);
  }

  /**
   * Create long-press gesture shorthand
   */
  public onLongPress(
    element: HTMLElement,
    handler: GestureHandler,
    options: GestureOptions = { timeThreshold: 500 }
  ): () => void {
    return this.addGestureListener(element, 'long-press', handler, options);
  }

  /**
   * Create pinch gesture shorthand
   */
  public onPinch(
    element: HTMLElement,
    handler: GestureHandler,
    options: GestureOptions = {}
  ): () => void {
    return this.addGestureListener(element, 'pinch', handler, options);
  }

  /**
   * Optimize element for touch interactions
   */
  public optimizeForTouch(element: HTMLElement): void {
    // Add touch-action CSS property for better performance
    element.style.touchAction = 'manipulation';
    
    // Add user-select none to prevent text selection during gestures
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    
    // Add webkit-tap-highlight-color to remove blue highlight on iOS
    (element.style as any).webkitTapHighlightColor = 'transparent';
    
    // Ensure cursor is pointer for better UX
    if (getComputedStyle(element).cursor === 'auto') {
      element.style.cursor = 'pointer';
    }
  }

  /**
   * Cleanup all gesture listeners
   */
  public cleanup(): void {
    this.activeElements.forEach((listener) => {
      listener.destroy();
    });
    this.activeElements.clear();
  }
}

/**
 * Individual gesture listener for a specific element
 */
class GestureListener {
  private element: HTMLElement;
  private options: GestureOptions;
  private handlers = new Map<GestureType, Set<GestureHandler>>();
  private touchStartPoints: TouchPoint[] = [];
  private touchCurrentPoints: TouchPoint[] = [];
  private startTime: number = 0;
  private tapCount: number = 0;
  private lastTapTime: number = 0;
  private longPressTimer?: number;
  private isActive: boolean = false;

  constructor(element: HTMLElement, options: GestureOptions = {}) {
    this.element = element;
    this.options = {
      threshold: 30,
      velocity: 0.3,
      timeThreshold: 300,
      preventScroll: false,
      passive: false,
      capture: false,
      ...options
    };

    this.attachEventListeners();
  }

  /**
   * Attach touch event listeners
   */
  private attachEventListeners(): void {
    const listenerOptions = {
      passive: this.options.passive,
      capture: this.options.capture
    };

    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), listenerOptions);
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), listenerOptions);
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), listenerOptions);
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), listenerOptions);

    // Mouse events for desktop testing
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this), listenerOptions);
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this), listenerOptions);
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this), listenerOptions);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    this.startTime = Date.now();
    this.isActive = true;
    this.touchStartPoints = this.getTouchPoints(event.touches);
    this.touchCurrentPoints = [...this.touchStartPoints];

    // Start long press timer
    if (this.handlers.has('long-press')) {
      this.longPressTimer = window.setTimeout(() => {
        this.triggerLongPress(event);
      }, this.options.timeThreshold);
    }

    if (this.options.preventScroll) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isActive) return;

    this.touchCurrentPoints = this.getTouchPoints(event.touches);

    // Clear long press timer if moved too much
    if (this.longPressTimer) {
      const distance = this.calculateDistance(
        this.touchStartPoints[0],
        this.touchCurrentPoints[0]
      );
      
      if (distance > this.options.threshold!) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = undefined;
      }
    }

    // Handle pinch gesture
    if (this.touchCurrentPoints.length === 2 && this.touchStartPoints.length === 2) {
      this.handlePinch(event);
    }

    // Handle drag gesture
    if (this.handlers.has('drag')) {
      this.triggerDrag(event);
    }

    if (this.options.preventScroll) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isActive) return;

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }

    // Handle tap gestures
    if (this.touchStartPoints.length === 1 && this.touchCurrentPoints.length === 1) {
      const distance = this.calculateDistance(
        this.touchStartPoints[0],
        this.touchCurrentPoints[0]
      );

      if (distance < this.options.threshold! && duration < this.options.timeThreshold!) {
        this.handleTap(event, endTime);
      } else if (distance >= this.options.threshold!) {
        this.handleSwipe(event, duration);
      }
    }

    this.isActive = false;
    this.touchStartPoints = [];
    this.touchCurrentPoints = [];
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TouchEvent): void {
    this.isActive = false;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
    
    this.touchStartPoints = [];
    this.touchCurrentPoints = [];
  }

  /**
   * Handle mouse events for desktop testing
   */
  private handleMouseDown(event: MouseEvent): void {
    const mockTouchEvent = this.createMockTouchEvent(event, 'touchstart');
    this.handleTouchStart(mockTouchEvent);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isActive) return;
    const mockTouchEvent = this.createMockTouchEvent(event, 'touchmove');
    this.handleTouchMove(mockTouchEvent);
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isActive) return;
    const mockTouchEvent = this.createMockTouchEvent(event, 'touchend');
    this.handleTouchEnd(mockTouchEvent);
  }

  /**
   * Create mock touch event from mouse event
   */
  private createMockTouchEvent(mouseEvent: MouseEvent, type: string): TouchEvent {
    const touch = {
      identifier: 0,
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY,
      pageX: mouseEvent.pageX,
      pageY: mouseEvent.pageY,
      screenX: mouseEvent.screenX,
      screenY: mouseEvent.screenY,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
      target: mouseEvent.target
    } as Touch;

    return {
      type,
      touches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
      targetTouches: type === 'touchend' ? [] : [touch],
      preventDefault: () => mouseEvent.preventDefault(),
      stopPropagation: () => mouseEvent.stopPropagation()
    } as unknown as TouchEvent;
  }

  /**
   * Get touch points from TouchList
   */
  private getTouchPoints(touches: TouchList): TouchPoint[] {
    const points: TouchPoint[] = [];
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      points.push({
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
        timestamp: Date.now()
      });
    }
    return points;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Calculate velocity
   */
  private calculateVelocity(distance: number, duration: number): number {
    return duration > 0 ? distance / duration : 0;
  }

  /**
   * Determine swipe direction
   */
  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Handle tap gesture
   */
  private handleTap(event: TouchEvent, currentTime: number): void {
    const timeSinceLastTap = currentTime - this.lastTapTime;
    
    if (timeSinceLastTap < 300) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    
    this.lastTapTime = currentTime;

    // Trigger double-tap if available
    if (this.tapCount === 2 && this.handlers.has('double-tap')) {
      this.triggerGesture('double-tap', event);
      this.tapCount = 0;
    } else {
      // Trigger single tap after delay to allow for double-tap
      setTimeout(() => {
        if (this.tapCount === 1 && this.handlers.has('tap')) {
          this.triggerGesture('tap', event);
        }
        this.tapCount = 0;
      }, 300);
    }
  }

  /**
   * Handle swipe gesture
   */
  private handleSwipe(event: TouchEvent, duration: number): void {
    if (!this.handlers.has('swipe')) return;

    const startPoint = this.touchStartPoints[0];
    const endPoint = this.touchCurrentPoints[0];
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = this.calculateDistance(startPoint, endPoint);
    const velocity = this.calculateVelocity(distance, duration);

    if (velocity >= this.options.velocity!) {
      this.triggerGesture('swipe', event, {
        deltaX,
        deltaY,
        distance,
        velocity,
        direction: this.getSwipeDirection(deltaX, deltaY),
        duration
      });
    }
  }

  /**
   * Handle pinch gesture
   */
  private handlePinch(event: TouchEvent): void {
    if (!this.handlers.has('pinch')) return;

    const startDistance = this.calculateDistance(
      this.touchStartPoints[0],
      this.touchStartPoints[1]
    );
    const currentDistance = this.calculateDistance(
      this.touchCurrentPoints[0],
      this.touchCurrentPoints[1]
    );

    const scale = currentDistance / startDistance;

    this.triggerGesture('pinch', event, {
      scale,
      distance: currentDistance,
      duration: Date.now() - this.startTime
    });
  }

  /**
   * Handle long press gesture
   */
  private triggerLongPress(event: TouchEvent): void {
    if (this.handlers.has('long-press')) {
      this.triggerGesture('long-press', event, {
        duration: Date.now() - this.startTime
      });
    }
  }

  /**
   * Handle drag gesture
   */
  private triggerDrag(event: TouchEvent): void {
    const startPoint = this.touchStartPoints[0];
    const currentPoint = this.touchCurrentPoints[0];
    const deltaX = currentPoint.x - startPoint.x;
    const deltaY = currentPoint.y - startPoint.y;
    const distance = this.calculateDistance(startPoint, currentPoint);

    this.triggerGesture('drag', event, {
      deltaX,
      deltaY,
      distance,
      duration: Date.now() - this.startTime
    });
  }

  /**
   * Trigger gesture event
   */
  private triggerGesture(
    type: GestureType,
    originalEvent: TouchEvent,
    additionalData: Partial<GestureEvent> = {}
  ): void {
    const handlers = this.handlers.get(type);
    if (!handlers) return;

    const startPoint = this.touchStartPoints[0] || { x: 0, y: 0 };
    const endPoint = this.touchCurrentPoints[0] || startPoint;

    const gestureEvent: GestureEvent = {
      type,
      element: this.element,
      startX: startPoint.x,
      startY: startPoint.y,
      endX: endPoint.x,
      endY: endPoint.y,
      deltaX: endPoint.x - startPoint.x,
      deltaY: endPoint.y - startPoint.y,
      distance: this.calculateDistance(startPoint, endPoint),
      velocity: 0,
      duration: Date.now() - this.startTime,
      touches: this.touchCurrentPoints.length,
      preventDefault: () => originalEvent.preventDefault(),
      stopPropagation: () => originalEvent.stopPropagation(),
      ...additionalData
    };

    handlers.forEach(handler => {
      try {
        handler(gestureEvent);
      } catch (error) {
        console.error('Gesture handler error:', error);
      }
    });
  }

  /**
   * Add gesture handler
   */
  public addHandler(type: GestureType, handler: GestureHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  /**
   * Remove gesture handler
   */
  public removeHandler(type: GestureType, handler: GestureHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  /**
   * Check if listener has no handlers
   */
  public isEmpty(): boolean {
    return this.handlers.size === 0;
  }

  /**
   * Destroy gesture listener
   */
  public destroy(): void {
    this.removeEventListeners();
    this.handlers.clear();
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}

// Export singleton instance
export const gestureService = GestureService.getInstance(); 