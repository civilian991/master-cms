'use client';

export interface KeyboardNavigationPreferences {
  enabled: boolean;
  skipLinks: boolean;
  customShortcuts: boolean;
  tabTrapping: boolean;
  arrowKeyNavigation: boolean;
  spatialNavigation: boolean;
  focusWrapAround: boolean;
  announceNavigation: boolean;
  shortcuts: {
    [key: string]: {
      action: string;
      description: string;
      handler: () => void;
    };
  };
}

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  type: 'button' | 'link' | 'input' | 'select' | 'textarea' | 'other';
  group?: string;
  position: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isEnabled: boolean;
}

export interface NavigationMap {
  elements: FocusableElement[];
  groups: Map<string, FocusableElement[]>;
  current: FocusableElement | null;
  history: FocusableElement[];
}

class KeyboardNavigationService {
  private preferences: KeyboardNavigationPreferences;
  private navigationMap: NavigationMap;
  private skipLinksContainer: HTMLElement | null = null;
  private helpModal: HTMLElement | null = null;
  private keyStates: Set<string> = new Set();
  private lastFocusTime = 0;
  private observers: MutationObserver[] = [];
  private isInitialized = false;

  // Default keyboard shortcuts
  private defaultShortcuts = {
    'alt+h': {
      action: 'focusMainHeading',
      description: 'Focus on main heading',
      handler: () => this.focusMainHeading(),
    },
    'alt+m': {
      action: 'focusMainContent',
      description: 'Focus on main content',
      handler: () => this.focusMainContent(),
    },
    'alt+n': {
      action: 'focusNavigation',
      description: 'Focus on navigation',
      handler: () => this.focusNavigation(),
    },
    'alt+s': {
      action: 'focusSearch',
      description: 'Focus on search',
      handler: () => this.focusSearch(),
    },
    'alt+/': {
      action: 'showHelp',
      description: 'Show keyboard shortcuts help',
      handler: () => this.showKeyboardHelp(),
    },
    'f1': {
      action: 'showHelp',
      description: 'Show keyboard shortcuts help',
      handler: () => this.showKeyboardHelp(),
    },
    'ctrl+home': {
      action: 'focusFirst',
      description: 'Focus first element',
      handler: () => this.focusFirst(),
    },
    'ctrl+end': {
      action: 'focusLast',
      description: 'Focus last element',
      handler: () => this.focusLast(),
    },
    'ctrl+f6': {
      action: 'cycleLandmarks',
      description: 'Cycle through landmarks',
      handler: () => this.cycleLandmarks(),
    },
  };

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.navigationMap = this.createEmptyNavigationMap();
    this.initializeService();
  }

  /**
   * Get default keyboard navigation preferences
   */
  private getDefaultPreferences(): KeyboardNavigationPreferences {
    return {
      enabled: true,
      skipLinks: true,
      customShortcuts: true,
      tabTrapping: true,
      arrowKeyNavigation: true,
      spatialNavigation: false,
      focusWrapAround: true,
      announceNavigation: true,
      shortcuts: { ...this.defaultShortcuts },
    };
  }

  /**
   * Create empty navigation map
   */
  private createEmptyNavigationMap(): NavigationMap {
    return {
      elements: [],
      groups: new Map(),
      current: null,
      history: [],
    };
  }

  /**
   * Initialize the keyboard navigation service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Setup event listeners
      this.setupEventListeners();

      // Build initial navigation map
      this.buildNavigationMap();

      // Setup skip links
      if (this.preferences.skipLinks) {
        this.createSkipLinks();
      }

      // Setup observers for dynamic content
      this.setupObservers();

      // Load user preferences
      await this.loadUserPreferences();

      this.isInitialized = true;
      console.log('Keyboard Navigation Service initialized');
    } catch (error) {
      console.error('Failed to initialize Keyboard Navigation Service:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.buildNavigationMap();
      }
    });
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.preferences.enabled) return;

    const { key, altKey, ctrlKey, shiftKey, metaKey } = event;
    this.keyStates.add(key);

    // Create shortcut key combination
    const shortcutKey = this.createShortcutKey(event);

    // Handle custom shortcuts
    if (this.preferences.customShortcuts && this.preferences.shortcuts[shortcutKey]) {
      event.preventDefault();
      this.preferences.shortcuts[shortcutKey].handler();
      return;
    }

    // Handle arrow key navigation
    if (this.preferences.arrowKeyNavigation && this.isArrowKey(key)) {
      if (this.handleArrowKeyNavigation(event)) {
        event.preventDefault();
      }
      return;
    }

    // Handle tab trapping
    if (key === 'Tab' && this.preferences.tabTrapping) {
      if (this.handleTabTrapping(event)) {
        event.preventDefault();
      }
      return;
    }

    // Handle escape key
    if (key === 'Escape') {
      this.handleEscapeKey(event);
      return;
    }

    // Handle enter/space for activation
    if ((key === 'Enter' || key === ' ') && this.handleActivation(event)) {
      event.preventDefault();
      return;
    }
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.keyStates.delete(event.key);
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    const focusableElement = this.findFocusableElement(element);

    if (focusableElement) {
      this.updateCurrentFocus(focusableElement);
      
      if (this.preferences.announceNavigation) {
        this.announceFocus(focusableElement);
      }
    }

    this.lastFocusTime = Date.now();
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    // Add to history when focus leaves an element
    const element = event.target as HTMLElement;
    const focusableElement = this.findFocusableElement(element);

    if (focusableElement && this.navigationMap.current === focusableElement) {
      this.addToHistory(focusableElement);
    }
  }

  /**
   * Create shortcut key string
   */
  private createShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }

  /**
   * Check if key is an arrow key
   */
  private isArrowKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  }

  /**
   * Handle arrow key navigation
   */
  private handleArrowKeyNavigation(event: KeyboardEvent): boolean {
    const currentElement = document.activeElement as HTMLElement;
    if (!currentElement) return false;

    // Check if we're in a widget that handles its own arrow key navigation
    const widget = currentElement.closest('[role="listbox"], [role="menu"], [role="grid"], [role="tablist"], [role="radiogroup"]');
    
    if (widget) {
      return this.handleWidgetNavigation(widget as HTMLElement, event);
    }

    // Spatial navigation
    if (this.preferences.spatialNavigation) {
      return this.handleSpatialNavigation(event);
    }

    // Default linear navigation
    return this.handleLinearNavigation(event);
  }

  /**
   * Handle widget-specific navigation
   */
  private handleWidgetNavigation(widget: HTMLElement, event: KeyboardEvent): boolean {
    const role = widget.getAttribute('role');
    const { key } = event;

    const items = Array.from(widget.querySelectorAll(
      '[role="option"], [role="menuitem"], [role="gridcell"], [role="tab"], [role="radio"]'
    )) as HTMLElement[];

    if (items.length === 0) return false;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex;

    switch (role) {
      case 'listbox':
      case 'menu':
      case 'radiogroup':
        if (key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % items.length;
        } else if (key === 'ArrowUp') {
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        } else if (key === 'Home') {
          nextIndex = 0;
        } else if (key === 'End') {
          nextIndex = items.length - 1;
        }
        break;

      case 'tablist':
        if (key === 'ArrowRight' || key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % items.length;
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;

      case 'grid':
        // Grid navigation would require more complex logic
        return this.handleGridNavigation(widget, items, event);
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
      return true;
    }

    return false;
  }

  /**
   * Handle grid navigation
   */
  private handleGridNavigation(grid: HTMLElement, items: HTMLElement[], event: KeyboardEvent): boolean {
    // Implementation for 2D grid navigation
    const { key } = event;
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = items.indexOf(currentElement);
    
    if (currentIndex === -1) return false;

    // Calculate grid dimensions
    const row = currentElement.closest('[role="row"]');
    if (!row) return false;

    const rows = Array.from(grid.querySelectorAll('[role="row"]'));
    const rowIndex = rows.indexOf(row as HTMLElement);
    const cellsInRow = Array.from(row.querySelectorAll('[role="gridcell"]'));
    const cellIndex = cellsInRow.indexOf(currentElement);

    let newRowIndex = rowIndex;
    let newCellIndex = cellIndex;

    switch (key) {
      case 'ArrowUp':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        newRowIndex = Math.min(rows.length - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        newCellIndex = Math.max(0, cellIndex - 1);
        break;
      case 'ArrowRight':
        newCellIndex = Math.min(cellsInRow.length - 1, cellIndex + 1);
        break;
    }

    const newRow = rows[newRowIndex] as HTMLElement;
    const newCells = Array.from(newRow.querySelectorAll('[role="gridcell"]'));
    const newCell = newCells[Math.min(newCellIndex, newCells.length - 1)] as HTMLElement;

    if (newCell && newCell !== currentElement) {
      newCell.focus();
      return true;
    }

    return false;
  }

  /**
   * Handle spatial navigation
   */
  private handleSpatialNavigation(event: KeyboardEvent): boolean {
    const currentElement = document.activeElement as HTMLElement;
    if (!currentElement) return false;

    const currentRect = currentElement.getBoundingClientRect();
    const { key } = event;

    let bestCandidate: HTMLElement | null = null;
    let bestDistance = Infinity;

    for (const focusableEl of this.navigationMap.elements) {
      const element = focusableEl.element;
      if (element === currentElement || !focusableEl.isVisible || !focusableEl.isEnabled) continue;

      const rect = element.getBoundingClientRect();
      
      // Check if element is in the correct direction
      let isInDirection = false;
      switch (key) {
        case 'ArrowUp':
          isInDirection = rect.bottom <= currentRect.top;
          break;
        case 'ArrowDown':
          isInDirection = rect.top >= currentRect.bottom;
          break;
        case 'ArrowLeft':
          isInDirection = rect.right <= currentRect.left;
          break;
        case 'ArrowRight':
          isInDirection = rect.left >= currentRect.right;
          break;
      }

      if (!isInDirection) continue;

      // Calculate distance
      const distance = this.calculateDistance(currentRect, rect);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestCandidate = element;
      }
    }

    if (bestCandidate) {
      bestCandidate.focus();
      return true;
    }

    return false;
  }

  /**
   * Calculate distance between two rectangles
   */
  private calculateDistance(rect1: DOMRect, rect2: DOMRect): number {
    const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
    const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Handle linear navigation
   */
  private handleLinearNavigation(event: KeyboardEvent): boolean {
    const { key } = event;
    const currentElement = document.activeElement as HTMLElement;
    
    if (key === 'ArrowDown' || key === 'ArrowRight') {
      return this.focusNext();
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      return this.focusPrevious();
    }

    return false;
  }

  /**
   * Handle tab trapping
   */
  private handleTabTrapping(event: KeyboardEvent): boolean {
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (!modal) return false;

    const focusableElements = this.getFocusableElementsInContainer(modal);
    if (focusableElements.length === 0) return false;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        lastElement.focus();
        return true;
      }
    } else {
      if (activeElement === lastElement) {
        firstElement.focus();
        return true;
      }
    }

    return false;
  }

  /**
   * Handle escape key
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Close help modal
    if (this.helpModal) {
      this.hideKeyboardHelp();
      return;
    }

    // Close any open modal
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [data-dismiss]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
      return;
    }

    // Close any expanded menu
    const expandedElement = document.querySelector('[aria-expanded="true"]') as HTMLElement;
    if (expandedElement) {
      expandedElement.click();
      return;
    }

    // Return to main content
    this.focusMainContent();
  }

  /**
   * Handle activation (Enter/Space)
   */
  private handleActivation(event: KeyboardEvent): boolean {
    const element = document.activeElement as HTMLElement;
    if (!element) return false;

    const { key } = event;
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    // Space should not activate links (browser default)
    if (key === ' ' && (tagName === 'a' || role === 'link')) {
      return false;
    }

    // Enter activates buttons and links
    if (key === 'Enter' && (tagName === 'button' || tagName === 'a' || role === 'button' || role === 'link')) {
      element.click();
      return true;
    }

    // Space activates buttons, checkboxes, and radio buttons
    if (key === ' ') {
      if (tagName === 'button' || role === 'button' || 
          (tagName === 'input' && ['checkbox', 'radio'].includes((element as HTMLInputElement).type))) {
        element.click();
        return true;
      }
    }

    return false;
  }

  /**
   * Build navigation map
   */
  private buildNavigationMap(): void {
    this.navigationMap = this.createEmptyNavigationMap();
    
    const focusableElements = this.getAllFocusableElements();
    
    focusableElements.forEach(element => {
      const focusableEl = this.createFocusableElement(element);
      if (focusableEl) {
        this.navigationMap.elements.push(focusableEl);
        
        // Group elements by container
        const group = this.getElementGroup(element);
        if (group) {
          if (!this.navigationMap.groups.has(group)) {
            this.navigationMap.groups.set(group, []);
          }
          this.navigationMap.groups.get(group)!.push(focusableEl);
        }
      }
    });

    // Sort elements by tab order
    this.navigationMap.elements.sort((a, b) => {
      if (a.tabIndex !== b.tabIndex) {
        // Elements with positive tabindex come first
        if (a.tabIndex > 0 && b.tabIndex <= 0) return -1;
        if (b.tabIndex > 0 && a.tabIndex <= 0) return 1;
        if (a.tabIndex > 0 && b.tabIndex > 0) return a.tabIndex - b.tabIndex;
      }
      
      // Then by document order
      return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  /**
   * Get all focusable elements
   */
  private getAllFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Get focusable elements in container
   */
  private getFocusableElementsInContainer(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Create focusable element object
   */
  private createFocusableElement(element: HTMLElement): FocusableElement | null {
    if (!this.isElementVisible(element) || !this.isElementEnabled(element)) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    
    let type: FocusableElement['type'] = 'other';
    if (tagName === 'button' || role === 'button') type = 'button';
    else if (tagName === 'a' || role === 'link') type = 'link';
    else if (tagName === 'input') type = 'input';
    else if (tagName === 'select') type = 'select';
    else if (tagName === 'textarea') type = 'textarea';

    return {
      element,
      tabIndex: element.tabIndex || 0,
      type,
      group: this.getElementGroup(element),
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      isVisible: this.isElementVisible(element),
      isEnabled: this.isElementEnabled(element),
    };
  }

  /**
   * Get element group (landmark, form, etc.)
   */
  private getElementGroup(element: HTMLElement): string | undefined {
    const landmark = element.closest('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="form"], [role="search"]');
    if (landmark) {
      return landmark.getAttribute('role') || undefined;
    }

    const form = element.closest('form');
    if (form) {
      return 'form';
    }

    return undefined;
  }

  /**
   * Check if element is visible
   */
  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0 &&
           element.offsetParent !== null;
  }

  /**
   * Check if element is enabled
   */
  private isElementEnabled(element: HTMLElement): boolean {
    return !element.hasAttribute('disabled') &&
           element.getAttribute('aria-disabled') !== 'true';
  }

  /**
   * Find focusable element by DOM element
   */
  private findFocusableElement(element: HTMLElement): FocusableElement | null {
    return this.navigationMap.elements.find(fe => fe.element === element) || null;
  }

  /**
   * Update current focus
   */
  private updateCurrentFocus(focusableElement: FocusableElement): void {
    this.navigationMap.current = focusableElement;
  }

  /**
   * Add to history
   */
  private addToHistory(focusableElement: FocusableElement): void {
    this.navigationMap.history.push(focusableElement);
    
    // Keep only last 10 items
    if (this.navigationMap.history.length > 10) {
      this.navigationMap.history.shift();
    }
  }

  /**
   * Announce focus for screen readers
   */
  private announceFocus(focusableElement: FocusableElement): void {
    const element = focusableElement.element;
    const label = this.getElementLabel(element);
    const role = focusableElement.type;
    
    let announcement = '';
    
    if (label) {
      announcement = `${label}, ${role}`;
    } else {
      announcement = role;
    }

    // Add state information
    const states = this.getElementStates(element);
    if (states.length > 0) {
      announcement += `, ${states.join(', ')}`;
    }

    // Use accessibility service to announce if available
    if ((window as any).accessibilityService) {
      (window as any).accessibilityService.announce({
        message: announcement,
        priority: 'polite',
        category: 'navigation',
      });
    }
  }

  /**
   * Get element label
   */
  private getElementLabel(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent?.trim() || '';
    }

    // Check associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // Check text content
    const textContent = element.textContent?.trim();
    if (textContent) return textContent;

    // Check placeholder
    const placeholder = (element as HTMLInputElement).placeholder;
    if (placeholder) return placeholder;

    // Check alt text for images
    const alt = (element as HTMLImageElement).alt;
    if (alt) return alt;

    return '';
  }

  /**
   * Get element states
   */
  private getElementStates(element: HTMLElement): string[] {
    const states: string[] = [];

    const expanded = element.getAttribute('aria-expanded');
    if (expanded === 'true') states.push('expanded');
    else if (expanded === 'false') states.push('collapsed');

    const selected = element.getAttribute('aria-selected');
    if (selected === 'true') states.push('selected');

    const checked = element.getAttribute('aria-checked') || (element as HTMLInputElement).checked?.toString();
    if (checked === 'true') states.push('checked');
    else if (checked === 'false') states.push('unchecked');

    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      states.push('disabled');
    }

    const invalid = element.getAttribute('aria-invalid');
    if (invalid === 'true') states.push('invalid');

    return states;
  }

  /**
   * Focus next element
   */
  public focusNext(): boolean {
    const currentIndex = this.getCurrentElementIndex();
    const nextIndex = this.preferences.focusWrapAround ?
      (currentIndex + 1) % this.navigationMap.elements.length :
      Math.min(currentIndex + 1, this.navigationMap.elements.length - 1);

    if (nextIndex !== currentIndex && this.navigationMap.elements[nextIndex]) {
      this.navigationMap.elements[nextIndex].element.focus();
      return true;
    }

    return false;
  }

  /**
   * Focus previous element
   */
  public focusPrevious(): boolean {
    const currentIndex = this.getCurrentElementIndex();
    const prevIndex = this.preferences.focusWrapAround ?
      currentIndex === 0 ? this.navigationMap.elements.length - 1 : currentIndex - 1 :
      Math.max(currentIndex - 1, 0);

    if (prevIndex !== currentIndex && this.navigationMap.elements[prevIndex]) {
      this.navigationMap.elements[prevIndex].element.focus();
      return true;
    }

    return false;
  }

  /**
   * Get current element index
   */
  private getCurrentElementIndex(): number {
    const activeElement = document.activeElement as HTMLElement;
    return this.navigationMap.elements.findIndex(fe => fe.element === activeElement);
  }

  /**
   * Focus first element
   */
  public focusFirst(): void {
    if (this.navigationMap.elements.length > 0) {
      this.navigationMap.elements[0].element.focus();
    }
  }

  /**
   * Focus last element
   */
  public focusLast(): void {
    if (this.navigationMap.elements.length > 0) {
      this.navigationMap.elements[this.navigationMap.elements.length - 1].element.focus();
    }
  }

  /**
   * Focus main heading
   */
  public focusMainHeading(): void {
    const heading = document.querySelector('h1, [role="heading"][aria-level="1"]') as HTMLElement;
    if (heading) {
      heading.focus();
    }
  }

  /**
   * Focus main content
   */
  public focusMainContent(): void {
    const main = document.querySelector('main, [role="main"], #main-content') as HTMLElement;
    if (main) {
      // Make sure main is focusable
      if (main.tabIndex < 0) {
        main.tabIndex = -1;
      }
      main.focus();
    }
  }

  /**
   * Focus navigation
   */
  public focusNavigation(): void {
    const nav = document.querySelector('nav, [role="navigation"], #navigation') as HTMLElement;
    if (nav) {
      // Focus first focusable element in navigation
      const focusableInNav = this.getFocusableElementsInContainer(nav);
      if (focusableInNav.length > 0) {
        focusableInNav[0].focus();
      } else {
        nav.tabIndex = -1;
        nav.focus();
      }
    }
  }

  /**
   * Focus search
   */
  public focusSearch(): void {
    const search = document.querySelector('input[type="search"], [role="search"] input, #search') as HTMLElement;
    if (search) {
      search.focus();
    }
  }

  /**
   * Cycle through landmarks
   */
  public cycleLandmarks(): void {
    const landmarks = Array.from(document.querySelectorAll(
      '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="search"]'
    )) as HTMLElement[];

    if (landmarks.length === 0) return;

    const activeElement = document.activeElement as HTMLElement;
    const currentLandmark = activeElement.closest('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="search"]') as HTMLElement;
    
    let nextIndex = 0;
    if (currentLandmark) {
      const currentIndex = landmarks.indexOf(currentLandmark);
      nextIndex = (currentIndex + 1) % landmarks.length;
    }

    const nextLandmark = landmarks[nextIndex];
    if (nextLandmark.tabIndex < 0) {
      nextLandmark.tabIndex = -1;
    }
    nextLandmark.focus();
  }

  /**
   * Create skip links
   */
  private createSkipLinks(): void {
    if (this.skipLinksContainer) return;

    this.skipLinksContainer = document.createElement('div');
    this.skipLinksContainer.id = 'keyboard-skip-links';
    this.skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #keyboard-skip-links {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10000;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px 12px;
        text-decoration: none;
        border-radius: 0 0 4px 4px;
        font-size: 14px;
        font-weight: bold;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 0;
      }
      
      .skip-link:hover {
        background: #333;
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(this.skipLinksContainer, document.body.firstChild);
  }

  /**
   * Show keyboard help modal
   */
  public showKeyboardHelp(): void {
    if (this.helpModal) return;

    this.helpModal = document.createElement('div');
    this.helpModal.innerHTML = `
      <div class="keyboard-help-overlay" role="dialog" aria-modal="true" aria-labelledby="keyboard-help-title">
        <div class="keyboard-help-content">
          <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
          <div class="keyboard-help-shortcuts">
            ${this.generateShortcutsHTML()}
          </div>
          <button class="keyboard-help-close" aria-label="Close help">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-help-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .keyboard-help-content {
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
      }
      
      .keyboard-help-shortcuts {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px 16px;
        margin: 16px 0;
      }
      
      .keyboard-help-shortcuts .shortcut-key {
        font-family: monospace;
        background: #f5f5f5;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
      }
      
      .keyboard-help-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.helpModal);

    // Setup close functionality
    const closeButton = this.helpModal.querySelector('.keyboard-help-close') as HTMLElement;
    closeButton.addEventListener('click', () => this.hideKeyboardHelp());

    this.helpModal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideKeyboardHelp();
      }
    });

    // Focus the close button
    closeButton.focus();
  }

  /**
   * Hide keyboard help modal
   */
  public hideKeyboardHelp(): void {
    if (this.helpModal) {
      this.helpModal.remove();
      this.helpModal = null;
    }
  }

  /**
   * Generate shortcuts HTML
   */
  private generateShortcutsHTML(): string {
    return Object.entries(this.preferences.shortcuts)
      .map(([key, shortcut]) => `
        <div class="shortcut-key">${key}</div>
        <div class="shortcut-description">${shortcut.description}</div>
      `)
      .join('');
  }

  /**
   * Setup observers for dynamic content
   */
  private setupObservers(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldRebuild = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && 
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
          shouldRebuild = true;
        }
      });

      if (shouldRebuild) {
        // Debounce rebuilding
        clearTimeout((this as any).rebuildTimeout);
        (this as any).rebuildTimeout = setTimeout(() => {
          this.buildNavigationMap();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  /**
   * Add custom shortcut
   */
  public addCustomShortcut(key: string, action: string, description: string, handler: () => void): void {
    this.preferences.shortcuts[key] = { action, description, handler };
    this.saveUserPreferences();
  }

  /**
   * Remove custom shortcut
   */
  public removeCustomShortcut(key: string): void {
    delete this.preferences.shortcuts[key];
    this.saveUserPreferences();
  }

  /**
   * Update preferences
   */
  public updatePreferences(preferences: Partial<KeyboardNavigationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    
    if (preferences.skipLinks !== undefined) {
      if (preferences.skipLinks && !this.skipLinksContainer) {
        this.createSkipLinks();
      } else if (!preferences.skipLinks && this.skipLinksContainer) {
        this.skipLinksContainer.remove();
        this.skipLinksContainer = null;
      }
    }

    this.saveUserPreferences();
  }

  /**
   * Get current preferences
   */
  public getPreferences(): KeyboardNavigationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get navigation statistics
   */
  public getNavigationStats(): {
    totalElements: number;
    elementsByType: Record<string, number>;
    elementsByGroup: Record<string, number>;
    currentIndex: number;
  } {
    const elementsByType: Record<string, number> = {};
    const elementsByGroup: Record<string, number> = {};

    this.navigationMap.elements.forEach(el => {
      elementsByType[el.type] = (elementsByType[el.type] || 0) + 1;
      if (el.group) {
        elementsByGroup[el.group] = (elementsByGroup[el.group] || 0) + 1;
      }
    });

    return {
      totalElements: this.navigationMap.elements.length,
      elementsByType,
      elementsByGroup,
      currentIndex: this.getCurrentElementIndex(),
    };
  }

  /**
   * Load user preferences
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const response = await fetch('/api/accessibility/keyboard-preferences');
      if (response.ok) {
        const userPrefs = await response.json();
        this.preferences = { ...this.preferences, ...userPrefs };
        
        // Restore custom shortcuts
        if (userPrefs.shortcuts) {
          Object.entries(userPrefs.shortcuts).forEach(([key, shortcut]: [string, any]) => {
            if (!this.defaultShortcuts[key]) {
              this.preferences.shortcuts[key] = shortcut;
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load keyboard navigation preferences:', error);
    }
  }

  /**
   * Save user preferences
   */
  private async saveUserPreferences(): Promise<void> {
    try {
      await fetch('/api/accessibility/keyboard-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.preferences),
      });
    } catch (error) {
      console.error('Failed to save keyboard navigation preferences:', error);
    }
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    // Remove observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Remove skip links
    if (this.skipLinksContainer) {
      this.skipLinksContainer.remove();
      this.skipLinksContainer = null;
    }

    // Remove help modal
    if (this.helpModal) {
      this.helpModal.remove();
      this.helpModal = null;
    }

    // Clear maps and state
    this.navigationMap = this.createEmptyNavigationMap();
    this.keyStates.clear();

    this.isInitialized = false;
  }
}

// Export singleton instance
export const keyboardNavigationService = new KeyboardNavigationService();
export default keyboardNavigationService; 