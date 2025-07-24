// Mobile Accessibility Service - Comprehensive support for assistive technologies
'use client';

export interface AccessibilityPreferences {
  screenReader: {
    enabled: boolean;
    announcePageChanges: boolean;
    announceFormErrors: boolean;
    announceContentUpdates: boolean;
    verbosityLevel: 'minimal' | 'standard' | 'verbose';
    readingSpeed: 'slow' | 'normal' | 'fast';
  };
  visualAids: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    focusIndicators: boolean;
    textSpacing: 'normal' | 'relaxed' | 'loose';
    colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  };
  motorAssistance: {
    largerTouchTargets: boolean;
    stickyKeys: boolean;
    slowKeys: boolean;
    bounceKeys: boolean;
    clickAssistance: boolean;
    gestureTimeouts: number; // milliseconds
  };
  voiceControl: {
    enabled: boolean;
    voiceCommands: boolean;
    dictation: boolean;
    voiceNavigation: boolean;
    sensitivity: 'low' | 'medium' | 'high';
  };
  keyboardNavigation: {
    enabled: boolean;
    skipLinks: boolean;
    customShortcuts: boolean;
    tabTrapping: boolean;
    arrowKeyNavigation: boolean;
  };
}

export interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive' | 'off';
  category: 'navigation' | 'content' | 'error' | 'success' | 'status';
  delay?: number;
}

export interface FocusManagement {
  element: HTMLElement;
  reason: 'user' | 'programmatic' | 'error' | 'navigation';
  skipNext?: boolean;
  announcement?: string;
}

export interface TouchTargetInfo {
  element: HTMLElement;
  currentSize: { width: number; height: number };
  recommendedSize: { width: number; height: number };
  meetsGuidelines: boolean;
  spacing: number;
}

