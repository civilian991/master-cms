import React from 'react';
import { cn } from '@/lib/utils';

// Base skeleton component with animation
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Loading spinner component
export function LoadingSpinner({ 
  size = 'md', 
  className,
  ...props 
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

// Article card skeleton
export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-6 space-y-4", className)}>
      {/* Featured image */}
      <Skeleton className="aspect-video w-full rounded-lg" />
      
      {/* Category badge */}
      <Skeleton className="h-4 w-20 rounded-full" />
      
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      
      {/* Excerpt */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Author and metadata */}
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// Article list skeleton
export function ArticleListSkeleton({ 
  count = 6, 
  layout = 'grid',
  className 
}: { 
  count?: number;
  layout?: 'grid' | 'list';
  className?: string;
}) {
  const gridClasses = layout === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'space-y-6';

  return (
    <div className={cn(gridClasses, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-12" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-16" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      {/* Metadata */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Search results skeleton
export function SearchResultsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search summary */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      {/* Filters */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Results */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b border-border pb-4 last:border-b-0">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Navigation skeleton
export function NavigationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-4", className)}>
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      {/* Navigation items */}
      <div className="hidden md:flex items-center space-x-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-18" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Mobile menu button */}
      <Skeleton className="h-8 w-8 md:hidden" />
    </div>
  );
}

// Content loading with message
export function ContentLoading({
  message = "Loading content...",
  showSpinner = true,
  className
}: {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
      {showSpinner && <LoadingSpinner size="lg" />}
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  );
}

// Lazy loading wrapper with intersection observer
export function LazyLoader({
  children,
  fallback,
  className,
  threshold = 0.1
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Add a small delay to improve perceived performance
          setTimeout(() => setIsLoaded(true), 100);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {isLoaded ? children : (fallback || <Skeleton className="h-32 w-full" />)}
    </div>
  );
}

// Progressive loading for images
export function ProgressiveImage({
  src,
  alt,
  placeholder,
  className,
  ...props
}: {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Placeholder or skeleton */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0">
          {placeholder ? (
            <img
              src={placeholder}
              alt={alt}
              className="w-full h-full object-cover filter blur-sm"
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}
      
      {/* Main image */}
      {!isError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
      
      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground text-sm">Failed to load image</p>
        </div>
      )}
    </div>
  );
} 