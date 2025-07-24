'use client';

import React, { forwardRef, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  EllipsisHorizontalIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UserIcon,
  DocumentIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

// Mobile dashboard layout variants
const mobileDashboardVariants = cva(
  'w-full space-y-6 pb-6',
  {
    variants: {
      spacing: {
        tight: 'space-y-4',
        default: 'space-y-6',
        loose: 'space-y-8',
      },
      padding: {
        none: '',
        default: 'px-4',
        comfortable: 'px-6',
      },
    },
    defaultVariants: {
      spacing: 'default',
      padding: 'default',
    },
  }
);

// Mobile widget variants
const mobileWidgetVariants = cva(
  'bg-card border border-border rounded-xl shadow-sm transition-all duration-200',
  {
    variants: {
      size: {
        small: 'p-4',
        default: 'p-5',
        large: 'p-6',
      },
      variant: {
        default: 'hover:shadow-md',
        elevated: 'shadow-md hover:shadow-lg',
        interactive: 'cursor-pointer hover:shadow-md hover:border-primary active:scale-[0.98]',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface MobileDashboardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileDashboardVariants> {}

const MobileDashboard = forwardRef<HTMLDivElement, MobileDashboardProps>(
  ({ className, spacing, padding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(mobileDashboardVariants({ spacing, padding }), className)}
      {...props}
    >
      {children}
    </div>
  )
);
MobileDashboard.displayName = 'MobileDashboard';

// Mobile widget base component
export interface MobileWidgetProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileWidgetVariants> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  loading?: boolean;
  error?: string;
  onActionClick?: () => void;
}

const MobileWidget = forwardRef<HTMLDivElement, MobileWidgetProps>(
  ({
    className,
    size,
    variant,
    title,
    subtitle,
    action,
    loading,
    error,
    onActionClick,
    children,
    onClick,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <div ref={ref} className={cn(mobileWidgetVariants({ size, variant }), className)} {...props}>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div ref={ref} className={cn(mobileWidgetVariants({ size, variant }), className)} {...props}>
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(mobileWidgetVariants({ size, variant }), className)}
        onClick={onClick}
        {...props}
      >
        {/* Header */}
        {(title || action) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            {(action || onActionClick) && (
              <div className="flex-shrink-0 ml-3">
                {action || (
                  <button
                    onClick={onActionClick}
                    className="p-2 rounded-full hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="More options"
                  >
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    );
  }
);
MobileWidget.displayName = 'MobileWidget';

// Mobile stat widget
export interface MobileStatWidgetProps extends Omit<MobileWidgetProps, 'children'> {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const MobileStatWidget = forwardRef<HTMLDivElement, MobileStatWidgetProps>(
  ({
    value,
    label,
    trend,
    icon,
    color = 'primary',
    className,
    ...props
  }, ref) => {
    const colorClasses = {
      primary: 'text-primary',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      destructive: 'text-destructive',
    };

    return (
      <MobileWidget
        ref={ref}
        size="default"
        className={className}
        {...props}
      >
        <div className="space-y-3">
          {/* Icon and Value */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold">
                {value}
              </div>
              <div className="text-sm text-muted-foreground">
                {label}
              </div>
            </div>
            
            {icon && (
              <div className={cn('p-2 rounded-lg bg-muted/50', colorClasses[color])}>
                {icon}
              </div>
            )}
          </div>
          
          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1 text-sm',
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.direction === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {Math.abs(trend.value)}%
                </span>
              </div>
              {trend.label && (
                <span className="text-sm text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </MobileWidget>
    );
  }
);
MobileStatWidget.displayName = 'MobileStatWidget';

// Mobile quick actions widget
export interface MobileQuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  disabled?: boolean;
  badge?: string | number;
}

export interface MobileQuickActionsProps extends Omit<MobileWidgetProps, 'children'> {
  actions: MobileQuickAction[];
  columns?: 2 | 3 | 4;
}

const MobileQuickActions = forwardRef<HTMLDivElement, MobileQuickActionsProps>(
  ({
    actions,
    columns = 3,
    className,
    ...props
  }, ref) => {
    const gridClasses = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };

    const colorClasses = {
      primary: 'bg-primary/10 text-primary hover:bg-primary/20',
      success: 'bg-green-50 text-green-600 hover:bg-green-100',
      warning: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      destructive: 'bg-red-50 text-red-600 hover:bg-red-100',
    };

    return (
      <MobileWidget
        ref={ref}
        className={className}
        {...props}
      >
        <div className={cn('grid gap-3', gridClasses[columns])}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'relative p-4 rounded-xl text-center transition-all duration-200',
                'min-h-[80px] flex flex-col items-center justify-center gap-2',
                'touch-manipulation active:scale-95',
                !action.disabled && (
                  action.color 
                    ? colorClasses[action.color]
                    : 'bg-muted/50 hover:bg-muted text-foreground'
                ),
                action.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center px-1">
                  {action.badge}
                </div>
              )}
              
              <div className="text-lg">
                {action.icon}
              </div>
              <span className="text-xs font-medium leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </MobileWidget>
    );
  }
);
MobileQuickActions.displayName = 'MobileQuickActions';

// Mobile list widget
export interface MobileListWidgetItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}

export interface MobileListWidgetProps extends Omit<MobileWidgetProps, 'children'> {
  items: MobileListWidgetItem[];
  showAll?: boolean;
  onShowAll?: () => void;
  maxItems?: number;
  emptyMessage?: string;
}

const MobileListWidget = forwardRef<HTMLDivElement, MobileListWidgetProps>(
  ({
    items,
    showAll = false,
    onShowAll,
    maxItems = 5,
    emptyMessage = 'No items found',
    className,
    ...props
  }, ref) => {
    const displayItems = showAll ? items : items.slice(0, maxItems);
    const hasMore = items.length > maxItems;

    return (
      <MobileWidget
        ref={ref}
        className={className}
        {...props}
      >
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  item.onClick && 'cursor-pointer hover:bg-muted/50 active:bg-muted touch-manipulation'
                )}
                onClick={item.onClick}
              >
                {/* Avatar */}
                {item.avatar && (
                  <div className="flex-shrink-0">
                    {item.avatar}
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    
                    {item.meta && (
                      <div className="flex-shrink-0 ml-2 text-xs text-muted-foreground">
                        {item.meta}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action */}
                {item.action && (
                  <div className="flex-shrink-0">
                    {item.action}
                  </div>
                )}
                
                {/* Arrow for clickable items */}
                {item.onClick && !item.action && (
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
            
            {/* Show All Button */}
            {hasMore && !showAll && onShowAll && (
              <button
                onClick={onShowAll}
                className="w-full p-3 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors touch-manipulation"
              >
                Show all {items.length} items
              </button>
            )}
          </div>
        )}
      </MobileWidget>
    );
  }
);
MobileListWidget.displayName = 'MobileListWidget';

// Mobile chart widget placeholder
export interface MobileChartWidgetProps extends Omit<MobileWidgetProps, 'children'> {
  data: Array<{ label: string; value: number; color?: string }>;
  type?: 'bar' | 'line' | 'pie' | 'area';
  height?: number;
}

const MobileChartWidget = forwardRef<HTMLDivElement, MobileChartWidgetProps>(
  ({
    data,
    type = 'bar',
    height = 200,
    className,
    ...props
  }, ref) => {
    return (
      <MobileWidget
        ref={ref}
        className={className}
        {...props}
      >
        <div 
          className="w-full bg-muted/20 rounded-lg flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart
            </p>
            <p className="text-xs mt-1">
              {data.length} data points
            </p>
          </div>
        </div>
      </MobileWidget>
    );
  }
);
MobileChartWidget.displayName = 'MobileChartWidget';

// Mobile grid layout for dashboard widgets
export interface MobileGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  gap?: 'small' | 'default' | 'large';
  className?: string;
}

const MobileGrid = forwardRef<HTMLDivElement, MobileGridProps>(
  ({ children, columns = 1, gap = 'default', className }, ref) => {
    const gridClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
    };

    const gapClasses = {
      small: 'gap-3',
      default: 'gap-4',
      large: 'gap-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gridClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {children}
      </div>
    );
  }
);
MobileGrid.displayName = 'MobileGrid';

// Example dashboard preset components
export const MobileAnalyticsDashboard = () => {
  const statsData = [
    {
      value: '1.2K',
      label: 'Total Views',
      icon: <EyeIcon className="h-5 w-5" />,
      trend: { value: 12, direction: 'up' as const, label: 'vs last week' },
    },
    {
      value: '89',
      label: 'Active Users',
      icon: <UserIcon className="h-5 w-5" />,
      trend: { value: 3, direction: 'down' as const, label: 'vs last week' },
    },
    {
      value: '24',
      label: 'Articles',
      icon: <DocumentIcon className="h-5 w-5" />,
      trend: { value: 8, direction: 'up' as const, label: 'vs last week' },
    },
    {
      value: '156',
      label: 'Comments',
      icon: <ChatBubbleLeftIcon className="h-5 w-5" />,
      trend: { value: 15, direction: 'up' as const, label: 'vs last week' },
    },
  ];

  const quickActions = [
    {
      label: 'New Article',
      icon: <DocumentIcon className="h-6 w-6" />,
      onClick: () => console.log('New article'),
      color: 'primary' as const,
    },
    {
      label: 'Analytics',
      icon: <EyeIcon className="h-6 w-6" />,
      onClick: () => console.log('Analytics'),
    },
    {
      label: 'Settings',
      icon: <UserIcon className="h-6 w-6" />,
      onClick: () => console.log('Settings'),
    },
  ];

  return (
    <MobileDashboard>
      {/* Stats Grid */}
      <MobileGrid columns={2} gap="default">
        {statsData.map((stat, index) => (
          <MobileStatWidget
            key={index}
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </MobileGrid>

      {/* Quick Actions */}
      <MobileQuickActions
        title="Quick Actions"
        actions={quickActions}
        columns={3}
      />

      {/* Chart Widget */}
      <MobileChartWidget
        title="Performance Overview"
        subtitle="Last 7 days"
        data={[
          { label: 'Mon', value: 100 },
          { label: 'Tue', value: 120 },
          { label: 'Wed', value: 90 },
          { label: 'Thu', value: 150 },
          { label: 'Fri', value: 130 },
          { label: 'Sat', value: 110 },
          { label: 'Sun', value: 140 },
        ]}
        type="line"
      />
    </MobileDashboard>
  );
};

export {
  MobileDashboard,
  MobileWidget,
  MobileStatWidget,
  MobileQuickActions,
  MobileListWidget,
  MobileChartWidget,
  MobileGrid,
  mobileDashboardVariants,
  mobileWidgetVariants,
}; 