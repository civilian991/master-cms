'use client';

export interface VisualAccessibilityPreferences {
  fontSize: {
    scale: number; // 1.0 = normal, 1.5 = 150%, etc.
    minSize: number; // minimum font size in px
    lineHeight: number; // line height multiplier
  };
  contrast: {
    mode: 'normal' | 'high' | 'extra-high' | 'inverted';
    customColors: boolean;
    backgroundLight: string;
    backgroundDark: string;
    textLight: string;
    textDark: string;
  };
  colorBlindness: {
    mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    severity: 'mild' | 'moderate' | 'severe';
  };
  spacing: {
    letterSpacing: number; // em units
    wordSpacing: number; // em units
    paragraphSpacing: number; // em units
  };
  animations: {
    reducedMotion: boolean;
    disableAutoplay: boolean;
    pauseAnimations: boolean;
  };
  focus: {
    enhancedIndicators: boolean;
    indicatorStyle: 'outline' | 'background' | 'underline' | 'border';
    indicatorColor: string;
    indicatorWidth: number; // px
  };
  cursor: {
    enhancedPointer: boolean;
    pointerSize: 'normal' | 'large' | 'extra-large';
    crosshair: boolean;
  };
}

export interface ColorProfile {
  name: string;
  background: string;
  text: string;
  accent: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

class VisualAccessibilityService {
  private preferences: VisualAccessibilityPreferences;
  private styleElement: HTMLStyleElement | null = null;
  private colorFilters: Map<string, string> = new Map();
  private observers: MutationObserver[] = [];

  // Predefined color profiles
  private colorProfiles: Map<string, ColorProfile> = new Map([
    ['default', {
      name: 'Default',
      background: '#ffffff',
      text: '#000000',
      accent: '#0066cc',
      border: '#cccccc',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
    }],
    ['high-contrast', {
      name: 'High Contrast',
      background: '#000000',
      text: '#ffffff',
      accent: '#ffff00',
      border: '#ffffff',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
      info: '#00ffff',
    }],
    ['dark-high-contrast', {
      name: 'Dark High Contrast',
      background: '#1a1a1a',
      text: '#ffffff',
      accent: '#00d4ff',
      border: '#555555',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    }],
    ['yellow-black', {
      name: 'Yellow on Black',
      background: '#000000',
      text: '#ffff00',
      accent: '#ffffff',
      border: '#ffff00',
      success: '#00ff00',
      warning: '#ff8800',
      error: '#ff0000',
      info: '#00ffff',
    }],
  ]);

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.initializeService();
  }

  /**
   * Get default visual accessibility preferences
   */
  private getDefaultPreferences(): VisualAccessibilityPreferences {
    return {
      fontSize: {
        scale: this.detectFontScale(),
        minSize: 16,
        lineHeight: 1.5,
      },
      contrast: {
        mode: this.detectContrastPreference(),
        customColors: false,
        backgroundLight: '#ffffff',
        backgroundDark: '#000000',
        textLight: '#000000',
        textDark: '#ffffff',
      },
      colorBlindness: {
        mode: 'none',
        severity: 'moderate',
      },
      spacing: {
        letterSpacing: 0,
        wordSpacing: 0,
        paragraphSpacing: 1,
      },
      animations: {
        reducedMotion: this.detectReducedMotionPreference(),
        disableAutoplay: false,
        pauseAnimations: false,
      },
      focus: {
        enhancedIndicators: true,
        indicatorStyle: 'outline',
        indicatorColor: '#0066cc',
        indicatorWidth: 2,
      },
      cursor: {
        enhancedPointer: false,
        pointerSize: 'normal',
        crosshair: false,
      },
    };
  }

  /**
   * Detect user's font scale preference
   */
  private detectFontScale(): number {
    // Check for browser zoom level or user preferences
    const testElement = document.createElement('div');
    testElement.style.cssText = 'font-size: 1rem; position: absolute; visibility: hidden;';
    document.body.appendChild(testElement);
    
    const computedSize = parseFloat(window.getComputedStyle(testElement).fontSize);
    document.body.removeChild(testElement);
    
    return computedSize / 16; // Base size is 16px
  }

