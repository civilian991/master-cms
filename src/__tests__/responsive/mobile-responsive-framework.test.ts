/**
 * Mobile-First Responsive Framework Tests
 */

import { responsiveFramework, ResponsiveFrameworkService } from '@/lib/services/responsive-framework';

// Mock window object for testing
const mockWindow = {
  innerWidth: 320,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 320,
});

describe('ResponsiveFrameworkService', () => {
  let service: ResponsiveFrameworkService;

  beforeEach(() => {
    service = ResponsiveFrameworkService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ResponsiveFrameworkService.getInstance();
      const instance2 = ResponsiveFrameworkService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export the singleton instance', () => {
      expect(responsiveFramework).toBeInstanceOf(ResponsiveFrameworkService);
    });
  });

  describe('Breakpoint System', () => {
    it('should have correct mobile-first breakpoints', () => {
      const breakpoints = service.breakpoints;
      
      expect(breakpoints).toHaveLength(5);
      expect(breakpoints[0]).toEqual({
        name: 'mobile',
        minWidth: 320,
        maxWidth: 479,
        displayName: 'Mobile'
      });
      expect(breakpoints[1]).toEqual({
        name: 'mobile-lg',
        minWidth: 480,
        maxWidth: 767,
        displayName: 'Large Mobile'
      });
      expect(breakpoints[2]).toEqual({
        name: 'tablet',
        minWidth: 768,
        maxWidth: 1023,
        displayName: 'Tablet'
      });
    });

    it('should get correct breakpoint for mobile width', () => {
      const breakpoint = service.getCurrentBreakpoint(375);
      expect(breakpoint.name).toBe('mobile');
      expect(breakpoint.displayName).toBe('Mobile');
    });

    it('should get correct breakpoint for tablet width', () => {
      const breakpoint = service.getCurrentBreakpoint(768);
      expect(breakpoint.name).toBe('tablet');
      expect(breakpoint.displayName).toBe('Tablet');
    });

    it('should get correct breakpoint for desktop width', () => {
      const breakpoint = service.getCurrentBreakpoint(1200);
      expect(breakpoint.name).toBe('desktop');
      expect(breakpoint.displayName).toBe('Desktop');
    });

    it('should default to largest breakpoint for very wide screens', () => {
      const breakpoint = service.getCurrentBreakpoint(2000);
      expect(breakpoint.name).toBe('desktop-lg');
    });
  });

  describe('Typography Scale', () => {
    it('should have mobile-optimized typography', () => {
      const typography = service.typography.mobile;
      
      expect(typography.base).toBe('0.875rem'); // 14px
      expect(typography.lg).toBe('1rem'); // 16px
      expect(typography['2xl']).toBe('1.25rem'); // 20px
    });

    it('should have larger typography for desktop', () => {
      const desktop = service.typography.desktop;
      const mobile = service.typography.mobile;
      
      expect(desktop['4xl']).toBe('3rem'); // 48px
      expect(mobile['4xl']).toBe('1.75rem'); // 28px
      expect(desktop['4xl'] > mobile['4xl']).toBe(true);
    });

    it('should generate responsive typography classes', () => {
      const classes = service.getTypographyClasses('lg');
      
      expect(classes).toContain('text-[1rem]'); // Mobile
      expect(classes).toContain('md:text-[1.125rem]'); // Tablet
      expect(classes).toContain('lg:text-[1.125rem]'); // Desktop
    });

    it('should generate single breakpoint typography classes', () => {
      const classes = service.getTypographyClasses('xl', 'mobile');
      expect(classes).toBe('text-[1.125rem]');
    });
  });

  describe('Spacing Scale', () => {
    it('should have mobile-optimized spacing', () => {
      const spacing = service.spacing.mobile;
      
      expect(spacing.xs).toBe('0.25rem'); // 4px
      expect(spacing.sm).toBe('0.5rem'); // 8px
      expect(spacing.lg).toBe('1rem'); // 16px
    });

    it('should have larger spacing for desktop', () => {
      const desktop = service.spacing.desktop;
      const mobile = service.spacing.mobile;
      
      expect(desktop['4xl']).toBe('8rem'); // 128px
      expect(mobile['4xl']).toBe('2.5rem'); // 40px
    });

    it('should generate responsive spacing classes', () => {
      const classes = service.getSpacingClasses('p', 'lg');
      
      expect(classes).toContain('p-[1rem]'); // Mobile
      expect(classes).toContain('md:p-[1.5rem]'); // Tablet
      expect(classes).toContain('lg:p-[2rem]'); // Desktop
    });

    it('should generate single breakpoint spacing classes', () => {
      const classes = service.getSpacingClasses('m', 'xl', 'tablet');
      expect(classes).toBe('m-[2rem]');
    });
  });

  describe('Layout Variants', () => {
    it('should have article layout variants', () => {
      const articleLayouts = service.layoutVariants.article;
      
      expect(articleLayouts).toHaveLength(3);
      expect(articleLayouts[0].name).toBe('mobile-single');
      expect(articleLayouts[0].columns).toBe(1);
      expect(articleLayouts[0].padding.x).toBe('1rem');
    });

    it('should have grid layout variants', () => {
      const gridLayouts = service.layoutVariants.grid;
      
      expect(gridLayouts).toHaveLength(4);
      expect(gridLayouts[0].name).toBe('mobile-single');
      expect(gridLayouts[1].name).toBe('mobile-lg-double');
      expect(gridLayouts[2].name).toBe('tablet-triple');
      expect(gridLayouts[3].name).toBe('desktop-quad');
    });

    it('should generate layout classes for content type', () => {
      const classes = service.getLayoutClasses('grid', 'mobile');
      
      expect(classes).toContain('gap-x-[0.75rem]');
      expect(classes).toContain('gap-y-[1rem]');
      expect(classes).toContain('px-[1rem]');
      expect(classes).toContain('py-[0.75rem]');
    });

    it('should return empty string for invalid content type', () => {
      const classes = service.getLayoutClasses('invalid', 'mobile');
      expect(classes).toBe('');
    });
  });

  describe('Responsive Classes Generation', () => {
    it('should generate responsive classes with variants', () => {
      const classes = service.generateResponsiveClasses('flex', {
        'mobile': 'flex-col',
        'tablet': 'flex-row',
        'desktop': 'flex-row'
      });
      
      expect(classes).toContain('flex');
      expect(classes).toContain('flex-col');
      expect(classes).toContain('md:flex-row');
      expect(classes).toContain('lg:flex-row');
    });

    it('should handle empty variants', () => {
      const classes = service.generateResponsiveClasses('grid', {});
      expect(classes).toBe('grid');
    });
  });

  describe('Responsive Image Configuration', () => {
    it('should have correct image breakpoints', () => {
      const config = service.imageConfig;
      
      expect(config.breakpoints.mobile).toBe(320);
      expect(config.breakpoints.tablet).toBe(768);
      expect(config.breakpoints.desktop).toBe(1024);
    });

    it('should generate responsive image props', () => {
      const props = service.generateResponsiveImageProps('/test.jpg', 'Test image');
      
      expect(props.src).toBe('/test.jpg');
      expect(props.alt).toBe('Test image');
      expect(props.loading).toBe('lazy');
      expect(props.quality).toBe(75); // Mobile quality
      expect(props.formats).toEqual(['webp', 'avif', 'jpg']);
      expect(props.sizes).toContain('320px');
    });

    it('should handle priority images', () => {
      const props = service.generateResponsiveImageProps('/hero.jpg', 'Hero', true);
      expect(props.loading).toBe('eager');
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile based on screen width', () => {
      expect(service.isMobileDevice(undefined, 375)).toBe(true);
      expect(service.isMobileDevice(undefined, 768)).toBe(false);
      expect(service.isMobileDevice(undefined, 1024)).toBe(false);
    });

    it('should detect mobile based on user agent', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      expect(service.isMobileDevice(mobileUA)).toBe(true);
      expect(service.isMobileDevice(desktopUA)).toBe(false);
    });

    it('should fallback to window width when available', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      expect(service.isMobileDevice()).toBe(true);
      
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      expect(service.isMobileDevice()).toBe(false);
    });
  });

  describe('Image Quality Optimization', () => {
    it('should return low quality for 2G connections', () => {
      expect(service.getOptimalImageQuality('2g')).toBe(60);
      expect(service.getOptimalImageQuality(undefined, 'slow-2g')).toBe(60);
    });

    it('should return medium quality for 3G connections', () => {
      expect(service.getOptimalImageQuality('3g')).toBe(70);
      expect(service.getOptimalImageQuality(undefined, '3g')).toBe(70);
    });

    it('should return high quality for 4G connections', () => {
      expect(service.getOptimalImageQuality('4g')).toBe(85);
      expect(service.getOptimalImageQuality(undefined, '4g')).toBe(85);
    });

    it('should return default quality for unknown connections', () => {
      expect(service.getOptimalImageQuality()).toBe(80);
      expect(service.getOptimalImageQuality('unknown')).toBe(80);
    });
  });

  describe('Theme Variables Generation', () => {
    it('should generate typography variables', () => {
      const variables = service.generateThemeVariables('mobile');
      
      expect(variables['--font-size-base']).toBe('0.875rem');
      expect(variables['--font-size-lg']).toBe('1rem');
      expect(variables['--font-size-2xl']).toBe('1.25rem');
    });

    it('should generate spacing variables', () => {
      const variables = service.generateThemeVariables('mobile');
      
      expect(variables['--spacing-xs']).toBe('0.25rem');
      expect(variables['--spacing-sm']).toBe('0.5rem');
      expect(variables['--spacing-lg']).toBe('1rem');
    });

    it('should handle different breakpoints', () => {
      const mobileVars = service.generateThemeVariables('mobile');
      const desktopVars = service.generateThemeVariables('desktop');
      
      expect(mobileVars['--font-size-4xl']).toBe('1.75rem');
      expect(desktopVars['--font-size-4xl']).toBe('3rem');
    });
  });

  describe('Container Classes', () => {
    it('should generate full width container classes', () => {
      const classes = service.getContainerClasses('full');
      expect(classes).toBe('w-full');
    });

    it('should generate contained container classes', () => {
      const classes = service.getContainerClasses('contained');
      expect(classes).toContain('mx-auto');
      expect(classes).toContain('px-4');
      expect(classes).toContain('max-w-7xl');
      expect(classes).toContain('sm:px-6');
      expect(classes).toContain('lg:px-8');
    });

    it('should generate narrow container classes', () => {
      const classes = service.getContainerClasses('narrow');
      expect(classes).toContain('mx-auto');
      expect(classes).toContain('px-4');
      expect(classes).toContain('max-w-2xl');
      expect(classes).toContain('sm:max-w-3xl');
      expect(classes).toContain('md:max-w-4xl');
      expect(classes).toContain('lg:max-w-5xl');
    });

    it('should default to contained variant', () => {
      const defaultClasses = service.getContainerClasses();
      const containedClasses = service.getContainerClasses('contained');
      expect(defaultClasses).toBe(containedClasses);
    });
  });

  describe('Responsive Theme Application', () => {
    beforeEach(() => {
      // Mock document.documentElement.style.setProperty
      document.documentElement.style.setProperty = jest.fn();
      
      // Mock window properties
      Object.defineProperty(window, 'addEventListener', {
        value: jest.fn(),
        writable: true
      });
      Object.defineProperty(window, 'removeEventListener', {
        value: jest.fn(),
        writable: true
      });
    });

    it('should apply responsive theme variables', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      const cleanup = service.applyResponsiveTheme();
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--font-size-base',
        '0.875rem'
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--spacing-lg',
        '1rem'
      );
      
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      
      if (cleanup) {
        cleanup();
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      }
    });

    it('should handle server-side rendering', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      const result = service.applyResponsiveTheme();
      expect(result).toBeUndefined();
      
      global.window = originalWindow;
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing typography for unknown breakpoint', () => {
      const classes = service.getTypographyClasses('base', 'unknown');
      expect(classes).toBe('text-[undefined]');
    });

    it('should handle missing spacing for unknown breakpoint', () => {
      const classes = service.getSpacingClasses('p', 'lg', 'unknown');
      expect(classes).toBe('p-[undefined]');
    });

    it('should handle missing layout variant', () => {
      const classes = service.getLayoutClasses('grid', 'unknown');
      expect(classes).toBe('');
    });

    it('should handle zero width breakpoint detection', () => {
      const breakpoint = service.getCurrentBreakpoint(0);
      expect(breakpoint.name).toBe('desktop-lg'); // Falls back to largest
    });
  });

  describe('Integration Tests', () => {
    it('should provide consistent mobile-first approach', () => {
      // Test that mobile styles are always the base (no prefix)
      const typographyClasses = service.getTypographyClasses('lg');
      const spacingClasses = service.getSpacingClasses('p', 'md');
      
      // Mobile styles should come first without prefixes
      expect(typographyClasses.split(' ')[0]).toMatch(/^text-\[/);
      expect(spacingClasses.split(' ')[0]).toMatch(/^p-\[/);
      
      // Tablet and desktop should have prefixes
      expect(typographyClasses).toContain('md:');
      expect(typographyClasses).toContain('lg:');
      expect(spacingClasses).toContain('md:');
      expect(spacingClasses).toContain('lg:');
    });

    it('should maintain consistent breakpoint naming', () => {
      const breakpoints = service.breakpoints;
      const layoutVariants = service.layoutVariants.grid;
      
      // Ensure layout variants reference valid breakpoints
      layoutVariants.forEach(variant => {
        const matchingBreakpoint = breakpoints.find(bp => bp.name === variant.breakpoint);
        expect(matchingBreakpoint).toBeDefined();
      });
    });

    it('should provide mobile-optimized defaults', () => {
      // Typography should be smaller on mobile
      expect(service.typography.mobile.base).toBe('0.875rem');
      expect(service.typography.desktop.base).toBe('1rem');
      
      // Spacing should be tighter on mobile
      expect(service.spacing.mobile.lg).toBe('1rem');
      expect(service.spacing.desktop.lg).toBe('2rem');
      
      // Images should use lower quality on mobile
      expect(service.imageConfig.qualities.mobile).toBe(75);
      expect(service.imageConfig.qualities.desktop).toBe(85);
    });
  });
});

describe('Responsive Framework Performance', () => {
  it('should be efficient with class generation', () => {
    const service = ResponsiveFrameworkService.getInstance();
    const startTime = performance.now();
    
    // Generate multiple class combinations
    for (let i = 0; i < 1000; i++) {
      service.getTypographyClasses('base');
      service.getSpacingClasses('p', 'lg');
      service.getLayoutClasses('grid', 'mobile');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete 1000 operations in under 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should efficiently handle breakpoint detection', () => {
    const service = ResponsiveFrameworkService.getInstance();
    const startTime = performance.now();
    
    // Test multiple widths
    const widths = [320, 375, 414, 768, 1024, 1280, 1920];
    
    for (let i = 0; i < 1000; i++) {
      widths.forEach(width => {
        service.getCurrentBreakpoint(width);
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete 7000 operations in under 50ms
    expect(duration).toBeLessThan(50);
  });
}); 