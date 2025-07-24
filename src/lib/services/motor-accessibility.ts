'use client';

export interface MotorAccessibilityPreferences {
  touchTargets: {
    minimumSize: number; // pixels
    spacing: number; // pixels
    enlargeAll: boolean;
    showHitAreas: boolean;
  };
  gestureAssistance: {
    extendedTimeout: number; // milliseconds
    simplifiedGestures: boolean;
    alternativeInputs: boolean;
    dragThreshold: number; // pixels
  };
  inputAssistance: {
    stickyKeys: boolean;
    slowKeys: boolean;
    slowKeysDelay: number; // milliseconds
    bounceKeys: boolean;
    bounceKeysDelay: number; // milliseconds
    autoRepeat: boolean;
    autoRepeatDelay: number; // milliseconds
  };
  clickAssistance: {
    dwellClick: boolean;
    dwellTime: number; // milliseconds
    clickLock: boolean;
    dragLock: boolean;
    pauseOnHover: boolean;
    hoverDelay: number; // milliseconds
  };
  errorPrevention: {
    confirmDestructiveActions: boolean;
    undoTimeout: number; // milliseconds
    accidentalClickPrevention: boolean;
    clickBuffer: number; // milliseconds
  };
  customization: {
    preferredInputMethod: 'mouse' | 'keyboard' | 'touch' | 'voice' | 'switch' | 'eye-tracking';
    assistiveDevice: 'none' | 'head-mouse' | 'mouth-stick' | 'switch' | 'eye-tracker';
    oneHandedMode: boolean;
    dominantHand: 'left' | 'right';
  };
}

export interface TouchTarget {
  element: HTMLElement;
  originalSize: { width: number; height: number };
  enhancedSize: { width: number; height: number };
  position: { x: number; y: number };
  isAccessible: boolean;
  needsEnhancement: boolean;
}

export interface GestureEvent {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'drag';
  element: HTMLElement;
  startTime: number;
  duration: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  velocity: number;
  canceled: boolean;
}

