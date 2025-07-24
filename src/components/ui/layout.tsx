import React from 'react';
import { cn } from '@/lib/utils';

// Grid system props
export interface GridProps {
  /**
   * Number of columns (1-12)
   */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  
  /**
   * Responsive column configuration
   */
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
  
  /**
   * Gap between grid items
   */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Child components
   */
  children: React.ReactNode;
}

// Grid item props
export interface GridItemProps {
  /**
   * Column span (1-12)
   */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  
  /**
   * Responsive span configuration
   */
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
  
  /**
   * Column start position (1-12)
   */
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Child components
   */
  children: React.ReactNode;
}

// Container props
export interface ContainerProps {
  /**
   * Container size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /**
   * Whether to center the container
   */
  center?: boolean;
  
  /**
   * Padding configuration
   */
  padding?: {
    x?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    y?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Child components
   */
  children: React.ReactNode;
}

// Section props
export interface SectionProps {
  /**
   * Section semantic role
   */
  as?: 'section' | 'main' | 'article' | 'aside' | 'header' | 'footer' | 'div';
  
  /**
   * Background variant
   */
  background?: 'default' | 'muted' | 'card' | 'primary' | 'accent';
  
  /**
   * Spacing configuration
   */
  spacing?: {
    top?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    bottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  };
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Child components
   */
  children: React.ReactNode;
}

// Stack props for vertical layouts
export interface StackProps {
  /**
   * Stack direction
   */
  direction?: 'vertical' | 'horizontal';
  
  /**
   * Gap between items
   */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  /**
   * Alignment
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  
  /**
   * Responsive behavior
   */
  responsive?: {
    sm?: { direction?: 'vertical' | 'horizontal'; gap?: string };
    md?: { direction?: 'vertical' | 'horizontal'; gap?: string };
    lg?: { direction?: 'vertical' | 'horizontal'; gap?: string };
  };
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Child components
   */
  children: React.ReactNode;
}

/**
 * Grid Component
 * 
 * 12-column responsive grid system with consistent gutters
 */
export const Grid: React.FC<GridProps> = ({
  cols = 12,
  responsive,
  gap = 'md',
  className,
  children,
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-6', // 24px - design system default
    lg: 'gap-8',
    xl: 'gap-12',
  };

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  };

  const responsiveClasses = responsive ? [
    responsive.sm && `sm:grid-cols-${responsive.sm}`,
    responsive.md && `md:grid-cols-${responsive.md}`,
    responsive.lg && `lg:grid-cols-${responsive.lg}`,
    responsive.xl && `xl:grid-cols-${responsive.xl}`,
  ].filter(Boolean).join(' ') : '';

