"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
  lines?: number
  variant?: 'default' | 'circular' | 'text' | 'card' | 'table'
  height?: string | number
  width?: string | number
}

function Skeleton({
  className,
  shimmer = true,
  lines,
  variant = 'default',
  height,
  width,
  ...props
}: SkeletonProps) {
  const baseClasses = cn(
    "animate-pulse rounded-md bg-gray-200",
    shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"
  )

  if (lines && lines > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              "h-4",
              index === lines - 1 && "w-3/4", // Last line shorter
              className
            )}
            {...props}
          />
        ))}
      </div>
    )
  }

  const variantClasses = {
    default: "h-4",
    circular: "rounded-full aspect-square",
    text: "h-4",
    card: "h-48 rounded-lg",
    table: "h-10"
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ height, width }}
      {...props}
    />
  )
}

// Skeleton Table Component
interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} className="h-6 flex-1" variant="text" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-10 flex-1" 
              variant="table" 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Skeleton Card Component
interface SkeletonCardProps {
  showImage?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showActions?: boolean
  className?: string
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
  className
}) => {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4", className)}>
      {showImage && <Skeleton className="h-48 w-full rounded-lg" />}
      {showTitle && <Skeleton className="h-6 w-3/4" />}
      {showDescription && <Skeleton lines={3} />}
      {showActions && (
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  )
}

// Skeleton Form Component
interface SkeletonFormProps {
  fields?: number
  showButtons?: boolean
  layout?: 'single' | 'double'
  className?: string
}

const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 4,
  showButtons = true,
  layout = 'single',
  className
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn(
        "space-y-4",
        layout === 'double' && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0"
      )}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={`field-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-12 w-full" /> {/* Input */}
          </div>
        ))}
      </div>
      {showButtons && (
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  )
}

// Skeleton List Component
interface SkeletonListProps {
  items?: number
  showAvatar?: boolean
  showMetadata?: boolean
  className?: string
}

const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = true,
  showMetadata = true,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={`item-${index}`} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          {showAvatar && <Skeleton variant="circular" className="w-12 h-12" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            {showMetadata && <Skeleton className="h-4 w-1/2" />}
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

// Loading Button Component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  variant = 'default',
  size = 'default',
  ...props
}) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // Size variants
    size === 'sm' && "h-9 px-3 text-sm",
    size === 'default' && "h-10 px-4 text-base",
    size === 'lg' && "h-12 px-6 text-lg",
    // Style variants
    variant === 'default' && "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-medium",
    variant === 'outline' && "border border-gray-300 bg-white hover:bg-gray-50 shadow-soft hover:shadow-medium",
    variant === 'ghost' && "hover:bg-gray-100",
    className
  )

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className={cn(
            "animate-spin mr-2",
            size === 'sm' ? "h-3 w-3" : size === 'lg' ? "h-5 w-5" : "h-4 w-4"
          )}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

export { 
  Skeleton, 
  SkeletonTable, 
  SkeletonCard, 
  SkeletonForm, 
  SkeletonList, 
  LoadingButton 
} 