import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Critical CSS extraction and management for mobile performance
 */

export interface CriticalCSSConfig {
  enabled: boolean;
  inline: boolean;
  threshold: number; // Size threshold for inlining (in bytes)
  mobileFirst: boolean;
}

const CRITICAL_CSS_CONFIG: CriticalCSSConfig = {
  enabled: process.env.NODE_ENV === 'production',
  inline: true,
  threshold: 10000, // 10KB threshold
  mobileFirst: true,
};

// Critical CSS for mobile-first loading
export const CRITICAL_CSS = `
  /* Critical Mobile-First Styles */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    margin: 0;
    font-family: var(--font-inter, system-ui, -apple-system, sans-serif);
    font-size: 16px;
    line-height: 1.5;
    color: #1f2937;
    background-color: #ffffff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  /* Mobile-optimized layout */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Critical navigation styles */
  .nav-mobile {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e5e7eb;
  }

  /* Mobile-first typography */
  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 1rem 0;
    font-weight: 700;
    line-height: 1.2;
  }

  h1 { font-size: 2rem; }
  h2 { font-size: 1.75rem; }
  h3 { font-size: 1.5rem; }

  /* Touch-friendly buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 44px;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  /* Loading states */
  .loading {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Mobile-optimized images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Performance optimizations */
  .will-change-transform {
    will-change: transform;
  }

  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  @media (min-width: 768px) {
    .container {
      padding: 0 2rem;
    }
    
    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.75rem; }
  }
`;

export class CriticalCSSManager {
  private static instance: CriticalCSSManager;
  private criticalCSS: string = '';
  private loaded: boolean = false;

  private constructor() {}

  public static getInstance(): CriticalCSSManager {
    if (!CriticalCSSManager.instance) {
      CriticalCSSManager.instance = new CriticalCSSManager();
    }
    return CriticalCSSManager.instance;
  }

  /**
   * Get critical CSS for inlining
   */
  public getCriticalCSS(): string {
    if (!this.loaded) {
      this.loadCriticalCSS();
    }
    return this.criticalCSS;
  }

  /**
   * Load critical CSS from file or use default
   */
  private loadCriticalCSS(): void {
    try {
      if (CRITICAL_CSS_CONFIG.enabled) {
        // Try to load from build output
        const criticalPath = join(process.cwd(), '.next', 'critical.css');
        try {
          this.criticalCSS = readFileSync(criticalPath, 'utf-8');
        } catch {
          // Fallback to default critical CSS
          this.criticalCSS = CRITICAL_CSS;
        }
      } else {
        this.criticalCSS = CRITICAL_CSS;
      }
      this.loaded = true;
    } catch (error) {
      console.warn('Failed to load critical CSS:', error);
      this.criticalCSS = CRITICAL_CSS;
      this.loaded = true;
    }
  }

  /**
   * Generate critical CSS tag for inlining
   */
  public generateCriticalCSSTag(): string {
    const css = this.getCriticalCSS();
    
    if (!CRITICAL_CSS_CONFIG.inline || css.length > CRITICAL_CSS_CONFIG.threshold) {
      return '';
    }

    return `<style data-critical>${css}</style>`;
  }

  /**
   * Check if CSS should be inlined based on size
   */
  public shouldInline(cssContent: string): boolean {
    return (
      CRITICAL_CSS_CONFIG.inline &&
      cssContent.length <= CRITICAL_CSS_CONFIG.threshold
    );
  }

  /**
   * Minify CSS for production
   */
  public minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Compress whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .replace(/:\s+/g, ':') // Remove spaces after colons
      .replace(/,\s+/g, ',') // Remove spaces after commas
      .trim();
  }

  /**
   * Extract above-the-fold CSS for mobile
   */
  public extractAboveTheFoldCSS(htmlContent: string): string {
    // Simple extraction based on common above-the-fold selectors
    const aboveTheFoldSelectors = [
      'header',
      'nav',
      '.hero',
      '.banner',
      '.above-fold',
      'h1',
      'h2',
      '.btn-primary',
      '.loading',
    ];

    let extractedCSS = CRITICAL_CSS;

    // Add component-specific critical CSS
    if (htmlContent.includes('nav')) {
      extractedCSS += `
        .nav-item {
          padding: 0.75rem 1rem;
          font-weight: 500;
        }
      `;
    }

    if (htmlContent.includes('hero')) {
      extractedCSS += `
        .hero {
          padding: 2rem 0;
          text-align: center;
        }
      `;
    }

    return this.minifyCSS(extractedCSS);
  }
}

// Export singleton instance
export const criticalCSS = CriticalCSSManager.getInstance();

// Utility functions for performance optimization
export const performanceUtils = {
  /**
   * Preload critical resources
   */
  preloadCriticalResources(): string {
    return `
      <link rel="preload" href="/_next/static/css/critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
      <link rel="dns-prefetch" href="//fonts.googleapis.com">
      <link rel="preconnect" href="//fonts.gstatic.com" crossorigin>
    `;
  },

  /**
   * Generate resource hints for mobile performance
   */
  generateResourceHints(): string {
    return `
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <meta name="format-detection" content="telephone=no">
      <meta name="mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="default">
    `;
  },

  /**
   * Defer non-critical CSS loading
   */
  deferNonCriticalCSS(cssFiles: string[]): string {
    return cssFiles
      .map(
        (file) => `
        <link rel="preload" href="${file}" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="${file}"></noscript>
      `
      )
      .join('');
  },
}; 