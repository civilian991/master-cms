/**
 * Responsive Layout Components
 * Mobile-first responsive layout system with breakpoint-aware containers and grids
 */

'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { responsiveFramework } from '@/lib/services/responsive-framework';

// Container Component
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'contained' | 'narrow';
  responsive?: boolean;
  centerContent?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'contained', responsive = true, centerContent = false, children, ...props }, ref) => {
    const [containerClasses, setContainerClasses] = useState('');

    useEffect(() => {
      if (responsive) {
        const classes = responsiveFramework.getContainerClasses(variant);
        setContainerClasses(classes);
      }
    }, [variant, responsive]);

    return (
      <div
        ref={ref}
        className={cn(
          containerClasses,
          centerContent && 'flex items-center justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = 'Container';

// Responsive Grid Component
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  contentType?: 'article' | 'grid' | 'dashboard';
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gaps?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ 
    className, 
    contentType = 'grid', 
    columns = { mobile: 1, tablet: 2, desktop: 3 }, 
    gaps = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
    padding = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
    children, 
    ...props 
  }, ref) => {
    const [gridClasses, setGridClasses] = useState('');

    useEffect(() => {
      const baseClasses = 'grid';
      const variants = {
        'mobile': `grid-cols-${columns.mobile} gap-[${gaps.mobile}] p-[${padding.mobile}]`,
        'tablet': `md:grid-cols-${columns.tablet} md:gap-[${gaps.tablet}] md:p-[${padding.tablet}]`,
        'desktop': `lg:grid-cols-${columns.desktop} lg:gap-[${gaps.desktop}] lg:p-[${padding.desktop}]`
      };

      const classes = responsiveFramework.generateResponsiveClasses(baseClasses, {
        'mobile-lg': variants.mobile,
        'tablet': variants.tablet,
        'desktop': variants.desktop
      });

      setGridClasses(classes);
    }, [contentType, columns, gaps, padding]);

    return (
      <div
        ref={ref}
        className={cn(gridClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ResponsiveGrid.displayName = 'ResponsiveGrid';

// Section Component with responsive padding
interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'tight' | 'normal' | 'spacious';
  paddingY?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ 
    className, 
    variant = 'normal',
    paddingY,
    children, 
    ...props 
  }, ref) => {
    const [sectionClasses, setSectionClasses] = useState('');

    useEffect(() => {
      let defaultPadding;
      
      switch (variant) {
        case 'tight':
          defaultPadding = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' };
          break;
        case 'spacious':
          defaultPadding = { mobile: '2rem', tablet: '3rem', desktop: '4rem' };
          break;
        default:
          defaultPadding = { mobile: '1.5rem', tablet: '2rem', desktop: '3rem' };
      }

      const finalPadding = { ...defaultPadding, ...paddingY };
      
      const classes = responsiveFramework.generateResponsiveClasses('', {
        'mobile': `py-[${finalPadding.mobile}]`,
        'tablet': `md:py-[${finalPadding.tablet}]`,
        'desktop': `lg:py-[${finalPadding.desktop}]`
      });

      setSectionClasses(classes);
    }, [variant, paddingY]);

    return (
      <section
        ref={ref}
        className={cn(sectionClasses, className)}
        {...props}
      >
        {children}
      </section>
    );
  }
);
Section.displayName = 'Section';

// Responsive Typography Component
interface ResponsiveTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  responsive?: boolean;
}

export const ResponsiveText = forwardRef<any, ResponsiveTextProps>(
  ({ 
    className, 
    as: Component = 'p', 
    size = 'base',
    weight = 'normal',
    responsive = true,
    children, 
    ...props 
  }, ref) => {
    const [textClasses, setTextClasses] = useState('');

    useEffect(() => {
      if (responsive) {
        const typographyClasses = responsiveFramework.getTypographyClasses(size);
        const weightClass = `font-${weight}`;
        setTextClasses(`${typographyClasses} ${weightClass}`);
      } else {
        setTextClasses(`text-${size} font-${weight}`);
      }
    }, [size, weight, responsive]);

    return (
      <Component
        ref={ref}
        className={cn(textClasses, className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
ResponsiveText.displayName = 'ResponsiveText';

// Responsive Image Component
interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  placeholder?: 'blur' | 'empty';
}

export const ResponsiveImage = forwardRef<HTMLImageElement, ResponsiveImageProps>(
  ({ 
    className, 
    src, 
    alt, 
    priority = false,
    aspectRatio,
    objectFit = 'cover',
    placeholder = 'blur',
    ...props 
  }, ref) => {
    const [imageProps, setImageProps] = useState<any>({});

    useEffect(() => {
      const props = responsiveFramework.generateResponsiveImageProps(src, alt, priority);
      setImageProps(props);
    }, [src, alt, priority]);

    const aspectRatioClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-[4/3]'
    };

    return (
      <img
        ref={ref}
        className={cn(
          'w-full h-auto',
          aspectRatio && aspectRatioClasses[aspectRatio],
          `object-${objectFit}`,
          className
        )}
        src={imageProps.src}
        alt={imageProps.alt}
        sizes={imageProps.sizes}
        loading={imageProps.loading}
        {...props}
      />
    );
  }
);
ResponsiveImage.displayName = 'ResponsiveImage';

// Responsive Flexbox Component
interface FlexBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: {
    mobile?: 'row' | 'col';
    tablet?: 'row' | 'col';
    desktop?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export const FlexBox = forwardRef<HTMLDivElement, FlexBoxProps>(
  ({ 
    className, 
    direction = { mobile: 'col', tablet: 'row', desktop: 'row' },
    align = 'start',
    justify = 'start',
    wrap = false,
    gap = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
    children, 
    ...props 
  }, ref) => {
    const [flexClasses, setFlexClasses] = useState('');

    useEffect(() => {
      const baseClasses = `flex items-${align} justify-${justify}${wrap ? ' flex-wrap' : ''}`;
      
      const variants = {
        'mobile': `flex-${direction.mobile} gap-[${gap.mobile}]`,
        'tablet': `md:flex-${direction.tablet} md:gap-[${gap.tablet}]`,
        'desktop': `lg:flex-${direction.desktop} lg:gap-[${gap.desktop}]`
      };

      const classes = responsiveFramework.generateResponsiveClasses(baseClasses, variants);
      setFlexClasses(classes);
    }, [direction, align, justify, wrap, gap]);

    return (
      <div
        ref={ref}
        className={cn(flexClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FlexBox.displayName = 'FlexBox';

// Mobile-First Stack Component (for consistent vertical layouts)
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  divider?: React.ReactNode;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ 
    className, 
    spacing = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
    align = 'stretch',
    divider,
    children, 
    ...props 
  }, ref) => {
    const [stackClasses, setStackClasses] = useState('');

    useEffect(() => {
      const baseClasses = `flex flex-col items-${align}`;
      
      const variants = {
        'mobile': `gap-[${spacing.mobile}]`,
        'tablet': `md:gap-[${spacing.tablet}]`,
        'desktop': `lg:gap-[${spacing.desktop}]`
      };

      const classes = responsiveFramework.generateResponsiveClasses(baseClasses, variants);
      setStackClasses(classes);
    }, [spacing, align]);

    const childrenArray = React.Children.toArray(children);

    return (
      <div
        ref={ref}
        className={cn(stackClasses, className)}
        {...props}
      >
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {divider && index < childrenArray.length - 1 && divider}
          </React.Fragment>
        ))}
      </div>
    );
  }
);
Stack.displayName = 'Stack';

// Responsive Show/Hide Components
interface ShowProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  children: React.ReactNode;
}

export const ShowFrom: React.FC<ShowProps> = ({ breakpoint, children }) => {
  const breakpointClasses = {
    mobile: 'block',
    tablet: 'hidden md:block',
    desktop: 'hidden lg:block'
  };

  return (
    <div className={breakpointClasses[breakpoint]}>
      {children}
    </div>
  );
};

export const ShowOnly: React.FC<ShowProps> = ({ breakpoint, children }) => {
  const breakpointClasses = {
    mobile: 'block md:hidden',
    tablet: 'hidden md:block lg:hidden',
    desktop: 'hidden lg:block'
  };

  return (
    <div className={breakpointClasses[breakpoint]}>
      {children}
    </div>
  );
};

export const HideFrom: React.FC<ShowProps> = ({ breakpoint, children }) => {
  const breakpointClasses = {
    mobile: 'hidden',
    tablet: 'block md:hidden',
    desktop: 'block lg:hidden'
  };

  return (
    <div className={breakpointClasses[breakpoint]}>
      {children}
    </div>
  );
};

// Responsive Card Grid for content
interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minCardWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  maxColumns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(
  ({ 
    className, 
    minCardWidth = { mobile: '280px', tablet: '320px', desktop: '360px' },
    maxColumns = { mobile: 1, tablet: 2, desktop: 3 },
    children, 
    ...props 
  }, ref) => {
    const [gridClasses, setGridClasses] = useState('');

    useEffect(() => {
      const classes = responsiveFramework.generateResponsiveClasses(
        'grid gap-6',
        {
          'mobile': `grid-cols-1`,
          'tablet': `md:grid-cols-${maxColumns.tablet}`,
          'desktop': `lg:grid-cols-${maxColumns.desktop}`
        }
      );
      setGridClasses(classes);
    }, [minCardWidth, maxColumns]);

    return (
      <div
        ref={ref}
        className={cn(gridClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardGrid.displayName = 'CardGrid'; 