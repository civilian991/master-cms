"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MoreHorizontalIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
//   PaginationEllipsis,
// } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Generic types for the AdminTable
export interface AdminTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface AdminTableProps<T> {
  title: string
  description?: string
  columns: AdminTableColumn<T>[]
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

export function AdminTable<T extends { id: string | number }>({
  title,
  description,
  columns,
  data,
  loading = false,
  totalCount = 0,
  pageSize = 20,
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
  bulkActions = [],
  rowActions = [],
  searchPlaceholder = "Search...",
  emptyStateTitle = "No data found",
  emptyStateDescription = "There are no items to display.",
  className,
}: AdminTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [sortColumn, setSortColumn] = useState<string>()
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  // Handle row selection
  const handleRowSelect = (rowId: string | number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowId)
    } else {
      newSelected.delete(rowId)
    }
    setSelectedRows(newSelected)
    
    const selectedData = data.filter(row => newSelected.has(row.id))
    onRowSelect?.(selectedData)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(row => row.id))
      setSelectedRows(allIds)
      onRowSelect?.(data)
    } else {
      setSelectedRows(new Set())
      onRowSelect?.([])
    }
  }

  // Handle sorting
  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort?.(column, newDirection)
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    const selectedData = data.filter(row => selectedRows.has(row.id))
    onBulkAction?.(action, selectedData)
    setSelectedRows(new Set()) // Clear selection after action
  }

  // Check if all rows are selected
  const isAllSelected = data.length > 0 && selectedRows.size === data.length
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          {onSearch && (
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {/* Bulk Actions */}
          {selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.size} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {bulkActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => handleBulkAction(action.value)}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Select All Checkbox */}
                <TableHead className="w-12">
                                  <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
                </TableHead>
                
                {/* Column Headers */}
                {columns.map((column, index) => (
                  <TableHead
                    key={index}
                    className={cn(
                      column.width && `w-[${column.width}]`,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:bg-muted/50'
                    )}
                    onClick={column.sortable ? () => handleSort(column.key as string) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            className={cn(
                              "h-3 w-3",
                              sortColumn === column.key && sortDirection === 'asc'
                                ? "text-foreground" 
                                : "text-muted-foreground"
                            )} 
                          />
                          <ChevronDownIcon 
                            className={cn(
                              "h-3 w-3 -mt-1",
                              sortColumn === column.key && sortDirection === 'desc'
                                ? "text-foreground" 
                                : "text-muted-foreground"
                            )} 
                          />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
                
                {/* Actions Column */}
                {rowActions.length > 0 && (
                  <TableHead className="w-12"></TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                // Loading skeleton
                (Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                    {rowActions.length > 0 && (
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    )}
                  </TableRow>
                )))
              ) : data.length === 0 ? (
                // Empty state
                (<TableRow>
                  <TableCell 
                    colSpan={columns.length + (rowActions.length > 0 ? 2 : 1)} 
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-8">
                      <h3 className="text-lg font-semibold">{emptyStateTitle}</h3>
                      <p className="text-muted-foreground">{emptyStateDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>)
              ) : (
                // Data rows
                (data.map((row) => (
                  <TableRow 
                    key={row.id}
                    className={selectedRows.has(row.id) ? "bg-muted/50" : ""}
                  >
                    {/* Row Selection Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </TableCell>
                    
                    {/* Data Cells */}
                    {columns.map((column, colIndex) => {
                      const key = String(column.key)
                      const value = key.includes('.') 
                        ? key.split('.').reduce((obj: any, key: string) => obj?.[key], row as any)
                        : (row as any)[column.key]
                      
                      return (
                        <TableCell 
                          key={colIndex}
                          className={cn(
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.render ? column.render(value, row) : value}
                        </TableCell>
                      )
                    })}
                    
                    {/* Row Actions */}
                    {rowActions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions.map((action, index) => (
                              <React.Fragment key={index}>
                                <DropdownMenuItem
                                  onClick={() => onRowAction?.(action.value, row)}
                                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                                >
                                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                  {action.label}
                                </DropdownMenuItem>
                                {index < rowActions.length - 1 && action.variant === 'destructive' && (
                                  <DropdownMenuSeparator />
                                )}
                              </React.Fragment>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 