  return (
    <div
      className={cn(
        'grid',
        colClasses[cols],
        gapClasses[gap],
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

Grid.displayName = "Grid";

/**
 * GridItem Component
 * 
 * Individual grid item with span and positioning control
 */
export const GridItem: React.FC<GridItemProps> = ({
  span,
  responsive,
  start,
  className,
  children,
}) => {
  const spanClasses = span ? {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
  }[span] : '';

  const startClasses = start ? {
    1: 'col-start-1',
    2: 'col-start-2',
    3: 'col-start-3',
    4: 'col-start-4',
    5: 'col-start-5',
    6: 'col-start-6',
    7: 'col-start-7',
    8: 'col-start-8',
    9: 'col-start-9',
    10: 'col-start-10',
    11: 'col-start-11',
    12: 'col-start-12',
  }[start] : '';

  const responsiveClasses = responsive ? [
    responsive.sm && `sm:col-span-${responsive.sm}`,
    responsive.md && `md:col-span-${responsive.md}`,
    responsive.lg && `lg:col-span-${responsive.lg}`,
    responsive.xl && `xl:col-span-${responsive.xl}`,
  ].filter(Boolean).join(' ') : '';

  return (
    <div
      className={cn(
        spanClasses,
        startClasses,
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

GridItem.displayName = "GridItem";

/**
 * Container Component
 * 
 * Responsive container with maximum width constraints
 */
export const Container: React.FC<ContainerProps> = ({
  size = 'xl',
  center = true,
  padding = { x: 'md', y: 'none' },
  className,
  children,
}) => {
  const sizeClasses = {
    sm: 'max-w-screen-sm',   // 640px
    md: 'max-w-screen-md',   // 768px
    lg: 'max-w-screen-lg',   // 1024px
    xl: 'max-w-screen-xl',   // 1280px - but we'll override to 1200px
    full: 'max-w-none',
  };

  const paddingXClasses = {
    none: '',
    sm: 'px-2',
    md: 'px-4',  // 16px - design system default
    lg: 'px-6',
    xl: 'px-8',
  };

  const paddingYClasses = {
    none: '',
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-6',
    xl: 'py-8',
  };

  return (
    <div
      className={cn(
        // Apply max-width constraint (1200px for xl as per design system)
        size === 'xl' ? 'max-w-[1200px]' : sizeClasses[size],
        center && 'mx-auto',
        paddingXClasses[padding.x || 'none'],
        paddingYClasses[padding.y || 'none'],
        className
      )}
    >
      {children}
    </div>
  );
};

Container.displayName = "Container";

/**
 * Section Component
 * 
 * Semantic section with background and spacing options
 */
export const Section: React.FC<SectionProps> = ({
  as = 'section',
  background = 'default',
  spacing = { top: 'md', bottom: 'md' },
  className,
  children,
}) => {
  const Component = as;

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted',
    card: 'bg-card',
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  const spacingTopClasses = {
    none: '',
    sm: 'pt-4',
    md: 'pt-8',   // 32px - design system baseline
    lg: 'pt-12',
    xl: 'pt-16',
    '2xl': 'pt-24',
  };

  const spacingBottomClasses = {
    none: '',
    sm: 'pb-4',
    md: 'pb-8',   // 32px - design system baseline
    lg: 'pb-12',
    xl: 'pb-16',
    '2xl': 'pb-24',
  };

  return (
    <Component
      className={cn(
        backgroundClasses[background],
        spacingTopClasses[spacing.top || 'none'],
        spacingBottomClasses[spacing.bottom || 'none'],
        className
      )}
    >
      {children}
    </Component>
  );
};

Section.displayName = "Section";

/**
 * Stack Component
 * 
 * Flexbox-based layout for vertical/horizontal stacking
 */
export const Stack: React.FC<StackProps> = ({
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  responsive,
  className,
  children,
}) => {
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',   // 4px
    sm: 'gap-2',   // 8px
    md: 'gap-4',   // 16px
    lg: 'gap-6',   // 24px
    xl: 'gap-8',   // 32px
    '2xl': 'gap-12', // 48px
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const responsiveClasses = responsive ? [
    responsive.sm?.direction && `sm:${directionClasses[responsive.sm.direction]}`,
    responsive.sm?.gap && `sm:${gapClasses[responsive.sm.gap as keyof typeof gapClasses]}`,
    responsive.md?.direction && `md:${directionClasses[responsive.md.direction]}`,
    responsive.md?.gap && `md:${gapClasses[responsive.md.gap as keyof typeof gapClasses]}`,
    responsive.lg?.direction && `lg:${directionClasses[responsive.lg.direction]}`,
    responsive.lg?.gap && `lg:${gapClasses[responsive.lg.gap as keyof typeof gapClasses]}`,
  ].filter(Boolean).join(' ') : '';

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

Stack.displayName = "Stack";

/**
 * Layout Utility Components
 */

// Spacer component for consistent spacing
export const Spacer: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  axis?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}> = ({ size = 'md', axis = 'vertical', className }) => {
  const sizeClasses = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
  };

  const axisClasses = {
    horizontal: `w-${sizeClasses[size]}`,
    vertical: `h-${sizeClasses[size]}`,
    both: `w-${sizeClasses[size]} h-${sizeClasses[size]}`,
  };

  return <div className={cn(axisClasses[axis], className)} />;
};

Spacer.displayName = "Spacer";

// Divider component
export const Divider: React.FC<{
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}> = ({ orientation = 'horizontal', className }) => {
  const orientationClasses = {
    horizontal: 'w-full h-px border-t border-border',
    vertical: 'h-full w-px border-l border-border',
  };

  return <div className={cn(orientationClasses[orientation], className)} />;
};

Divider.displayName = "Divider";

// Center component for easy centering
export const Center: React.FC<{
  children: React.ReactNode;
  axis?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}> = ({ children, axis = 'both', className }) => {
  const axisClasses = {
    horizontal: 'justify-center',
    vertical: 'items-center',
    both: 'justify-center items-center',
  };

  return (
    <div className={cn('flex', axisClasses[axis], className)}>
      {children}
    </div>
  );
};

Center.displayName = "Center";

// Aspect ratio component
export const AspectRatio: React.FC<{
  ratio?: '16/9' | '4/3' | '1/1' | '3/4' | '9/16';
  children: React.ReactNode;
  className?: string;
}> = ({ ratio = '16/9', children, className }) => {
  const ratioClasses = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '3/4': 'aspect-[3/4]',
    '9/16': 'aspect-[9/16]',
  };

  return (
    <div className={cn('relative', ratioClasses[ratio], className)}>
      {children}
    </div>
  );
};

AspectRatio.displayName = "AspectRatio"; 