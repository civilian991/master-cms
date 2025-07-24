"use client"

import * as React from "react"
import { useState } from "react"
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MoreHorizontalIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon,
  ArrowUpDownIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Enhanced types for the ModernDataTable
export interface ModernTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface ModernDataTableProps<T> {
  title: string
  description?: string
  columns: ModernTableColumn<T>[]
  data: T[]
  loading?: boolean
  totalCount?: number
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
  onSearch?: (query: string) => void
  onRowSelect?: (selectedRows: T[]) => void
  onRowAction?: (action: string, row: T) => void
  onBulkAction?: (action: string, selectedRows: T[]) => void
  onExport?: (format: 'csv' | 'pdf') => void
  onRefresh?: () => void
  onNewItem?: () => void
  bulkActions?: Array<{
    label: string
    value: string
    variant?: 'default' | 'destructive'
  }>
  rowActions?: Array<{
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'default' | 'destructive'
  }>
  searchPlaceholder?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  className?: string
}

// Enhanced Search Input Component
const ModernSearchInput: React.FC<{
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}> = ({ placeholder = "Search...", onSearch, className }) => {
  const [query, setQuery] = useState("")

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  return (
    <div className={cn("relative w-80", className)}>
      <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className={cn(
          "pl-10 bg-white border-gray-200 focus:border-brand-500 focus:ring-brand-500/20",
          "transition-all duration-200 shadow-soft hover:shadow-medium"
        )}
      />
    </div>
  )
}

// Enhanced Filter Button Component
const ModernFilterButton: React.FC<{
  onFilter?: (filters: Record<string, any>) => void
}> = ({ onFilter }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "bg-white border-gray-200 hover:bg-gray-50 shadow-soft hover:shadow-medium",
        "transition-all duration-200 hover:scale-105"
      )}
    >
      <FilterIcon className="h-4 w-4 mr-2" />
      Filter
    </Button>
  )
}

// Enhanced Sortable Header Component
const SortableHeader: React.FC<{
  column: ModernTableColumn<any>
  sortDirection?: 'asc' | 'desc' | null
  onSort?: (column: string, direction: 'asc' | 'desc') => void
}> = ({ column, sortDirection, onSort }) => {
  const handleSort = () => {
    if (!column.sortable || !onSort) return
    
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column.key as string, newDirection)
  }

  return (
    <button
      onClick={handleSort}
      disabled={!column.sortable}
      className={cn(
        "flex items-center gap-2 text-left w-full hover:text-gray-900 transition-colors",
        column.sortable ? "cursor-pointer" : "cursor-default",
        sortDirection && "text-brand-600"
      )}
    >
      <span className="text-caption font-semibold text-gray-700">
        {column.label}
      </span>
      {column.sortable && (
        <div className="flex flex-col">
          {sortDirection === 'asc' ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : sortDirection === 'desc' ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : (
            <ArrowUpDownIcon className="h-3 w-3 opacity-50" />
          )}
        </div>
      )}
    </button>
  )
}

// Enhanced Table Row Component
const ModernTableRow: React.FC<{
  row: any
  columns: ModernTableColumn<any>[]
  index: number
  selected?: boolean
  onSelect?: (selected: boolean) => void
  onAction?: (action: string, row: any) => void
  rowActions?: Array<{
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'default' | 'destructive'
  }>
}> = ({ row, columns, index, selected, onSelect, onAction, rowActions }) => {
  return (
    <tr 
      className={cn(
        "group border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-200",
        "hover:shadow-soft",
        selected && "bg-brand-50/30 border-brand-200"
      )}
    >
      <td className="w-12 p-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="rounded border-gray-300 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600"
        />
      </td>
      
      {columns.map((column) => (
        <td 
          key={column.key as string} 
          className={cn(
            "p-4 text-body text-gray-900",
            column.align === 'center' && "text-center",
            column.align === 'right' && "text-right"
          )}
          style={{ width: column.width }}
        >
          {column.render 
            ? column.render(row[column.key], row)
            : row[column.key]
          }
        </td>
      ))}
      
      <td className="w-16 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-gray-100 hover:scale-110"
              )}
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-elevated"
          >
            <DropdownMenuItem 
              onClick={() => onAction?.('view', row)}
              className="flex items-center gap-2 hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction?.('edit', row)}
              className="flex items-center gap-2 hover:bg-gray-50"
            >
              <EditIcon className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onAction?.('delete', row)}
              className="flex items-center gap-2 text-error-600 hover:bg-error-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// Enhanced Skeleton Rows Component
