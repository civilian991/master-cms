'use client';

import React, { forwardRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// Mobile list variants
const mobileListVariants = cva(
  'w-full space-y-2',
  {
    variants: {
      variant: {
        default: '',
        bordered: 'border border-border rounded-lg p-4',
        elevated: 'bg-card shadow-sm rounded-lg p-4',
        flat: 'bg-muted/50 rounded-lg p-4',
      },
      spacing: {
        tight: 'space-y-1',
        default: 'space-y-2',
        loose: 'space-y-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'default',
    },
  }
);

// Mobile list item with touch-friendly design
const mobileListItemVariants = cva(
  'flex items-center p-3 rounded-lg transition-all duration-200 min-h-[56px] touch-manipulation',
  {
    variants: {
      variant: {
        default: 'hover:bg-muted/50 active:scale-[0.98]',
        bordered: 'border border-border hover:border-primary active:scale-[0.98]',
        elevated: 'bg-card shadow-sm hover:shadow-md active:scale-[0.98]',
        interactive: 'cursor-pointer hover:bg-primary/5 active:bg-primary/10 active:scale-[0.98]',
      },
      state: {
        default: '',
        selected: 'bg-primary/10 border-primary',
        disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
    },
  }
);

export interface MobileListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileListVariants> {
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

const MobileList = forwardRef<HTMLDivElement, MobileListProps>(
  ({
    className,
    variant,
    spacing,
    loading,
    empty,
    emptyMessage = 'No items found',
    children,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <div ref={ref} className={cn(mobileListVariants({ variant, spacing }), className)} {...props}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-full mr-3" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (empty) {
      return (
        <div ref={ref} className={cn(mobileListVariants({ variant, spacing }), className)} {...props}>
          <div className="text-center py-8 text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(mobileListVariants({ variant, spacing }), className)} {...props}>
        {children}
      </div>
    );
  }
);
MobileList.displayName = 'MobileList';

export interface MobileListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileListItemVariants> {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  meta?: string;
  selected?: boolean;
  disabled?: boolean;
}

const MobileListItem = forwardRef<HTMLDivElement, MobileListItemProps>(
  ({
    className,
    variant,
    state,
    avatar,
    title,
    subtitle,
    action,
    meta,
    selected,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const actualState = disabled ? 'disabled' : selected ? 'selected' : state;
    const actualVariant = onClick ? 'interactive' : variant;

    return (
      <div
        ref={ref}
        className={cn(mobileListItemVariants({ variant: actualVariant, state: actualState }), className)}
        onClick={disabled ? undefined : onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        {...props}
      >
        {avatar && (
          <div className="flex-shrink-0 mr-3">
            {avatar}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">
                {title}
              </h4>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            {meta && (
              <div className="flex-shrink-0 ml-2 text-xs text-muted-foreground">
                {meta}
              </div>
            )}
          </div>
        </div>
        
        {action && (
          <div className="flex-shrink-0 ml-3 min-h-[44px] flex items-center">
            {action}
          </div>
        )}
      </div>
    );
  }
);
MobileListItem.displayName = 'MobileListItem';

// Mobile table component optimized for small screens
export interface MobileTableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

export interface MobileTableProps<T = any> {
  data: T[];
  columns: MobileTableColumn<T>[];
  loading?: boolean;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  variant?: 'card' | 'list';
  pageSize?: number;
  showPagination?: boolean;
}

function MobileTable<T = any>({
  data,
  columns,
  loading,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  className,
  variant = 'card',
  pageSize = 10,
  showPagination = true,
}: MobileTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter((item) => {
      return columns.some(column => {
        const value = item[column.key];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = sortKey === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Search and Filter Header */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="p-2 border border-border rounded-lg hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Card Layout */}
        <div className="space-y-3">
          {paginatedData.map((item, index) => (
            <div
              key={index}
              className={cn(
                'p-4 border border-border rounded-lg bg-card transition-all duration-200',
                onRowClick && 'cursor-pointer hover:border-primary hover:shadow-md active:scale-[0.98]'
              )}
              onClick={() => onRowClick?.(item, index)}
            >
              <div className="space-y-3">
                {columns.map((column, colIndex) => {
                  const value = item[column.key];
                  const displayValue = column.render ? column.render(value, item) : value;
                  
                  return (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0 w-24">
                        {column.label}:
                      </span>
                      <span className="text-sm text-right flex-1 min-w-0 ml-2">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List variant with horizontal scroll for table-like display
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Header */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'text-left p-3 text-sm font-medium text-muted-foreground',
                    column.sortable && 'cursor-pointer hover:text-foreground',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon 
                          className={cn(
                            'h-3 w-3',
                            sortKey === column.key && sortDirection === 'asc' 
                              ? 'text-primary' 
                              : 'text-muted-foreground'
                          )} 
                        />
                        <ChevronDownIcon 
                          className={cn(
                            'h-3 w-3 -mt-1',
                            sortKey === column.key && sortDirection === 'desc' 
                              ? 'text-primary' 
                              : 'text-muted-foreground'
                          )} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  'border-b border-border transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50 active:bg-muted'
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => {
                  const value = item[column.key];
                  const displayValue = column.render ? column.render(value, item) : value;
                  
                  return (
                    <td key={column.key} className={cn('p-3 text-sm', column.className)}>
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile accordion for expandable content
export interface MobileAccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface MobileAccordionProps {
  items: MobileAccordionItemProps[];
  allowMultiple?: boolean;
  className?: string;
}

const MobileAccordion = forwardRef<HTMLDivElement, MobileAccordionProps>(
  ({ items, allowMultiple = false, className }, ref) => {
    const [openItems, setOpenItems] = useState<Set<number>>(
      new Set(items.map((item, index) => item.defaultOpen ? index : -1).filter(i => i >= 0))
    );

    const toggleItem = (index: number) => {
      if (!allowMultiple) {
        setOpenItems(openItems.has(index) ? new Set() : new Set([index]));
      } else {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
          newOpenItems.delete(index);
        } else {
          newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
      }
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {items.map((item, index) => {
          const isOpen = openItems.has(index);
          
          return (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => !item.disabled && toggleItem(index)}
                disabled={item.disabled}
                className={cn(
                  'w-full p-4 text-left flex items-center justify-between min-h-[56px]',
                  'transition-colors duration-200 touch-manipulation',
                  !item.disabled && 'hover:bg-muted/50 active:bg-muted',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.icon && (
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                  )}
                  <span className="font-medium truncate">
                    {item.title}
                  </span>
                </div>
                
                <ChevronDownIcon 
                  className={cn(
                    'h-5 w-5 transition-transform duration-200 flex-shrink-0',
                    isOpen && 'transform rotate-180'
                  )}
                />
              </button>
              
              {isOpen && (
                <div className="p-4 pt-0 border-t border-border">
                  {item.children}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);
MobileAccordion.displayName = 'MobileAccordion';

export {
  MobileList,
  MobileListItem,
  MobileTable,
  MobileAccordion,
  mobileListVariants,
  mobileListItemVariants,
}; 