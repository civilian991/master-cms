/**
 * Mobile-First Responsive Framework Service
 * Implements breakpoint system, layout management, and responsive utilities
 */

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  displayName: string;
}

export interface TypographyScale {
  mobile: {
    base: string;
    sm: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  tablet: {
    base: string;
    sm: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  desktop: {
    base: string;
    sm: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
}

export interface SpacingScale {
  mobile: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  tablet: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  desktop: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
}

export interface LayoutVariant {
  name: string;
  breakpoint: string;
  columns: number;
  gaps: {
    x: string;
    y: string;
  };
  padding: {
    x: string;
    y: string;
  };
  maxWidth?: string;
}

export interface ResponsiveImageConfig {
  breakpoints: Record<string, number>;
  formats: string[];
  qualities: Record<string, number>;
  loadingStrategy: 'lazy' | 'eager';
  placeholderStrategy: 'blur' | 'empty' | 'gradient';
}

export class ResponsiveFrameworkService {
  private static instance: ResponsiveFrameworkService;
  
  // Mobile-first breakpoint system
  public readonly breakpoints: ResponsiveBreakpoint[] = [
    {
      name: 'mobile',
      minWidth: 320,
      maxWidth: 479,
      displayName: 'Mobile'
    },
    {
      name: 'mobile-lg',
      minWidth: 480,
      maxWidth: 767,
      displayName: 'Large Mobile'
    },
    {
      name: 'tablet',
      minWidth: 768,
      maxWidth: 1023,
      displayName: 'Tablet'
    },
    {
      name: 'desktop',
      minWidth: 1024,
      maxWidth: 1279,
      displayName: 'Desktop'
    },
    {
      name: 'desktop-lg',
      minWidth: 1280,
      displayName: 'Large Desktop'
    }
  ];

  // Mobile-optimized typography scale
  public readonly typography: TypographyScale = {
    mobile: {
      base: '0.875rem', // 14px
      sm: '0.75rem',    // 12px
      lg: '1rem',       // 16px
      xl: '1.125rem',   // 18px
      '2xl': '1.25rem', // 20px
      '3xl': '1.5rem',  // 24px
      '4xl': '1.75rem'  // 28px
    },
    tablet: {
      base: '1rem',     // 16px
      sm: '0.875rem',   // 14px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'  // 36px
    },
    desktop: {
      base: '1rem',     // 16px
      sm: '0.875rem',   // 14px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2.25rem', // 36px
      '4xl': '3rem'     // 48px
    }
  };

  // Mobile-optimized spacing scale
  public readonly spacing: SpacingScale = {
    mobile: {
      xs: '0.25rem',  // 4px
      sm: '0.5rem',   // 8px
      md: '0.75rem',  // 12px
      lg: '1rem',     // 16px
      xl: '1.25rem',  // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem',  // 32px
      '4xl': '2.5rem' // 40px
    },
    tablet: {
      xs: '0.5rem',   // 8px
      sm: '0.75rem',  // 12px
      md: '1rem',     // 16px
      lg: '1.5rem',   // 24px
      xl: '2rem',     // 32px
      '2xl': '2.5rem', // 40px
      '3xl': '3rem',  // 48px
      '4xl': '4rem'   // 64px
    },
    desktop: {
      xs: '0.5rem',   // 8px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
      '2xl': '4rem',  // 64px
      '3xl': '6rem',  // 96px
      '4xl': '8rem'   // 128px
    }
  };

  // Layout variants for different content types
  public readonly layoutVariants: Record<string, LayoutVariant[]> = {
    article: [
      {
        name: 'mobile-single',
        breakpoint: 'mobile',
        columns: 1,
        gaps: { x: '0', y: '1rem' },
        padding: { x: '1rem', y: '0.75rem' },
        maxWidth: '100%'
      },
      {
        name: 'tablet-single',
        breakpoint: 'tablet',
        columns: 1,
        gaps: { x: '0', y: '1.5rem' },
        padding: { x: '2rem', y: '1rem' },
        maxWidth: '48rem'
      },
      {
        name: 'desktop-single',
        breakpoint: 'desktop',
        columns: 1,
        gaps: { x: '0', y: '2rem' },
        padding: { x: '3rem', y: '1.5rem' },
        maxWidth: '56rem'
      }
    ],
    grid: [
      {
        name: 'mobile-single',
        breakpoint: 'mobile',
        columns: 1,
        gaps: { x: '0.75rem', y: '1rem' },
        padding: { x: '1rem', y: '0.75rem' }
      },
      {
        name: 'mobile-lg-double',
        breakpoint: 'mobile-lg',
        columns: 2,
        gaps: { x: '1rem', y: '1.25rem' },
        padding: { x: '1rem', y: '1rem' }
      },
      {
        name: 'tablet-triple',
        breakpoint: 'tablet',
        columns: 3,
        gaps: { x: '1.5rem', y: '1.5rem' },
        padding: { x: '2rem', y: '1.5rem' }
      },
      {
        name: 'desktop-quad',
        breakpoint: 'desktop',
        columns: 4,
        gaps: { x: '2rem', y: '2rem' },
        padding: { x: '3rem', y: '2rem' }
      }
    ],
    dashboard: [
      {
        name: 'mobile-stack',
        breakpoint: 'mobile',
        columns: 1,
        gaps: { x: '0', y: '1rem' },
        padding: { x: '1rem', y: '1rem' }
      },
      {
        name: 'tablet-sidebar',
        breakpoint: 'tablet',
        columns: 2,
        gaps: { x: '2rem', y: '1.5rem' },
        padding: { x: '2rem', y: '1.5rem' }
      },
      {
        name: 'desktop-three-col',
        breakpoint: 'desktop',
        columns: 3,
        gaps: { x: '2rem', y: '2rem' },
        padding: { x: '3rem', y: '2rem' }
      }
    ]
  };

  // Responsive image configuration
  public readonly imageConfig: ResponsiveImageConfig = {
    breakpoints: {
      mobile: 320,
      'mobile-lg': 480,
      tablet: 768,
      desktop: 1024,
      'desktop-lg': 1280,
      'desktop-xl': 1920
    },
    formats: ['webp', 'avif', 'jpg'],
    qualities: {
      mobile: 75,
      tablet: 80,
      desktop: 85
    },
    loadingStrategy: 'lazy',
    placeholderStrategy: 'blur'
  };

  public static getInstance(): ResponsiveFrameworkService {
    if (!ResponsiveFrameworkService.instance) {
      ResponsiveFrameworkService.instance = new ResponsiveFrameworkService();
    }
    return ResponsiveFrameworkService.instance;
  }

  /**
   * Get current breakpoint based on viewport width
   */
  public getCurrentBreakpoint(width: number): ResponsiveBreakpoint {
    for (const breakpoint of this.breakpoints) {
      if (width >= breakpoint.minWidth && 
          (!breakpoint.maxWidth || width <= breakpoint.maxWidth)) {
        return breakpoint;
      }
    }
    return this.breakpoints[this.breakpoints.length - 1]; // Default to largest
  }

  /**
   * Generate responsive CSS classes for a given element
   */
  public generateResponsiveClasses(
    baseClasses: string,
    variants: Record<string, string>
  ): string {
    const classes = [baseClasses];
    
    Object.entries(variants).forEach(([breakpoint, breakpointClasses]) => {
      const bp = this.breakpoints.find(b => b.name === breakpoint);
      if (bp) {
        const prefix = this.getBreakpointPrefix(breakpoint);
        classes.push(`${prefix}:${breakpointClasses}`);
      }
    });

    return classes.join(' ');
  }

  /**
   * Get Tailwind breakpoint prefix
   */
  private getBreakpointPrefix(breakpoint: string): string {
    const prefixMap: Record<string, string> = {
      'mobile': '',
      'mobile-lg': 'sm',
      'tablet': 'md',
      'desktop': 'lg',
      'desktop-lg': 'xl'
    };
    return prefixMap[breakpoint] || '';
  }

  /**
   * Generate layout classes for specific content type and breakpoint
   */
  public getLayoutClasses(
    contentType: string,
    breakpoint: string
  ): string {
    const variants = this.layoutVariants[contentType];
    if (!variants) return '';

    const variant = variants.find(v => v.breakpoint === breakpoint);
    if (!variant) return '';

    const classes = [];
    
    // Grid columns
    if (variant.columns > 1) {
      classes.push(`grid-cols-${variant.columns}`);
    }
    
    // Gaps
    classes.push(`gap-x-[${variant.gaps.x}]`);
    classes.push(`gap-y-[${variant.gaps.y}]`);
    
    // Padding
    classes.push(`px-[${variant.padding.x}]`);
    classes.push(`py-[${variant.padding.y}]`);
    
    // Max width
    if (variant.maxWidth) {
      classes.push(`max-w-[${variant.maxWidth}]`);
    }

    return classes.join(' ');
  }

  /**
   * Generate typography classes for breakpoint
   */
  public getTypographyClasses(
    size: keyof TypographyScale['mobile'],
    breakpoint?: string
  ): string {
    if (breakpoint) {
      const typography = this.typography[breakpoint as keyof TypographyScale];
      return `text-[${typography?.[size]}]`;
    }

    // Generate responsive typography
    const classes = [];
    classes.push(`text-[${this.typography.mobile[size]}]`); // Mobile first
    classes.push(`md:text-[${this.typography.tablet[size]}]`); // Tablet
    classes.push(`lg:text-[${this.typography.desktop[size]}]`); // Desktop

    return classes.join(' ');
  }

  /**
   * Generate spacing classes for breakpoint
   */
  public getSpacingClasses(
    property: 'p' | 'm' | 'px' | 'py' | 'mx' | 'my',
    size: keyof SpacingScale['mobile'],
    breakpoint?: string
  ): string {
    if (breakpoint) {
      const spacing = this.spacing[breakpoint as keyof SpacingScale];
      return `${property}-[${spacing?.[size]}]`;
    }

    // Generate responsive spacing
    const classes = [];
    classes.push(`${property}-[${this.spacing.mobile[size]}]`); // Mobile first
    classes.push(`md:${property}-[${this.spacing.tablet[size]}]`); // Tablet
    classes.push(`lg:${property}-[${this.spacing.desktop[size]}]`); // Desktop

    return classes.join(' ');
  }

  /**
   * Generate responsive image attributes
   */
  public generateResponsiveImageProps(
    src: string,
    alt: string,
    priority: boolean = false
  ): {
    src: string;
    alt: string;
    sizes: string;
    loading: 'lazy' | 'eager';
    quality: number;
    formats: string[];
  } {
    const sizes = Object.entries(this.imageConfig.breakpoints)
      .map(([name, width]) => {
        const bp = this.breakpoints.find(b => b.name === name);
        if (bp?.maxWidth) {
          return `(max-width: ${bp.maxWidth}px) ${width}px`;
        }
        return `${width}px`;
      })
      .join(', ');

    return {
      src,
      alt,
      sizes,
      loading: priority ? 'eager' : this.imageConfig.loadingStrategy,
      quality: this.imageConfig.qualities.mobile,
      formats: this.imageConfig.formats
    };
  }

  /**
   * Check if device is mobile based on user agent or screen size
   */
  public isMobileDevice(
    userAgent?: string,
    screenWidth?: number
  ): boolean {
    if (screenWidth !== undefined) {
      return screenWidth < 768; // Tablet breakpoint
    }

    if (userAgent) {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      return mobileRegex.test(userAgent);
    }

    // Fallback to window check if available
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }

    return false;
  }

  /**
   * Get optimal image quality for current connection
   */
  public getOptimalImageQuality(
    connectionType?: string,
    effectiveType?: string
  ): number {
    if (connectionType === '2g' || effectiveType === 'slow-2g') {
      return 60;
    }
    if (connectionType === '3g' || effectiveType === '3g') {
      return 70;
    }
    if (connectionType === '4g' || effectiveType === '4g') {
      return 85;
    }
    return 80; // Default quality
  }

  /**
   * Generate CSS custom properties for current theme
   */
  public generateThemeVariables(breakpoint: string): Record<string, string> {
    const typography = this.typography[breakpoint as keyof TypographyScale];
    const spacing = this.spacing[breakpoint as keyof SpacingScale];
    
    const variables: Record<string, string> = {};
    
    // Typography variables
    Object.entries(typography || this.typography.mobile).forEach(([key, value]) => {
      variables[`--font-size-${key}`] = value;
    });
    
    // Spacing variables
    Object.entries(spacing || this.spacing.mobile).forEach(([key, value]) => {
      variables[`--spacing-${key}`] = value;
    });
    
    return variables;
  }

  /**
   * Apply responsive theme variables to document
   */
  public applyResponsiveTheme(): (() => void) | void {
    if (typeof window === 'undefined') return;

    const updateTheme = () => {
      const width = window.innerWidth;
      const breakpoint = this.getCurrentBreakpoint(width);
      const variables = this.generateThemeVariables(breakpoint.name);
      
      Object.entries(variables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    };

    // Apply immediately
    updateTheme();

    // Listen for resize events
    window.addEventListener('resize', updateTheme);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', updateTheme);
    };
  }

  /**
   * Get container classes for responsive layouts
   */
  public getContainerClasses(
    variant: 'full' | 'contained' | 'narrow' = 'contained'
  ): string {
    const baseClasses = 'mx-auto px-4';
    
    switch (variant) {
      case 'full':
        return 'w-full';
      case 'narrow':
        return `${baseClasses} max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl`;
      case 'contained':
      default:
        return `${baseClasses} max-w-7xl sm:px-6 lg:px-8`;
    }
  }
}

// Export singleton instance
export const responsiveFramework = ResponsiveFrameworkService.getInstance(); 