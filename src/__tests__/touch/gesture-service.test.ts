/**
 * Gesture Service Tests
 */

import { GestureService } from '@/lib/services/gesture-service';

// Mock DOM methods
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 300,
    height: 200,
    right: 300,
    bottom: 200
  })),
  style: {
    touchAction: '',
    userSelect: '',
    webkitUserSelect: '',
    webkitTapHighlightColor: '',
    cursor: 'auto'
  }
};

const mockNavigator = {
  vibrate: jest.fn(),
  hapticFeedback: {
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    impactHeavy: jest.fn(),
    selectionChanged: jest.fn(),
    notificationSuccess: jest.fn(),
    notificationWarning: jest.fn(),
    notificationError: jest.fn()
  }
};

// Mock global objects
beforeAll(() => {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  });

  Object.defineProperty(window, 'DeviceMotionEvent', {
    value: {
      requestPermission: jest.fn()
    },
    writable: true
  });

  global.getComputedStyle = jest.fn().mockReturnValue({
    cursor: 'auto'
  });
});

describe('GestureService', () => {
  let gestureService: GestureService;
  let element: any;

  beforeEach(() => {
    jest.clearAllMocks();
    gestureService = GestureService.getInstance();
    element = { ...mockElement };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GestureService.getInstance();
      const instance2 = GestureService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Haptic Feedback', () => {
    it('should detect vibration API support', () => {
      expect(gestureService.isHapticSupported()).toBe(true);
    });

    it('should trigger light haptic feedback', async () => {
      const result = await gestureService.triggerHaptic('light');
      expect(result).toBe(true);
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('should trigger medium haptic feedback', async () => {
      const result = await gestureService.triggerHaptic('medium');
      expect(result).toBe(true);
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([20]);
    });

    it('should trigger heavy haptic feedback', async () => {
      const result = await gestureService.triggerHaptic('heavy');
      expect(result).toBe(true);
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([30]);
    });

    it('should trigger notification pattern', async () => {
      const result = await gestureService.triggerHaptic('notification');
      expect(result).toBe(true);
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
    });

    it('should trigger success pattern', async () => {
      const result = await gestureService.triggerHaptic('success');
      expect(result).toBe(true);
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([5, 25, 5, 25, 5]);
    });

    it('should handle unsupported haptic feedback', async () => {
      delete (navigator as any).vibrate;
      delete (navigator as any).hapticFeedback;
      
      const newService = new (GestureService as any)();
      const result = await newService.triggerHaptic('light');
      expect(result).toBe(false);
    });

    it('should handle haptic feedback errors gracefully', async () => {
      mockNavigator.vibrate.mockImplementation(() => {
        throw new Error('Vibration failed');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await gestureService.triggerHaptic('light');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Touch Optimization', () => {
    it('should optimize element for touch interactions', () => {
      gestureService.optimizeForTouch(element);

      expect(element.style.touchAction).toBe('manipulation');
      expect(element.style.userSelect).toBe('none');
      expect(element.style.webkitUserSelect).toBe('none');
      expect(element.style.webkitTapHighlightColor).toBe('transparent');
      expect(element.style.cursor).toBe('pointer');
    });

    it('should not change cursor if already set', () => {
      global.getComputedStyle = jest.fn().mockReturnValue({
        cursor: 'grab'
      });

      gestureService.optimizeForTouch(element);
      expect(element.style.cursor).toBe('auto'); // Shouldn't be changed
    });
  });

  describe('Gesture Listeners', () => {
    it('should add and remove gesture listeners', () => {
      const handler = jest.fn();
      const cleanup = gestureService.addGestureListener(element, 'tap', handler);

      expect(element.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
      expect(element.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object));
      expect(element.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));

      cleanup();
      expect(element.removeEventListener).toHaveBeenCalled();
    });

    it('should remove all gesture listeners from element', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      gestureService.addGestureListener(element, 'tap', handler1);
      gestureService.addGestureListener(element, 'swipe', handler2);
      
      gestureService.removeAllGestureListeners(element);
      
      expect(element.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Shorthand Methods', () => {
    it('should create swipe gesture listener', () => {
      const handler = jest.fn();
      const cleanup = gestureService.onSwipe(element, 'left', handler);

      expect(typeof cleanup).toBe('function');
      expect(element.addEventListener).toHaveBeenCalled();
    });

    it('should create tap gesture listener', () => {
      const handler = jest.fn();
      const cleanup = gestureService.onTap(element, handler);

      expect(typeof cleanup).toBe('function');
      expect(element.addEventListener).toHaveBeenCalled();
    });

    it('should create double-tap gesture listener', () => {
      const handler = jest.fn();
      const cleanup = gestureService.onDoubleTap(element, handler);

      expect(typeof cleanup).toBe('function');
      expect(element.addEventListener).toHaveBeenCalled();
    });

    it('should create long-press gesture listener', () => {
      const handler = jest.fn();
      const cleanup = gestureService.onLongPress(element, handler, { timeThreshold: 1000 });

      expect(typeof cleanup).toBe('function');
      expect(element.addEventListener).toHaveBeenCalled();
    });

    it('should create pinch gesture listener', () => {
      const handler = jest.fn();
      const cleanup = gestureService.onPinch(element, handler);

      expect(typeof cleanup).toBe('function');
      expect(element.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all gesture listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      gestureService.addGestureListener(element, 'tap', handler1);
      gestureService.addGestureListener(element, 'swipe', handler2);
      
      gestureService.cleanup();
      
      expect(element.removeEventListener).toHaveBeenCalled();
    });
  });
});

describe('GestureListener', () => {
  let element: any;
  let listener: any;

  beforeEach(() => {
    jest.clearAllMocks();
    element = { ...mockElement };
  });

  describe('Touch Events', () => {
    it('should handle touch start event', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.addGestureListener(element, 'tap', handler);
      
      // Get the touchstart handler
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      expect(touchStartHandler).toBeDefined();
      
      // Mock touch event
      const mockTouchEvent = {
        touches: [{
          identifier: 0,
          clientX: 100,
          clientY: 100
        }],
        preventDefault: jest.fn()
      };
      
      touchStartHandler(mockTouchEvent);
      // Touch start should not prevent default by default
      expect(mockTouchEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle touch move event', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.addGestureListener(element, 'drag', handler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchMoveHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchmove')?.[1];
      
      // Start touch
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // Move touch
      touchMoveHandler({
        touches: [{ identifier: 0, clientX: 150, clientY: 120 }],
        preventDefault: jest.fn()
      });
      
      expect(handler).toHaveBeenCalled();
    });

    it('should handle touch end event with tap', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.addGestureListener(element, 'tap', handler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchEndHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];
      
      // Start touch
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // End touch quickly (tap)
      setTimeout(() => {
        touchEndHandler({
          touches: [],
          preventDefault: jest.fn()
        });
      }, 100);
      
      // Wait for tap timeout
      setTimeout(() => {
        expect(handler).toHaveBeenCalled();
      }, 400);
    });

    it('should handle swipe gesture', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onSwipe(element, 'right', handler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchMoveHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchmove')?.[1];
      const touchEndHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];
      
      // Start touch
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // Move touch significantly right
      touchMoveHandler({
        touches: [{ identifier: 0, clientX: 200, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // End touch
      touchEndHandler({
        touches: [],
        preventDefault: jest.fn()
      });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'swipe',
          direction: 'right',
          deltaX: expect.any(Number),
          deltaY: expect.any(Number)
        })
      );
    });

    it('should handle pinch gesture', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onPinch(element, handler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchMoveHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchmove')?.[1];
      
      // Start touch with two fingers
      touchStartHandler({
        touches: [
          { identifier: 0, clientX: 100, clientY: 100 },
          { identifier: 1, clientX: 200, clientY: 100 }
        ],
        preventDefault: jest.fn()
      });
      
      // Move fingers further apart (zoom in)
      touchMoveHandler({
        touches: [
          { identifier: 0, clientX: 80, clientY: 100 },
          { identifier: 1, clientX: 220, clientY: 100 }
        ],
        preventDefault: jest.fn()
      });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pinch',
          scale: expect.any(Number)
        })
      );
    });

    it('should handle long press gesture', (done) => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onLongPress(element, handler, { timeThreshold: 100 });
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      // Start touch
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // Wait for long press timeout
      setTimeout(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'long-press'
          })
        );
        done();
      }, 150);
    });

    it('should handle double tap gesture', (done) => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onDoubleTap(element, handler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchEndHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];
      
      // First tap
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      touchEndHandler({
        touches: [],
        preventDefault: jest.fn()
      });
      
      // Second tap quickly
      setTimeout(() => {
        touchStartHandler({
          touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
          preventDefault: jest.fn()
        });
        
        touchEndHandler({
          touches: [],
          preventDefault: jest.fn()
        });
        
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'double-tap'
          })
        );
        done();
      }, 100);
    });
  });

  describe('Mouse Events Fallback', () => {
    it('should handle mouse events as touch events', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onTap(element, handler);
      
      const mouseDownHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'mousedown')?.[1];
      const mouseUpHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'mouseup')?.[1];
      
      expect(mouseDownHandler).toBeDefined();
      expect(mouseUpHandler).toBeDefined();
      
      // Mock mouse events
      const mockMouseEvent = {
        clientX: 100,
        clientY: 100,
        pageX: 100,
        pageY: 100,
        screenX: 100,
        screenY: 100,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: element
      };
      
      mouseDownHandler(mockMouseEvent);
      mouseUpHandler(mockMouseEvent);
      
      // Should eventually call the tap handler
      setTimeout(() => {
        expect(handler).toHaveBeenCalled();
      }, 400);
    });
  });

  describe('Touch Cancel', () => {
    it('should handle touch cancel event', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onLongPress(element, handler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchCancelHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchcancel')?.[1];
      
      // Start touch
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // Cancel touch
      touchCancelHandler({
        touches: [],
        preventDefault: jest.fn()
      });
      
      // Long press should not trigger after cancel
      setTimeout(() => {
        expect(handler).not.toHaveBeenCalled();
      }, 600);
    });
  });

  describe('Options', () => {
    it('should respect preventScroll option', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.addGestureListener(element, 'tap', handler, { preventScroll: true });
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      const mockEvent = {
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      };
      
      touchStartHandler(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should respect custom threshold', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onSwipe(element, 'right', handler, { threshold: 100 });
      
      // Test that small movements don't trigger swipe
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchMoveHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchmove')?.[1];
      const touchEndHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];
      
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      touchMoveHandler({
        touches: [{ identifier: 0, clientX: 150, clientY: 100 }], // Only 50px movement
        preventDefault: jest.fn()
      });
      
      touchEndHandler({
        touches: [],
        preventDefault: jest.fn()
      });
      
      expect(handler).not.toHaveBeenCalled(); // Should not trigger with threshold of 100
    });

    it('should respect custom velocity threshold', () => {
      const gestureService = GestureService.getInstance();
      const handler = jest.fn();
      
      gestureService.onSwipe(element, 'right', handler, { velocity: 2.0 });
      
      // Test that slow movements don't trigger swipe even with large distance
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchMoveHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchmove')?.[1];
      const touchEndHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];
      
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      // Simulate slow movement
      setTimeout(() => {
        touchMoveHandler({
          touches: [{ identifier: 0, clientX: 200, clientY: 100 }],
          preventDefault: jest.fn()
        });
        
        touchEndHandler({
          touches: [],
          preventDefault: jest.fn()
        });
        
        expect(handler).not.toHaveBeenCalled(); // Should not trigger with high velocity requirement
      }, 1000); // Slow movement
    });
  });

  describe('Error Handling', () => {
    it('should handle gesture handler errors gracefully', () => {
      const gestureService = GestureService.getInstance();
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      gestureService.onTap(element, errorHandler);
      
      const touchStartHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      const touchEndHandler = element.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];
      
      touchStartHandler({
        touches: [{ identifier: 0, clientX: 100, clientY: 100 }],
        preventDefault: jest.fn()
      });
      
      touchEndHandler({
        touches: [],
        preventDefault: jest.fn()
      });
      
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Gesture handler error:', expect.any(Error));
        consoleSpy.mockRestore();
      }, 400);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle multiple gesture types on same element', () => {
    const gestureService = GestureService.getInstance();
    const element = { ...mockElement };
    
    const tapHandler = jest.fn();
    const swipeHandler = jest.fn();
    const longPressHandler = jest.fn();
    
    const tapCleanup = gestureService.onTap(element, tapHandler);
    const swipeCleanup = gestureService.onSwipe(element, 'right', swipeHandler);
    const longPressCleanup = gestureService.onLongPress(element, longPressHandler);
    
    expect(element.addEventListener).toHaveBeenCalledTimes(21); // 7 events × 3 gesture types
    
    tapCleanup();
    swipeCleanup();
    longPressCleanup();
    
    expect(element.removeEventListener).toHaveBeenCalled();
  });

  it('should maintain gesture state across multiple touches', () => {
    const gestureService = GestureService.getInstance();
    const element = { ...mockElement };
    const handler = jest.fn();
    
    gestureService.onPinch(element, handler);
    
    const touchStartHandler = element.addEventListener.mock.calls
      .find(call => call[0] === 'touchstart')?.[1];
    const touchMoveHandler = element.addEventListener.mock.calls
      .find(call => call[0] === 'touchmove')?.[1];
    
    // Multi-touch start
    touchStartHandler({
      touches: [
        { identifier: 0, clientX: 100, clientY: 100 },
        { identifier: 1, clientX: 200, clientY: 100 }
      ],
      preventDefault: jest.fn()
    });
    
    // Multi-touch move
    touchMoveHandler({
      touches: [
        { identifier: 0, clientX: 90, clientY: 100 },
        { identifier: 1, clientX: 210, clientY: 100 }
      ],
      preventDefault: jest.fn()
    });
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pinch',
        touches: 2,
        scale: expect.any(Number)
      })
    );
  });
}); 