  /**
   * Detect contrast preference
   */
  private detectContrastPreference(): 'normal' | 'high' | 'extra-high' | 'inverted' {
    if (typeof window === 'undefined') return 'normal';
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high';
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'high';
    }
    
    return 'normal';
  }

  /**
   * Detect reduced motion preference
   */
  private detectReducedMotionPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Initialize the visual accessibility service
   */
  private async initializeService(): Promise<void> {
    try {
      // Create style element for dynamic CSS
      this.createStyleElement();

      // Setup color blind filters
      this.setupColorBlindFilters();

      // Load user preferences
      await this.loadUserPreferences();

      // Apply initial settings
      this.applyAllSettings();

      // Setup observers for dynamic content
      this.setupObservers();

      console.log('Visual Accessibility Service initialized');
    } catch (error) {
      console.error('Failed to initialize Visual Accessibility Service:', error);
    }
  }

  /**
   * Create style element for dynamic CSS
   */
  private createStyleElement(): void {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'visual-accessibility-styles';
    document.head.appendChild(this.styleElement);
  }

  /**
   * Setup color blind filters
   */
  private setupColorBlindFilters(): void {
    // SVG filters for color blindness simulation
    const svgFilters = `
      <svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
        <defs>
          <filter id="protanopia" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" values="0.567 0.433 0     0 0
                                               0.558 0.442 0     0 0
                                               0     0.242 0.758 0 0
                                               0     0     0     1 0"/>
          </filter>
          <filter id="deuteranopia" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" values="0.625 0.375 0   0 0
                                               0.7   0.3   0   0 0
                                               0     0.3   0.7 0 0
                                               0     0     0   1 0"/>
          </filter>
          <filter id="tritanopia" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" values="0.95  0.05  0     0 0
                                               0     0.433 0.567 0 0
                                               0     0.475 0.525 0 0
                                               0     0     0     1 0"/>
          </filter>
          <filter id="achromatopsia" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0
                                               0.299 0.587 0.114 0 0
                                               0.299 0.587 0.114 0 0
                                               0     0     0     1 0"/>
          </filter>
        </defs>
      </svg>
    `;

    // Add SVG to document
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = svgFilters;
    document.body.appendChild(svgContainer);

    // Map filters
    this.colorFilters.set('protanopia', 'url(#protanopia)');
    this.colorFilters.set('deuteranopia', 'url(#deuteranopia)');
    this.colorFilters.set('tritanopia', 'url(#tritanopia)');
    this.colorFilters.set('achromatopsia', 'url(#achromatopsia)');
  }

  /**
   * Setup observers for dynamic content
   */
  private setupObservers(): void {
    // Observer for new content
    const contentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.applySettingsToNewContent(Array.from(mutation.addedNodes) as HTMLElement[]);
        }
      });
    });

    contentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(contentObserver);
  }

  /**
   * Apply settings to new content
   */
  private applySettingsToNewContent(nodes: HTMLElement[]): void {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        this.applyFocusEnhancements(node);
        this.applyCursorEnhancements(node);
      }
    });
  }

  /**
   * Apply all accessibility settings
   */
  private applyAllSettings(): void {
    this.applyFontSettings();
    this.applyContrastSettings();
    this.applyColorBlindnessSettings();
    this.applySpacingSettings();
    this.applyAnimationSettings();
    this.applyFocusSettings();
    this.applyCursorSettings();
  }

  /**
   * Apply font settings
   */
  private applyFontSettings(): void {
    if (!this.styleElement) return;

    const { fontSize } = this.preferences;
    
    const fontCSS = `
      /* Font Size Scaling */
      html {
        font-size: ${fontSize.scale * 16}px !important;
      }
      
      * {
        font-size: inherit !important;
        line-height: ${fontSize.lineHeight} !important;
        min-height: ${fontSize.minSize}px;
      }
      
      /* Ensure minimum sizes for specific elements */
      p, li, span, div, button, input, textarea, select {
        font-size: max(${fontSize.minSize}px, 1em) !important;
      }
      
      /* Scale headings proportionally */
      h1 { font-size: max(${fontSize.minSize * 1.8}px, 2.25em) !important; }
      h2 { font-size: max(${fontSize.minSize * 1.6}px, 2em) !important; }
      h3 { font-size: max(${fontSize.minSize * 1.4}px, 1.75em) !important; }
      h4 { font-size: max(${fontSize.minSize * 1.2}px, 1.5em) !important; }
      h5 { font-size: max(${fontSize.minSize * 1.1}px, 1.25em) !important; }
      h6 { font-size: max(${fontSize.minSize}px, 1.125em) !important; }
    `;

    this.updateStyleElement(fontCSS, 'font-settings');
  }

  /**
   * Apply contrast settings
   */
  private applyContrastSettings(): void {
    if (!this.styleElement) return;

    const { contrast } = this.preferences;
    let profile: ColorProfile;

    if (contrast.customColors) {
      profile = {
        name: 'Custom',
        background: contrast.backgroundLight,
        text: contrast.textLight,
        accent: '#0066cc',
        border: '#cccccc',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8',
      };
    } else {
      profile = this.getColorProfile(contrast.mode);
    }

    const contrastCSS = `
      /* High Contrast Colors */
      :root {
        --bg-color: ${profile.background} !important;
        --text-color: ${profile.text} !important;
        --accent-color: ${profile.accent} !important;
        --border-color: ${profile.border} !important;
        --success-color: ${profile.success} !important;
        --warning-color: ${profile.warning} !important;
        --error-color: ${profile.error} !important;
        --info-color: ${profile.info} !important;
      }
      
      /* Apply to all elements */
      *, *::before, *::after {
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;
        border-color: var(--border-color) !important;
      }
      
      /* Links and buttons */
      a, button, [role="button"] {
        color: var(--accent-color) !important;
        background-color: transparent !important;
      }
      
      a:hover, button:hover, [role="button"]:hover {
        background-color: var(--accent-color) !important;
        color: var(--bg-color) !important;
      }
      
      /* Form elements */
      input, textarea, select {
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;
        border: 2px solid var(--border-color) !important;
      }
      
      /* Status colors */
      .success, .alert-success { color: var(--success-color) !important; }
      .warning, .alert-warning { color: var(--warning-color) !important; }
      .error, .alert-error, .alert-danger { color: var(--error-color) !important; }
      .info, .alert-info { color: var(--info-color) !important; }
      
      /* Remove background images and shadows */
      * {
        background-image: none !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }
    `;

    this.updateStyleElement(contrastCSS, 'contrast-settings');
  }

  /**
   * Get color profile by mode
   */
  private getColorProfile(mode: string): ColorProfile {
    const profile = this.colorProfiles.get(mode) || this.colorProfiles.get('default');
    return profile!;
  }

  /**
   * Apply color blindness settings
   */
  private applyColorBlindnessSettings(): void {
    const { colorBlindness } = this.preferences;
    
    if (colorBlindness.mode === 'none') {
      document.documentElement.style.filter = '';
      return;
    }

    const filter = this.colorFilters.get(colorBlindness.mode);
    if (filter) {
      document.documentElement.style.filter = filter;
    }
  }

  /**
   * Apply spacing settings
   */
  private applySpacingSettings(): void {
    if (!this.styleElement) return;

    const { spacing } = this.preferences;
    
    const spacingCSS = `
      /* Text Spacing */
      * {
        letter-spacing: ${spacing.letterSpacing}em !important;
        word-spacing: ${spacing.wordSpacing}em !important;
      }
      
      p, li, div {
        margin-bottom: ${spacing.paragraphSpacing}em !important;
      }
      
      /* Touch target spacing */
      button, a, input, select, textarea, [role="button"], [role="link"] {
        margin: 4px !important;
        padding: 8px 12px !important;
      }
    `;

    this.updateStyleElement(spacingCSS, 'spacing-settings');
  }

  /**
   * Apply animation settings
   */
  private applyAnimationSettings(): void {
    if (!this.styleElement) return;

    const { animations } = this.preferences;
    
    let animationCSS = '';

    if (animations.reducedMotion) {
      animationCSS += `
        *, *::before, *::after {
          animation-duration: 0.001s !important;
          animation-delay: 0.001s !important;
          transition-duration: 0.001s !important;
          transition-delay: 0.001s !important;
        }
      `;
    }

    if (animations.disableAutoplay) {
      animationCSS += `
        video[autoplay] { autoplay: false !important; }
        audio[autoplay] { autoplay: false !important; }
        [autoplay] { autoplay: false !important; }
      `;
    }

    if (animations.pauseAnimations) {
      animationCSS += `
        *, *::before, *::after {
          animation-play-state: paused !important;
        }
      `;
    }

    this.updateStyleElement(animationCSS, 'animation-settings');
  }

  /**
   * Apply focus settings
   */
  private applyFocusSettings(): void {
    if (!this.styleElement) return;

    const { focus } = this.preferences;
    
    if (!focus.enhancedIndicators) return;

    let focusCSS = '';

    switch (focus.indicatorStyle) {
      case 'outline':
        focusCSS = `
          *:focus {
            outline: ${focus.indicatorWidth}px solid ${focus.indicatorColor} !important;
            outline-offset: 2px !important;
          }
        `;
        break;
      case 'background':
        focusCSS = `
          *:focus {
            background-color: ${focus.indicatorColor} !important;
            color: white !important;
            outline: none !important;
          }
        `;
        break;
      case 'underline':
        focusCSS = `
          *:focus {
            border-bottom: ${focus.indicatorWidth}px solid ${focus.indicatorColor} !important;
            outline: none !important;
          }
        `;
        break;
      case 'border':
        focusCSS = `
          *:focus {
            border: ${focus.indicatorWidth}px solid ${focus.indicatorColor} !important;
            outline: none !important;
          }
        `;
        break;
    }

    this.updateStyleElement(focusCSS, 'focus-settings');
    this.applyFocusEnhancements(document.body);
  }

  /**
   * Apply focus enhancements to container
   */
  private applyFocusEnhancements(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );

    focusableElements.forEach((element) => {
      element.addEventListener('focus', () => {
        (element as HTMLElement).classList.add('accessibility-focus-enhanced');
      });

      element.addEventListener('blur', () => {
        (element as HTMLElement).classList.remove('accessibility-focus-enhanced');
      });
    });
  }

  /**
   * Apply cursor settings
   */
  private applyCursorSettings(): void {
    if (!this.styleElement) return;

    const { cursor } = this.preferences;
    
    let cursorCSS = '';

    if (cursor.enhancedPointer) {
      const sizeMap = {
        normal: '16px',
        large: '24px',
        'extra-large': '32px',
      };

      cursorCSS += `
        * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${sizeMap[cursor.pointerSize]}" height="${sizeMap[cursor.pointerSize]}" viewBox="0 0 24 24"><path fill="black" stroke="white" stroke-width="1" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') 12 12, auto !important;
        }
        
        button, a, [role="button"], [role="link"] {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${sizeMap[cursor.pointerSize]}" height="${sizeMap[cursor.pointerSize]}" viewBox="0 0 24 24"><path fill="blue" stroke="white" stroke-width="1" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') 12 12, pointer !important;
        }
      `;
    }

    if (cursor.crosshair) {
      cursorCSS += `
        * {
          cursor: crosshair !important;
        }
      `;
    }

    this.updateStyleElement(cursorCSS, 'cursor-settings');
    this.applyCursorEnhancements(document.body);
  }

  /**
   * Apply cursor enhancements to container
   */
  private applyCursorEnhancements(container: HTMLElement): void {
    if (!this.preferences.cursor.enhancedPointer) return;

    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"]'
    );

    interactiveElements.forEach((element) => {
      element.addEventListener('mouseenter', () => {
        (element as HTMLElement).style.transform = 'scale(1.05)';
      });

      element.addEventListener('mouseleave', () => {
        (element as HTMLElement).style.transform = '';
      });
    });
  }

  /**
   * Update style element with new CSS
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
  public updatePreferences(preferences: Partial<VisualAccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.applyAllSettings();
    this.saveUserPreferences();
  }

  /**
   * Get current preferences
   */
  public getPreferences(): VisualAccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Get available color profiles
   */
  public getColorProfiles(): ColorProfile[] {
    return Array.from(this.colorProfiles.values());
  }

  /**
   * Add custom color profile
   */
  public addColorProfile(profile: ColorProfile): void {
    this.colorProfiles.set(profile.name.toLowerCase().replace(/\s+/g, '-'), profile);
  }

  /**
   * Reset to default settings
   */
  public resetToDefaults(): void {
    this.preferences = this.getDefaultPreferences();
    this.applyAllSettings();
    this.saveUserPreferences();
  }

  /**
   * Toggle specific feature
   */
  public toggleFeature(feature: keyof VisualAccessibilityPreferences, subFeature?: string): void {
    if (subFeature) {
      const featureObj = this.preferences[feature] as any;
      featureObj[subFeature] = !featureObj[subFeature];
    } else {
      // Handle boolean features
      if (typeof this.preferences[feature] === 'boolean') {
        (this.preferences[feature] as any) = !this.preferences[feature];
      }
    }
    
    this.applyAllSettings();
    this.saveUserPreferences();
  }

  /**
   * Test color combination accessibility
   */
  public testColorContrast(foreground: string, background: string): {
    ratio: number;
    aaCompliant: boolean;
    aaaCompliant: boolean;
    recommendations: string[];
  } {
    const ratio = this.calculateContrastRatio(foreground, background);
    
    return {
      ratio,
      aaCompliant: ratio >= 4.5,
      aaaCompliant: ratio >= 7,
      recommendations: this.getContrastRecommendations(ratio),
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get color luminance
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }

  /**
   * Get contrast recommendations
   */
  private getContrastRecommendations(ratio: number): string[] {
    const recommendations: string[] = [];

    if (ratio < 3) {
      recommendations.push('Very poor contrast. Consider using significantly different colors.');
    } else if (ratio < 4.5) {
      recommendations.push('Below AA standard. Increase contrast for better accessibility.');
    } else if (ratio < 7) {
      recommendations.push('Meets AA standard but not AAA. Consider slight adjustments for optimal accessibility.');
    } else {
      recommendations.push('Excellent contrast! Meets AAA accessibility standards.');
    }

    return recommendations;
  }

  /**
   * Load user preferences
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const response = await fetch('/api/accessibility/visual-preferences');
      if (response.ok) {
        const userPrefs = await response.json();
        this.preferences = { ...this.preferences, ...userPrefs };
      }
    } catch (error) {
      console.warn('Failed to load visual accessibility preferences:', error);
    }
  }

  /**
   * Save user preferences
   */
  private async saveUserPreferences(): Promise<void> {
    try {
      await fetch('/api/accessibility/visual-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.preferences),
      });
    } catch (error) {
      console.error('Failed to save visual accessibility preferences:', error);
    }
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    // Remove observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Remove style element
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Reset document filters
    document.documentElement.style.filter = '';
  }
}

// Export singleton instance
export const visualAccessibilityService = new VisualAccessibilityService();
export default visualAccessibilityService; 