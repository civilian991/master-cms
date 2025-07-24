'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Mobile card variants with touch-friendly spacing
const mobileCardVariants = cva(
  'block w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border hover:shadow-md active:scale-[0.98]',
        elevated: 'border-0 shadow-md hover:shadow-lg active:scale-[0.98]',
        outlined: 'border-2 border-border hover:border-primary active:scale-[0.98]',
        ghost: 'border-0 shadow-none bg-transparent hover:bg-muted active:scale-[0.98]',
        interactive: 'border-border hover:shadow-lg hover:border-primary active:scale-[0.95] cursor-pointer',
      },
      size: {
        compact: 'p-3 min-h-[60px]', // 60px minimum touch target
        default: 'p-4 min-h-[72px]', // 72px comfortable touch target
        comfortable: 'p-6 min-h-[88px]', // 88px large touch target
      },
      spacing: {
        tight: 'space-y-2',
        default: 'space-y-3',
        loose: 'space-y-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      spacing: 'default',
    },
  }
);

export interface MobileCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileCardVariants> {
  asChild?: boolean;
  touchFeedback?: boolean;
  loading?: boolean;
}

const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    spacing, 
    asChild = false, 
    touchFeedback = true,
    loading = false,
    children, 
    ...props 
  }, ref) => {
    const cardClasses = cn(
      mobileCardVariants({ variant, size, spacing }),
      touchFeedback && 'touch-manipulation select-none',
      loading && 'opacity-60 pointer-events-none',
      className
    );

    if (loading) {
      return (
        <div ref={ref} className={cardClasses} {...props}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  }
);
MobileCard.displayName = 'MobileCard';

// Mobile card header with touch-optimized layout
export interface MobileCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
  subtitle?: string;
}

const MobileCardHeader = forwardRef<HTMLDivElement, MobileCardHeaderProps>(
  ({ className, children, action, subtitle, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn('flex flex-col space-y-2', className)} 
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-none tracking-tight truncate">
            {children}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 min-h-[44px] flex items-center">
            {action}
          </div>
        )}
      </div>
    </div>
  )
);
MobileCardHeader.displayName = 'MobileCardHeader';

// Mobile card content with responsive typography
const MobileCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn('flex-1 text-sm leading-relaxed', className)} 
      {...props} 
    />
  )
);
MobileCardContent.displayName = 'MobileCardContent';

// Mobile card footer with action buttons
export interface MobileCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
}

const MobileCardFooter = forwardRef<HTMLDivElement, MobileCardFooterProps>(
  ({ className, actions, metadata, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn('flex flex-col space-y-3 pt-3', className)} 
      {...props}
    >
      {children}
      {metadata && (
        <div className="text-xs text-muted-foreground">
          {metadata}
        </div>
      )}
      {actions && (
        <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
          {actions}
        </div>
      )}
    </div>
  )
);
MobileCardFooter.displayName = 'MobileCardFooter';

// Article card specifically for mobile content display
export interface MobileArticleCardProps extends Omit<MobileCardProps, 'children'> {
  title: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
  imageUrl?: string;
  readTime?: number;
  onTap?: () => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

const MobileArticleCard = forwardRef<HTMLDivElement, MobileArticleCardProps>(
  ({ 
    title, 
    excerpt, 
    author, 
    publishedAt, 
    category,
    imageUrl,
    readTime,
    onTap,
    bookmarked = false,
    onBookmark,
    className,
    ...props 
  }, ref) => {
    return (
      <MobileCard
        ref={ref}
        variant="interactive"
        className={cn('relative overflow-hidden', className)}
        onClick={onTap}
        role="article"
        aria-label={`Article: ${title}`}
        {...props}
      >
        {imageUrl && (
          <div className="mb-3 -mx-4 -mt-4">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-32 object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <MobileCardHeader 
          subtitle={category}
          action={
            onBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark();
                }}
                className="p-2 rounded-full hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                <svg
                  className={cn(
                    'h-5 w-5 transition-colors',
                    bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
                  )}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            )
          }
        >
          {title}
        </MobileCardHeader>
        
        {excerpt && (
          <MobileCardContent>
            <p className="line-clamp-3 text-muted-foreground">
              {excerpt}
            </p>
          </MobileCardContent>
        )}
        
        <MobileCardFooter
          metadata={
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {author && <span>{author}</span>}
                {publishedAt && <span>• {publishedAt}</span>}
              </div>
              {readTime && <span>{readTime} min read</span>}
            </div>
          }
        />
      </MobileCard>
    );
  }
);
MobileArticleCard.displayName = 'MobileArticleCard';

export {
  MobileCard,
  MobileCardHeader,
  MobileCardContent,
  MobileCardFooter,
  MobileArticleCard,
  mobileCardVariants,
}; 