class MotorAccessibilityService {
  private preferences: MotorAccessibilityPreferences;
  private touchTargets: Map<HTMLElement, TouchTarget> = new Map();
  private activeGestures: Map<string, GestureEvent> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private keyStates: Map<string, number> = new Map();
  private clickHistory: Array<{ time: number; element: HTMLElement }> = [];
  private dwellTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.initializeService();
  }

  /**
   * Get default motor accessibility preferences
   */
  private getDefaultPreferences(): MotorAccessibilityPreferences {
    return {
      touchTargets: {
        minimumSize: this.detectTouchDevice() ? 44 : 32,
        spacing: 8,
        enlargeAll: false,
        showHitAreas: false,
      },
      gestureAssistance: {
        extendedTimeout: 2000,
        simplifiedGestures: false,
        alternativeInputs: true,
        dragThreshold: 10,
      },
      inputAssistance: {
        stickyKeys: false,
        slowKeys: false,
        slowKeysDelay: 500,
        bounceKeys: false,
        bounceKeysDelay: 100,
        autoRepeat: false,
        autoRepeatDelay: 500,
      },
      clickAssistance: {
        dwellClick: false,
        dwellTime: 1000,
        clickLock: false,
        dragLock: false,
        pauseOnHover: false,
        hoverDelay: 500,
      },
      errorPrevention: {
        confirmDestructiveActions: true,
        undoTimeout: 5000,
        accidentalClickPrevention: false,
        clickBuffer: 300,
      },
      customization: {
        preferredInputMethod: this.detectPreferredInput(),
        assistiveDevice: 'none',
        oneHandedMode: false,
        dominantHand: 'right',
      },
    };
  }

  /**
   * Detect if device has touch capability
   */
  private detectTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Detect preferred input method
   */
  private detectPreferredInput(): 'mouse' | 'keyboard' | 'touch' | 'voice' | 'switch' | 'eye-tracking' {
    if (this.detectTouchDevice()) return 'touch';
    if (window.matchMedia('(pointer: coarse)').matches) return 'touch';
    if (window.matchMedia('(hover: none)').matches) return 'touch';
    return 'mouse';
  }

  /**
   * Initialize the motor accessibility service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create style element
      this.createStyleElement();

      // Setup touch target monitoring
      this.setupTouchTargetMonitoring();

      // Setup gesture enhancement
      this.setupGestureEnhancement();

      // Setup keyboard assistance
      this.setupKeyboardAssistance();

      // Setup click assistance
      this.setupClickAssistance();

      // Load user preferences
      await this.loadUserPreferences();

      // Apply initial enhancements
      this.applyAllEnhancements();

      this.isInitialized = true;
      console.log('Motor Accessibility Service initialized');
    } catch (error) {
      console.error('Failed to initialize Motor Accessibility Service:', error);
    }
  }

  /**
   * Create style element for motor accessibility CSS
   */
  private createStyleElement(): void {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'motor-accessibility-styles';
    document.head.appendChild(this.styleElement);
  }

  /**
   * Setup touch target monitoring
   */
  private setupTouchTargetMonitoring(): void {
    if (!('ResizeObserver' in window)) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.analyzeAndEnhanceTouchTarget(entry.target as HTMLElement);
      });
    });

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.analyzeAndEnhanceTouchTarget(entry.target as HTMLElement);
        }
      });
    });

    // Monitor initial interactive elements
    this.scanForInteractiveElements(document.body);

    // Monitor for new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanForInteractiveElements(node as HTMLElement);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Scan for interactive elements
   */
  private scanForInteractiveElements(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex], [onclick]'
    );

    interactiveElements.forEach((element) => {
      this.analyzeAndEnhanceTouchTarget(element as HTMLElement);
      
      if (this.resizeObserver) {
        this.resizeObserver.observe(element);
      }
      
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  /**
   * Analyze and enhance touch target
   */
  private analyzeAndEnhanceTouchTarget(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const { minimumSize, spacing } = this.preferences.touchTargets;

    const touchTarget: TouchTarget = {
      element,
      originalSize: { width: rect.width, height: rect.height },
      enhancedSize: {
        width: Math.max(rect.width, minimumSize),
        height: Math.max(rect.height, minimumSize),
      },
      position: { x: rect.left, y: rect.top },
      isAccessible: rect.width >= minimumSize && rect.height >= minimumSize,
      needsEnhancement: rect.width < minimumSize || rect.height < minimumSize,
    };

    this.touchTargets.set(element, touchTarget);

    if (touchTarget.needsEnhancement || this.preferences.touchTargets.enlargeAll) {
      this.enhanceTouchTarget(element, touchTarget);
    }
  }

  /**
   * Enhance touch target
   */
  private enhanceTouchTarget(element: HTMLElement, touchTarget: TouchTarget): void {
    const { minimumSize, spacing, showHitAreas } = this.preferences.touchTargets;

    // Add CSS class for styling
    element.classList.add('motor-enhanced-target');

    // Calculate required padding
    const widthDiff = Math.max(0, minimumSize - touchTarget.originalSize.width);
    const heightDiff = Math.max(0, minimumSize - touchTarget.originalSize.height);

    const paddingX = widthDiff / 2;
    const paddingY = heightDiff / 2;

    // Apply enhancements
    const style = element.style;
    style.minWidth = `${minimumSize}px`;
    style.minHeight = `${minimumSize}px`;
    style.padding = `${Math.max(8, paddingY)}px ${Math.max(8, paddingX)}px`;
    style.margin = `${spacing}px`;
    style.touchAction = 'manipulation'; // Disable double-tap zoom

    // Show hit areas if enabled
    if (showHitAreas) {
      style.outline = '2px dashed rgba(0, 102, 204, 0.5)';
      style.outlineOffset = '2px';
    }

    // Add hover states for better feedback
    element.addEventListener('mouseenter', () => {
      if (this.preferences.clickAssistance.pauseOnHover) {
        this.startDwellTimer(element);
      }
    });

    element.addEventListener('mouseleave', () => {
      this.cancelDwellTimer();
    });
  }

  /**
   * Setup gesture enhancement
   */
  private setupGestureEnhancement(): void {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: false });
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: false });
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: false });
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    const element = event.target as HTMLElement;
    
    const gestureId = `touch-${touch.identifier}`;
    const gestureEvent: GestureEvent = {
      type: 'tap',
      element,
      startTime: Date.now(),
      duration: 0,
      startPosition: { x: touch.clientX, y: touch.clientY },
      endPosition: { x: touch.clientX, y: touch.clientY },
      velocity: 0,
      canceled: false,
    };

    this.activeGestures.set(gestureId, gestureEvent);

    // Set up long press detection
    setTimeout(() => {
      const gesture = this.activeGestures.get(gestureId);
      if (gesture && !gesture.canceled) {
        gesture.type = 'long-press';
        this.handleLongPress(gesture);
      }
    }, this.preferences.gestureAssistance.extendedTimeout);
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    const gestureId = `touch-${touch.identifier}`;
    const gesture = this.activeGestures.get(gestureId);

    if (!gesture) return;

    gesture.endPosition = { x: touch.clientX, y: touch.clientY };
    gesture.duration = Date.now() - gesture.startTime;

    const distance = Math.sqrt(
      Math.pow(gesture.endPosition.x - gesture.startPosition.x, 2) +
      Math.pow(gesture.endPosition.y - gesture.startPosition.y, 2)
    );

    // Check if movement exceeds drag threshold
    if (distance > this.preferences.gestureAssistance.dragThreshold) {
      gesture.type = 'drag';
      gesture.velocity = distance / gesture.duration;
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const gestureId = `touch-${touch.identifier}`;
    const gesture = this.activeGestures.get(gestureId);

    if (!gesture) return;

    gesture.duration = Date.now() - gesture.startTime;
    gesture.endPosition = { x: touch.clientX, y: touch.clientY };

    // Determine final gesture type
    if (gesture.type === 'tap' && gesture.duration < 200) {
      this.handleTap(gesture);
    } else if (gesture.type === 'drag') {
      this.handleDragEnd(gesture);
    }

    this.activeGestures.delete(gestureId);
  }

  /**
   * Handle mouse events (similar to touch)
   */
  private handleMouseDown(event: MouseEvent): void {
    if (this.preferences.clickAssistance.accidentalClickPrevention) {
      if (this.isAccidentalClick(event)) {
        event.preventDefault();
        return;
      }
    }

    const element = event.target as HTMLElement;
    const gestureEvent: GestureEvent = {
      type: 'tap',
      element,
      startTime: Date.now(),
      duration: 0,
      startPosition: { x: event.clientX, y: event.clientY },
      endPosition: { x: event.clientX, y: event.clientY },
      velocity: 0,
      canceled: false,
    };

    this.activeGestures.set('mouse', gestureEvent);
  }

  private handleMouseMove(event: MouseEvent): void {
    const gesture = this.activeGestures.get('mouse');
    if (!gesture) return;

    gesture.endPosition = { x: event.clientX, y: event.clientY };
    gesture.duration = Date.now() - gesture.startTime;

    const distance = Math.sqrt(
      Math.pow(gesture.endPosition.x - gesture.startPosition.x, 2) +
      Math.pow(gesture.endPosition.y - gesture.startPosition.y, 2)
    );

    if (distance > this.preferences.gestureAssistance.dragThreshold) {
      gesture.type = 'drag';
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const gesture = this.activeGestures.get('mouse');
    if (!gesture) return;

    gesture.duration = Date.now() - gesture.startTime;

    if (gesture.type === 'tap') {
      this.handleTap(gesture);
    } else if (gesture.type === 'drag') {
      this.handleDragEnd(gesture);
    }

    this.activeGestures.delete('mouse');
  }

  /**
   * Handle tap gesture
   */
  private handleTap(gesture: GestureEvent): void {
    if (this.preferences.clickAssistance.clickLock) {
      gesture.element.classList.add('motor-click-locked');
      setTimeout(() => {
        gesture.element.classList.remove('motor-click-locked');
      }, 200);
    }
  }

  /**
   * Handle long press
   */
  private handleLongPress(gesture: GestureEvent): void {
    gesture.element.dispatchEvent(new CustomEvent('longpress', {
      detail: { gesture },
      bubbles: true,
    }));

    // Visual feedback
    gesture.element.classList.add('motor-long-press');
    setTimeout(() => {
      gesture.element.classList.remove('motor-long-press');
    }, 200);
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(gesture: GestureEvent): void {
    if (this.preferences.clickAssistance.dragLock) {
      // Implement drag lock functionality
      gesture.element.classList.add('motor-drag-locked');
      setTimeout(() => {
        gesture.element.classList.remove('motor-drag-locked');
      }, 500);
    }
  }

  /**
   * Check if click is accidental
   */
  private isAccidentalClick(event: MouseEvent): boolean {
    const now = Date.now();
    const element = event.target as HTMLElement;
    const { clickBuffer } = this.preferences.errorPrevention;

    // Check recent click history
    const recentClicks = this.clickHistory.filter(click => 
      now - click.time < clickBuffer && click.element === element
    );

    this.clickHistory.push({ time: now, element });

    // Keep only recent clicks
    this.clickHistory = this.clickHistory.filter(click => now - click.time < clickBuffer * 2);

    return recentClicks.length > 0;
  }

  /**
   * Setup keyboard assistance
   */
  private setupKeyboardAssistance(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  /**
   * Handle key down
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    const now = Date.now();

    // Sticky keys implementation
    if (this.preferences.inputAssistance.stickyKeys) {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
        const lastPress = this.keyStates.get(key) || 0;
        if (now - lastPress < 500) { // Double tap to lock
          event.preventDefault();
          this.toggleStickyKey(key);
          return;
        }
        this.keyStates.set(key, now);
      }
    }

    // Slow keys implementation
    if (this.preferences.inputAssistance.slowKeys && 
        !['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
      event.preventDefault();
      
      setTimeout(() => {
        // Re-dispatch the event after delay
        const newEvent = new KeyboardEvent('keydown', {
          key: event.key,
          code: event.code,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          bubbles: true,
        });
        event.target?.dispatchEvent(newEvent);
      }, this.preferences.inputAssistance.slowKeysDelay);
      
      return;
    }

    // Bounce keys implementation
    if (this.preferences.inputAssistance.bounceKeys) {
      const lastKeyTime = this.keyStates.get(`bounce-${key}`) || 0;
      if (now - lastKeyTime < this.preferences.inputAssistance.bounceKeysDelay) {
        event.preventDefault();
        return;
      }
      this.keyStates.set(`bounce-${key}`, now);
    }
  }

  /**
   * Handle key up
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // Auto-repeat implementation
    if (this.preferences.inputAssistance.autoRepeat) {
      // Implementation would depend on specific requirements
    }
  }

  /**
   * Toggle sticky key state
   */
  private toggleStickyKey(key: string): void {
    const element = document.body;
    const stickyClass = `sticky-${key.toLowerCase()}`;
    
    if (element.classList.contains(stickyClass)) {
      element.classList.remove(stickyClass);
    } else {
      element.classList.add(stickyClass);
    }
  }

  /**
   * Setup click assistance
   */
  private setupClickAssistance(): void {
    if (this.preferences.clickAssistance.dwellClick) {
      document.addEventListener('mouseover', this.handleMouseOver.bind(this));
      document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
  }

  /**
   * Handle mouse over for dwell click
   */
  private handleMouseOver(event: MouseEvent): void {
    if (!this.preferences.clickAssistance.dwellClick) return;

    const element = event.target as HTMLElement;
    if (!this.isClickableElement(element)) return;

    this.startDwellTimer(element);
  }

  /**
   * Handle mouse out
   */
  private handleMouseOut(event: MouseEvent): void {
    this.cancelDwellTimer();
  }

  /**
   * Start dwell timer
   */
  private startDwellTimer(element: HTMLElement): void {
    this.cancelDwellTimer();

    const dwellTime = this.preferences.clickAssistance.dwellTime;
    
    // Visual feedback
    element.classList.add('motor-dwell-progress');
    
    this.dwellTimer = setTimeout(() => {
      element.click();
      element.classList.remove('motor-dwell-progress');
      element.classList.add('motor-dwell-clicked');
      
      setTimeout(() => {
        element.classList.remove('motor-dwell-clicked');
      }, 200);
    }, dwellTime);
  }

  /**
   * Cancel dwell timer
   */
  private cancelDwellTimer(): void {
    if (this.dwellTimer) {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = null;
    }

    // Remove visual feedback from all elements
    document.querySelectorAll('.motor-dwell-progress').forEach(el => {
      el.classList.remove('motor-dwell-progress');
    });
  }

  /**
   * Check if element is clickable
   */
  private isClickableElement(element: HTMLElement): boolean {
    const clickableTypes = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const hasClickHandler = element.onclick || element.getAttribute('onclick');
    const hasRole = element.getAttribute('role') === 'button' || 
                   element.getAttribute('role') === 'link';
    
    return clickableTypes.includes(element.tagName) || !!hasClickHandler || hasRole;
  }

  /**
   * Apply all motor accessibility enhancements
   */
  private applyAllEnhancements(): void {
    this.applyTouchTargetEnhancements();
    this.applyGestureEnhancements();
    this.applyKeyboardEnhancements();
    this.applyClickEnhancements();
    this.applyOneHandedMode();
  }

  /**
   * Apply touch target enhancements
   */
  private applyTouchTargetEnhancements(): void {
    if (!this.styleElement) return;

    const { minimumSize, spacing, showHitAreas } = this.preferences.touchTargets;

    const css = `
      .motor-enhanced-target {
        min-width: ${minimumSize}px !important;
        min-height: ${minimumSize}px !important;
        margin: ${spacing}px !important;
        touch-action: manipulation !important;
        ${showHitAreas ? 'outline: 2px dashed rgba(0, 102, 204, 0.5) !important; outline-offset: 2px !important;' : ''}
      }
      
      .motor-enhanced-target:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
      }
    `;

    this.updateStyleElement(css, 'touch-targets');
  }

  /**
   * Apply gesture enhancements
   */
  private applyGestureEnhancements(): void {
    if (!this.styleElement) return;

    const css = `
      .motor-long-press {
        background-color: rgba(0, 102, 204, 0.2) !important;
        transform: scale(1.05) !important;
        transition: all 0.1s ease !important;
      }
      
      .motor-click-locked {
        background-color: rgba(40, 167, 69, 0.2) !important;
        border: 2px solid #28a745 !important;
      }
      
      .motor-drag-locked {
        cursor: grabbing !important;
        opacity: 0.8 !important;
      }
    `;

    this.updateStyleElement(css, 'gestures');
  }

  /**
   * Apply keyboard enhancements
   */
  private applyKeyboardEnhancements(): void {
    if (!this.styleElement) return;

    const css = `
      .sticky-shift *:focus { text-transform: uppercase !important; }
      .sticky-control *:focus { font-weight: bold !important; }
      .sticky-alt *:focus { font-style: italic !important; }
    `;

    this.updateStyleElement(css, 'keyboard');
  }

  /**
   * Apply click enhancements
   */
  private applyClickEnhancements(): void {
    if (!this.styleElement) return;

    const { dwellTime } = this.preferences.clickAssistance;

    const css = `
      .motor-dwell-progress {
        animation: motor-dwell-timer ${dwellTime}ms linear forwards !important;
        border: 2px solid #0066cc !important;
      }
      
      @keyframes motor-dwell-timer {
        from { box-shadow: inset 0 0 0 0 rgba(0, 102, 204, 0.3); }
        to { box-shadow: inset 100vw 0 0 0 rgba(0, 102, 204, 0.3); }
      }
      
      .motor-dwell-clicked {
        background-color: rgba(40, 167, 69, 0.4) !important;
        transform: scale(1.1) !important;
        transition: all 0.1s ease !important;
      }
    `;

    this.updateStyleElement(css, 'click-assistance');
  }

  /**
   * Apply one-handed mode
   */
  private applyOneHandedMode(): void {
    if (!this.preferences.customization.oneHandedMode) return;
    if (!this.styleElement) return;

    const isLeftHanded = this.preferences.customization.dominantHand === 'left';
    
    const css = `
      .motor-one-handed {
        ${isLeftHanded ? 'right: 0 !important; left: auto !important;' : 'left: 0 !important; right: auto !important;'}
        max-width: 75vw !important;
      }
      
      .motor-one-handed .modal,
      .motor-one-handed .dropdown-menu {
        ${isLeftHanded ? 'transform-origin: right top !important;' : 'transform-origin: left top !important;'}
      }
    `;

    this.updateStyleElement(css, 'one-handed');
    document.body.classList.add('motor-one-handed');
  }

  /**
   * Update style element
   */
  private updateStyleElement(css: string, section: string): void {
    if (!this.styleElement) return;

    const existingContent = this.styleElement.textContent || '';
    const sectionRegex = new RegExp(`\\/\\* ${section} start \\*\\/[\\s\\S]*?\\/\\* ${section} end \\*\\/`, 'g');
    
    const newSection = `/* ${section} start */\n${css}\n/* ${section} end */`;
    
    if (sectionRegex.test(existingContent)) {
      this.styleElement.textContent = existingContent.replace(sectionRegex, newSection);
    } else {
      this.styleElement.textContent = existingContent + '\n' + newSection;
    }
  }

  /**
   * Update preferences
   */
  public updatePreferences(preferences: Partial<MotorAccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.applyAllEnhancements();
    this.saveUserPreferences();
  }

  /**
   * Get current preferences
   */
  public getPreferences(): MotorAccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Get touch target analysis
   */
  public analyzeTouchTargets(): TouchTarget[] {
    return Array.from(this.touchTargets.values());
  }

  /**
   * Get accessibility violations
   */
  public getAccessibilityViolations(): {
    smallTargets: TouchTarget[];
    poorSpacing: TouchTarget[];
    recommendations: string[];
  } {
    const targets = this.analyzeTouchTargets();
    const smallTargets = targets.filter(t => !t.isAccessible);
    const poorSpacing = targets.filter(t => this.hasInsufficientSpacing(t));

    const recommendations: string[] = [];
    
    if (smallTargets.length > 0) {
      recommendations.push(`${smallTargets.length} touch targets are below minimum size`);
    }
    
    if (poorSpacing.length > 0) {
      recommendations.push(`${poorSpacing.length} targets have insufficient spacing`);
    }

    return { smallTargets, poorSpacing, recommendations };
  }

  /**
   * Check if target has insufficient spacing
   */
  private hasInsufficientSpacing(target: TouchTarget): boolean {
    const rect = target.element.getBoundingClientRect();
    const minSpacing = this.preferences.touchTargets.spacing;
    
    // This would check distance to other interactive elements
    // Simplified implementation for now
    return false;
  }

  /**
   * Test gesture recognition
   */
  public testGesture(type: GestureEvent['type']): void {
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      background: rgba(0, 102, 204, 0.5);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: white;
      font-family: sans-serif;
    `;
    testElement.textContent = `${type} test`;
    
    document.body.appendChild(testElement);
    
    setTimeout(() => {
      document.body.removeChild(testElement);
    }, 2000);
  }

  /**
   * Load user preferences
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const response = await fetch('/api/accessibility/motor-preferences');
      if (response.ok) {
        const userPrefs = await response.json();
        this.preferences = { ...this.preferences, ...userPrefs };
      }
    } catch (error) {
      console.warn('Failed to load motor accessibility preferences:', error);
    }
  }

  /**
   * Save user preferences
   */
  private async saveUserPreferences(): Promise<void> {
    try {
      await fetch('/api/accessibility/motor-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.preferences),
      });
    } catch (error) {
      console.error('Failed to save motor accessibility preferences:', error);
    }
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    // Remove observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Cancel timers
    this.cancelDwellTimer();

    // Remove style element
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Clear maps
    this.touchTargets.clear();
    this.activeGestures.clear();
    this.keyStates.clear();

    this.isInitialized = false;
  }
}

// Export singleton instance
export const motorAccessibilityService = new MotorAccessibilityService();
export default motorAccessibilityService; 