const SkeletonRows: React.FC<{ count: number; columns: number }> = ({ count, columns }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <tr key={index} className="border-b border-gray-100">
          <td className="p-4">
            <Skeleton className="h-4 w-4 rounded" />
          </td>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <Skeleton className="h-4 w-full rounded" />
            </td>
          ))}
          <td className="p-4">
            <Skeleton className="h-8 w-8 rounded" />
          </td>
        </tr>
      ))}
    </>
  )
}

// Main Modern Data Table Component
export const ModernDataTable = <T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  loading = false,
  totalCount,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onSort,
  onFilter,
  onSearch,
  onRowSelect,
  onRowAction,
  onBulkAction,
  onExport,
  onRefresh,
  onNewItem,
  bulkActions = [],
  rowActions = [],
  searchPlaceholder = "Search content...",
  emptyStateTitle = "No data available",
  emptyStateDescription = "There are no items to display at the moment.",
  className
}: ModernDataTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column)
    setSortDirection(direction)
    onSort?.(column, direction)
  }

  const handleRowSelect = (row: T, selected: boolean) => {
    const newSelection = selected
      ? [...selectedRows, row]
      : selectedRows.filter(r => r !== row)
    
    setSelectedRows(newSelection)
    onRowSelect?.(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? [...data] : []
    setSelectedRows(newSelection)
    onRowSelect?.(newSelection)
  }

  const isAllSelected = data.length > 0 && selectedRows.length === data.length
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-heading text-gray-900">{title}</h2>
          {description && (
            <p className="text-body text-gray-600">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="shadow-soft hover:shadow-medium transition-all duration-200"
            >
              <RefreshCwIcon className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          )}
          {onNewItem && (
            <Button
              onClick={onNewItem}
              className="bg-gradient-brand hover:opacity-90 shadow-soft hover:shadow-medium transition-all duration-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Item
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Table Container */}
      <div className="bg-white rounded-xl border-0 shadow-soft ring-1 ring-gray-200/50 overflow-hidden">
        {/* Enhanced Table Header */}
        <div className="p-6 border-b border-gray-100/50 bg-gradient-subtle">
          <div className="flex items-center justify-between gap-4">
            <ModernSearchInput 
              placeholder={searchPlaceholder}
              onSearch={onSearch}
            />
            <div className="flex items-center gap-3">
              <ModernFilterButton onFilter={onFilter} />
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('csv')}
                  className="shadow-soft hover:shadow-medium transition-all duration-200"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-brand-50/50 rounded-lg border border-brand-200/50">
              <span className="text-caption text-brand-700">
                {selectedRows.length} item{selectedRows.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                {bulkActions.map((action) => (
                  <Button
                    key={action.value}
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    onClick={() => onBulkAction?.(action.value, selectedRows)}
                    className="shadow-soft"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="w-12 p-4 text-left">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                    onCheckedChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                {columns.map((column) => (
                  <th 
                    key={column.key as string}
                    className="p-4 text-left"
                    style={{ width: column.width }}
                  >
                    <SortableHeader
                      column={column}
                      sortDirection={sortColumn === column.key ? sortDirection : null}
                      onSort={handleSort}
                    />
                  </th>
                ))}
                <th className="w-16 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows count={pageSize} columns={columns.length} />
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-12 text-center">
                    <div className="space-y-3">
                      <h3 className="text-heading text-gray-900">{emptyStateTitle}</h3>
                      <p className="text-body text-gray-600 max-w-sm mx-auto">
                        {emptyStateDescription}
                      </p>
                      {onNewItem && (
                        <Button
                          onClick={onNewItem}
                          className="bg-gradient-brand mt-4"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create First Item
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <ModernTableRow
                    key={index}
                    row={row}
                    columns={columns}
                    index={index}
                    selected={selectedRows.includes(row)}
                    onSelect={(selected) => handleRowSelect(row, selected)}
                    onAction={onRowAction}
                    rowActions={rowActions}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {totalCount && totalCount > pageSize && (
          <div className="p-4 border-t border-gray-100/50 bg-gray-50/30">
            <div className="flex items-center justify-between">
              <p className="text-caption text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => onPageChange?.(currentPage - 1)}
                  className="shadow-soft"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage * pageSize >= totalCount}
                  onClick={() => onPageChange?.(currentPage + 1)}
                  className="shadow-soft"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 