class MobileAccessibilityService {
  private preferences: AccessibilityPreferences;
  private announceRegion: HTMLElement | null = null;
  private focusHistory: HTMLElement[] = [];
  private voiceRecognition: any = null;
  private isInitialized = false;
  private observers: MutationObserver[] = [];
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.initializeService();
  }

  /**
   * Initialize the accessibility service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create announcement region for screen readers
      this.createAnnouncementRegion();

      // Set up mutation observers for dynamic content
      this.setupContentObservers();

      // Initialize touch target monitoring
      this.initializeTouchTargetMonitoring();

      // Load user preferences
      await this.loadUserPreferences();

      // Apply initial accessibility enhancements
      this.applyAccessibilityEnhancements();

      // Set up keyboard navigation
      this.setupKeyboardNavigation();

      // Initialize voice control if supported
      await this.initializeVoiceControl();

      this.isInitialized = true;
      console.log('Mobile Accessibility Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mobile Accessibility Service:', error);
    }
  }

  /**
   * Get default accessibility preferences
   */
  private getDefaultPreferences(): AccessibilityPreferences {
    return {
      screenReader: {
        enabled: this.detectScreenReader(),
        announcePageChanges: true,
        announceFormErrors: true,
        announceContentUpdates: true,
        verbosityLevel: 'standard',
        readingSpeed: 'normal',
      },
      visualAids: {
        highContrast: this.detectHighContrastPreference(),
        largeText: this.detectLargeTextPreference(),
        reducedMotion: this.detectReducedMotionPreference(),
        focusIndicators: true,
        textSpacing: 'normal',
        colorBlindnessMode: 'none',
      },
      motorAssistance: {
        largerTouchTargets: this.detectTouchDevice(),
        stickyKeys: false,
        slowKeys: false,
        bounceKeys: false,
        clickAssistance: false,
        gestureTimeouts: 1000,
      },
      voiceControl: {
        enabled: false,
        voiceCommands: false,
        dictation: false,
        voiceNavigation: false,
        sensitivity: 'medium',
      },
      keyboardNavigation: {
        enabled: true,
        skipLinks: true,
        customShortcuts: true,
        tabTrapping: true,
        arrowKeyNavigation: true,
      },
    };
  }

  /**
   * Detect if screen reader is active
   */
  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    if (typeof navigator === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const hasScreenReaderUA = userAgent.includes('nvda') || 
                             userAgent.includes('jaws') || 
                             userAgent.includes('voiceover');

    // Check for reduced motion preference (often indicates assistive technology)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check for specific accessibility APIs
    const hasAccessibilityAPI = 'speechSynthesis' in window || 
                                'webkitSpeechRecognition' in window;

    return hasScreenReaderUA || (prefersReducedMotion && hasAccessibilityAPI);
  }

  /**
   * Detect high contrast preference
   */
  private detectHighContrastPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Detect large text preference
   */
  private detectLargeTextPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Detect reduced motion preference
   */
  private detectReducedMotionPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Detect touch device
   */
  private detectTouchDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           'orientation' in window;
  }

  /**
   * Create announcement region for screen readers
   */
  private createAnnouncementRegion(): void {
    if (document.getElementById('accessibility-announcements')) return;

    this.announceRegion = document.createElement('div');
    this.announceRegion.id = 'accessibility-announcements';
    this.announceRegion.setAttribute('aria-live', 'polite');
    this.announceRegion.setAttribute('aria-atomic', 'true');
    this.announceRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(this.announceRegion);
  }

  /**
   * Announce message to screen readers
   */
  public announce(announcement: AccessibilityAnnouncement): void {
    if (!this.announceRegion || !this.preferences.screenReader.enabled) return;

    const { message, priority = 'polite', delay = 100 } = announcement;

    // Set appropriate aria-live value
    this.announceRegion.setAttribute('aria-live', priority);

    // Clear previous announcement
    this.announceRegion.textContent = '';

    // Announce after short delay to ensure screen reader picks it up
    setTimeout(() => {
      if (this.announceRegion) {
        this.announceRegion.textContent = message;
      }
    }, delay);

    // Clear announcement after reasonable time
    setTimeout(() => {
      if (this.announceRegion) {
        this.announceRegion.textContent = '';
      }
    }, delay + 5000);
  }

  /**
   * Setup content observers for dynamic accessibility
   */
  private setupContentObservers(): void {
    // Observer for content changes
    const contentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.handleNewContent(Array.from(mutation.addedNodes) as HTMLElement[]);
        }
      });
    });

    contentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(contentObserver);

    // Observer for form errors
    const errorObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'aria-invalid') {
          this.handleFormError(mutation.target as HTMLElement);
        }
      });
    });

    errorObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-invalid', 'aria-describedby'],
      subtree: true,
    });

    this.observers.push(errorObserver);
  }

  /**
   * Handle new content for accessibility
   */
  private handleNewContent(nodes: HTMLElement[]): void {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Enhance touch targets
        this.enhanceTouchTargets(node);
        
        // Add focus management
        this.setupFocusManagement(node);
        
        // Announce content updates if enabled
        if (this.preferences.screenReader.announceContentUpdates) {
          const content = this.extractContentDescription(node);
          if (content) {
            this.announce({
              message: `New content: ${content}`,
              priority: 'polite',
              category: 'content',
            });
          }
        }
      }
    });
  }

  /**
   * Handle form errors
   */
  private handleFormError(element: HTMLElement): void {
    if (!this.preferences.screenReader.announceFormErrors) return;

    const isInvalid = element.getAttribute('aria-invalid') === 'true';
    const errorId = element.getAttribute('aria-describedby');
    
    if (isInvalid && errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        const fieldName = this.getFieldName(element);
        const errorMessage = errorElement.textContent || 'Invalid input';
        
        this.announce({
          message: `Error in ${fieldName}: ${errorMessage}`,
          priority: 'assertive',
          category: 'error',
        });
      }
    }
  }

  /**
   * Extract content description for announcements
   */
  private extractContentDescription(element: HTMLElement): string {
    // Get text content or aria-label
    const label = element.getAttribute('aria-label');
    if (label) return label;

    const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) return heading.textContent || '';

    const text = element.textContent?.trim();
    if (text && text.length > 0 && text.length < 100) {
      return text;
    }

    return '';
  }

  /**
   * Get field name for form elements
   */
  private getFieldName(element: HTMLElement): string {
    // Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check for associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }

    // Check for placeholder
    const placeholder = (element as HTMLInputElement).placeholder;
    if (placeholder) return placeholder;

    // Check for name attribute
    const name = (element as HTMLInputElement).name;
    if (name) return name.replace(/[_-]/g, ' ');

    return 'field';
  }

  /**
   * Initialize touch target monitoring
   */
  private initializeTouchTargetMonitoring(): void {
    if (!('ResizeObserver' in window)) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.validateTouchTarget(entry.target as HTMLElement);
      });
    });

    // Monitor interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    );

    interactiveElements.forEach((element) => {
      this.resizeObserver?.observe(element);
    });
  }

  /**
   * Validate touch target size
   */
  private validateTouchTarget(element: HTMLElement): TouchTargetInfo {
    const rect = element.getBoundingClientRect();
    const minSize = this.preferences.motorAssistance.largerTouchTargets ? 60 : 44;
    const recommendedSize = this.preferences.motorAssistance.largerTouchTargets ? 68 : 48;

    const currentSize = {
      width: rect.width,
      height: rect.height,
    };

    const meetsGuidelines = currentSize.width >= minSize && currentSize.height >= minSize;

    // Calculate spacing to nearest interactive element
    const spacing = this.calculateTouchTargetSpacing(element);

    const info: TouchTargetInfo = {
      element,
      currentSize,
      recommendedSize: {
        width: Math.max(recommendedSize, currentSize.width),
        height: Math.max(recommendedSize, currentSize.height),
      },
      meetsGuidelines,
      spacing,
    };

    // Apply enhancements if needed
    if (!meetsGuidelines && this.preferences.motorAssistance.largerTouchTargets) {
      this.enhanceTouchTarget(element, info);
    }

    return info;
  }

  /**
   * Calculate spacing between touch targets
   */
  private calculateTouchTargetSpacing(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"]'
    );

    let minSpacing = Infinity;

    interactiveElements.forEach((other) => {
      if (other === element) return;

      const otherRect = other.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(rect.left - otherRect.left, 2) + 
        Math.pow(rect.top - otherRect.top, 2)
      );

      minSpacing = Math.min(minSpacing, distance);
    });

    return minSpacing === Infinity ? 0 : minSpacing;
  }

  /**
   * Enhance touch target
   */
  private enhanceTouchTarget(element: HTMLElement, info: TouchTargetInfo): void {
    const { recommendedSize, currentSize } = info;
    
    // Add CSS class for touch enhancement
    element.classList.add('accessibility-enhanced-touch');
    
    // Apply minimum touch target size
    const style = element.style;
    style.minWidth = `${recommendedSize.width}px`;
    style.minHeight = `${recommendedSize.height}px`;
    
    // Ensure proper spacing
    if (info.spacing < 8) {
      style.margin = '4px';
    }
    
    // Add visual feedback for touch
    if (!element.style.cursor) {
      style.cursor = 'pointer';
    }
  }

  /**
   * Enhance touch targets for container
   */
  private enhanceTouchTargets(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    );

    interactiveElements.forEach((element) => {
      this.validateTouchTarget(element as HTMLElement);
      if (this.resizeObserver) {
        this.resizeObserver.observe(element);
      }
    });
  }

  /**
   * Setup focus management
   */
  private setupFocusManagement(container: HTMLElement = document.body): void {
    // Add focus event listeners
    container.addEventListener('focusin', this.handleFocusIn.bind(this));
    container.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // Setup focus indicators
    if (this.preferences.visualAids.focusIndicators) {
      this.enhanceFocusIndicators(container);
    }
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    // Add to focus history
    this.focusHistory.push(target);
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }

    // Announce focus change for screen readers
    if (this.preferences.screenReader.enabled) {
      const announcement = this.createFocusAnnouncement(target);
      if (announcement) {
        this.announce({
          message: announcement,
          priority: 'polite',
          category: 'navigation',
        });
      }
    }

    // Ensure element is visible
    this.ensureElementVisible(target);
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    // Remove any temporary focus enhancements
    const target = event.target as HTMLElement;
    target.classList.remove('accessibility-focus-enhanced');
  }

  /**
   * Create focus announcement for screen readers
   */
  private createFocusAnnouncement(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('title') || 
                  (element as HTMLInputElement).placeholder || 
                  element.textContent?.trim();

    let announcement = '';

    // Determine element type
    if (role) {
      announcement = role;
    } else if (tagName === 'button') {
      announcement = 'button';
    } else if (tagName === 'a') {
      announcement = 'link';
    } else if (tagName === 'input') {
      const type = (element as HTMLInputElement).type;
      announcement = type === 'text' ? 'text field' : `${type} input`;
    } else if (tagName === 'select') {
      announcement = 'dropdown';
    } else if (tagName === 'textarea') {
      announcement = 'text area';
    }

    // Add label
    if (label) {
      announcement += `, ${label}`;
    }

    // Add state information
    const states = this.getElementStates(element);
    if (states.length > 0) {
      announcement += `, ${states.join(', ')}`;
    }

    return announcement;
  }

  /**
   * Get element states for announcements
   */
  private getElementStates(element: HTMLElement): string[] {
    const states: string[] = [];

    if (element.getAttribute('aria-expanded') === 'true') {
      states.push('expanded');
    } else if (element.getAttribute('aria-expanded') === 'false') {
      states.push('collapsed');
    }

    if (element.getAttribute('aria-selected') === 'true') {
      states.push('selected');
    }

    if (element.getAttribute('aria-checked') === 'true') {
      states.push('checked');
    } else if (element.getAttribute('aria-checked') === 'false') {
      states.push('unchecked');
    }

    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      states.push('disabled');
    }

    if (element.getAttribute('aria-invalid') === 'true') {
      states.push('invalid');
    }

    return states;
  }

  /**
   * Ensure element is visible in viewport
   */
  private ensureElementVisible(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const viewport = {
      top: 0,
      left: 0,
      bottom: window.innerHeight,
      right: window.innerWidth,
    };

    const isVisible = rect.top >= viewport.top && 
                     rect.left >= viewport.left &&
                     rect.bottom <= viewport.bottom && 
                     rect.right <= viewport.right;

    if (!isVisible) {
      element.scrollIntoView({
        behavior: this.preferences.visualAids.reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }

  /**
   * Enhance focus indicators
   */
  private enhanceFocusIndicators(container: HTMLElement): void {
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-enhanced-focus {
        outline: 3px solid #005fcc !important;
        outline-offset: 2px !important;
        border-radius: 2px !important;
      }
      
      .accessibility-enhanced-touch {
        position: relative;
      }
      
      .accessibility-enhanced-touch::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: 44px;
        min-height: 44px;
        pointer-events: none;
        z-index: -1;
      }
    `;
    
    document.head.appendChild(style);

    // Add focus enhancement to focusable elements
    const focusableElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );

    focusableElements.forEach((element) => {
      element.addEventListener('focus', () => {
        element.classList.add('accessibility-enhanced-focus');
      });

      element.addEventListener('blur', () => {
        element.classList.remove('accessibility-enhanced-focus');
      });
    });
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.preferences.keyboardNavigation.enabled) return;

    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

    // Add skip links if enabled
    if (this.preferences.keyboardNavigation.skipLinks) {
      this.addSkipLinks();
    }

    // Setup arrow key navigation for lists and grids
    if (this.preferences.keyboardNavigation.arrowKeyNavigation) {
      this.setupArrowKeyNavigation();
    }
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const { key, altKey, ctrlKey, shiftKey } = event;

    // Custom shortcuts
    if (this.preferences.keyboardNavigation.customShortcuts) {
      if (altKey && key === 'h') {
        event.preventDefault();
        this.focusMainHeading();
        return;
      }

      if (altKey && key === 'm') {
        event.preventDefault();
        this.focusMainContent();
        return;
      }

      if (altKey && key === 'n') {
        event.preventDefault();
        this.focusNavigation();
        return;
      }
    }

    // Escape key handling
    if (key === 'Escape') {
      this.handleEscapeKey();
    }

    // Tab trapping in modals
    if (key === 'Tab' && this.preferences.keyboardNavigation.tabTrapping) {
      this.handleTabTrapping(event);
    }
  }

  /**
   * Add skip links
   */
  private addSkipLinks(): void {
    if (document.getElementById('accessibility-skip-links')) return;

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.id = 'accessibility-skip-links';
    skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 1000;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Focus main heading
   */
  private focusMainHeading(): void {
    const heading = document.querySelector('h1, [role="heading"][aria-level="1"]') as HTMLElement;
    if (heading) {
      heading.focus();
      this.announce({
        message: 'Focused on main heading',
        priority: 'polite',
        category: 'navigation',
      });
    }
  }

  /**
   * Focus main content
   */
  private focusMainContent(): void {
    const main = document.querySelector('main, [role="main"], #main-content') as HTMLElement;
    if (main) {
      main.focus();
      this.announce({
        message: 'Focused on main content',
        priority: 'polite',
        category: 'navigation',
      });
    }
  }

  /**
   * Focus navigation
   */
  private focusNavigation(): void {
    const nav = document.querySelector('nav, [role="navigation"], #navigation') as HTMLElement;
    if (nav) {
      nav.focus();
      this.announce({
        message: 'Focused on navigation',
        priority: 'polite',
        category: 'navigation',
      });
    }
  }

  /**
   * Handle escape key
   */
  private handleEscapeKey(): void {
    // Close any open modals or overlays
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [data-dismiss]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close any expanded menus
    const expandedMenu = document.querySelector('[aria-expanded="true"]') as HTMLElement;
    if (expandedMenu) {
      expandedMenu.click();
    }
  }

  /**
   * Handle tab trapping in modals
   */
  private handleTabTrapping(event: KeyboardEvent): void {
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Setup arrow key navigation
   */
  private setupArrowKeyNavigation(): void {
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      const parent = target.closest('[role="listbox"], [role="menu"], [role="grid"], [role="tablist"]');
      
      if (!parent) return;

      const { key } = event;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
        return;
      }

      event.preventDefault();
      this.handleArrowKeyNavigation(parent as HTMLElement, target, key);
    });
  }

  /**
   * Handle arrow key navigation in widgets
   */
  private handleArrowKeyNavigation(container: HTMLElement, current: HTMLElement, key: string): void {
    const role = container.getAttribute('role');
    const items = Array.from(container.querySelectorAll('[role="option"], [role="menuitem"], [role="gridcell"], [role="tab"]')) as HTMLElement[];
    
    if (items.length === 0) return;

    const currentIndex = items.indexOf(current);
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
    }
  }

  /**
   * Initialize voice control
   */
  private async initializeVoiceControl(): Promise<void> {
    if (!this.preferences.voiceControl.enabled) return;

    try {
      // Check for Web Speech API support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported');
        return;
      }

      this.voiceRecognition = new SpeechRecognition();
      this.voiceRecognition.continuous = true;
      this.voiceRecognition.interimResults = true;
      this.voiceRecognition.lang = 'en-US';

      this.voiceRecognition.onresult = (event: any) => {
        this.handleVoiceCommand(event);
      };

      this.voiceRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

    } catch (error) {
      console.error('Failed to initialize voice control:', error);
    }
  }

  /**
   * Handle voice commands
   */
  private handleVoiceCommand(event: any): void {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    
    if (!transcript) return;

    // Navigation commands
    if (transcript.includes('go to main')) {
      this.focusMainContent();
    } else if (transcript.includes('go to navigation')) {
      this.focusNavigation();
    } else if (transcript.includes('scroll up')) {
      window.scrollBy(0, -200);
    } else if (transcript.includes('scroll down')) {
      window.scrollBy(0, 200);
    } else if (transcript.includes('click')) {
      const target = document.activeElement as HTMLElement;
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) {
        target.click();
      }
    }

    // Form commands for dictation
    if (this.preferences.voiceControl.dictation && transcript.length > 10) {
      const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        if (transcript.startsWith('type ')) {
          const text = transcript.substring(5);
          activeElement.value += text;
        }
      }
    }
  }

  /**
   * Apply accessibility enhancements
   */
  private applyAccessibilityEnhancements(): void {
    this.applyVisualAids();
    this.applyMotorAssistance();
    this.setupAriaLabels();
  }

  /**
   * Apply visual aids
   */
  private applyVisualAids(): void {
    const root = document.documentElement;

    if (this.preferences.visualAids.highContrast) {
      root.classList.add('accessibility-high-contrast');
    }

    if (this.preferences.visualAids.largeText) {
      root.classList.add('accessibility-large-text');
    }

    if (this.preferences.visualAids.reducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    }

    // Add CSS for visual aids
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-high-contrast {
        filter: contrast(150%);
      }
      
      .accessibility-large-text {
        font-size: 1.2em !important;
      }
      
      .accessibility-large-text * {
        font-size: inherit !important;
      }
      
      .accessibility-reduced-motion * {
        animation-duration: 0.001s !important;
        transition-duration: 0.001s !important;
      }
      
      .accessibility-relaxed-spacing {
        letter-spacing: 0.1em !important;
        word-spacing: 0.2em !important;
        line-height: 1.8 !important;
      }
      
      .accessibility-loose-spacing {
        letter-spacing: 0.15em !important;
        word-spacing: 0.3em !important;
        line-height: 2 !important;
      }
    `;
    
    document.head.appendChild(style);

    // Apply text spacing
    if (this.preferences.visualAids.textSpacing !== 'normal') {
      root.classList.add(`accessibility-${this.preferences.visualAids.textSpacing}-spacing`);
    }
  }

  /**
   * Apply motor assistance
   */
  private applyMotorAssistance(): void {
    if (this.preferences.motorAssistance.largerTouchTargets) {
      document.documentElement.classList.add('accessibility-large-targets');
    }

    if (this.preferences.motorAssistance.clickAssistance) {
      this.setupClickAssistance();
    }
  }

  /**
   * Setup click assistance
   */
  private setupClickAssistance(): void {
    let clickTimer: NodeJS.Timeout | null = null;

    document.addEventListener('mousedown', (event) => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      clickTimer = setTimeout(() => {
        // Show click assistance indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: fixed;
          top: ${event.clientY - 10}px;
          left: ${event.clientX - 10}px;
          width: 20px;
          height: 20px;
          border: 2px solid #ff0000;
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
          document.body.removeChild(indicator);
        }, 1000);
      }, this.preferences.motorAssistance.gestureTimeouts);
    });

    document.addEventListener('mouseup', () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
    });
  }

  /**
   * Setup aria labels for unlabeled elements
   */
  private setupAriaLabels(): void {
    // Add labels to unlabeled interactive elements
    const unlabeledElements = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])'
    );

    unlabeledElements.forEach((element) => {
      const text = element.textContent?.trim();
      if (text && text.length > 0) {
        element.setAttribute('aria-label', text);
      }
    });

    // Add role attributes where missing
    const buttons = document.querySelectorAll('div[onclick], span[onclick]');
    buttons.forEach((element) => {
      if (!element.getAttribute('role')) {
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Load user preferences
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const response = await fetch('/api/accessibility/preferences');
      if (response.ok) {
        const userPrefs = await response.json();
        this.preferences = { ...this.preferences, ...userPrefs };
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }
  }

  /**
   * Save user preferences
   */
  public async savePreferences(preferences: Partial<AccessibilityPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      
      const response = await fetch('/api/accessibility/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.preferences),
      });

      if (response.ok) {
        this.applyAccessibilityEnhancements();
        
        this.announce({
          message: 'Accessibility preferences saved',
          priority: 'polite',
          category: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
      
      this.announce({
        message: 'Failed to save preferences',
        priority: 'assertive',
        category: 'error',
      });
    }
  }

  /**
   * Get current preferences
   */
  public getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Enable voice control
   */
  public async enableVoiceControl(): Promise<void> {
    if (!this.voiceRecognition) {
      await this.initializeVoiceControl();
    }

    if (this.voiceRecognition) {
      this.voiceRecognition.start();
      this.preferences.voiceControl.enabled = true;
      
      this.announce({
        message: 'Voice control enabled',
        priority: 'polite',
        category: 'status',
      });
    }
  }

  /**
   * Disable voice control
   */
  public disableVoiceControl(): void {
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
      this.preferences.voiceControl.enabled = false;
      
      this.announce({
        message: 'Voice control disabled',
        priority: 'polite',
        category: 'status',
      });
    }
  }

  /**
   * Get touch target analysis
   */
  public analyzeTouchTargets(): TouchTargetInfo[] {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    ) as NodeListOf<HTMLElement>;

    return Array.from(interactiveElements).map(element => 
      this.validateTouchTarget(element)
    );
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    // Remove observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Stop voice recognition
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }

    // Remove announcement region
    if (this.announceRegion) {
      this.announceRegion.remove();
    }

    this.isInitialized = false;
  }
}

// Export singleton instance
export const mobileAccessibilityService = new MobileAccessibilityService();
export default mobileAccessibilityService; 