'use client';

import React, { useState, useCallback } from 'react';
import { ContentList, ContentItem, SortOption, ContentFilters } from './content';

interface ContentListClientWrapperProps {
  items: ContentItem[];
  state: 'loading' | 'loaded' | 'error' | 'empty';
  sortBy: SortOption;
  filters: ContentFilters;
  sortOptions?: Array<{ value: SortOption; label: string }>;
  categories?: Array<{ id: string; name: string; slug: string }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  className?: string;
  title?: string;
  description?: string;
  layout?: 'grid' | 'list' | 'masonry';
  variant?: 'default' | 'compact' | 'detailed';
  maxItems?: number;
  showFilters?: boolean;
  showSearch?: boolean;
}

/**
 * Client Component wrapper for ContentList that handles event handlers internally
 * This prevents RSC errors when using ContentList from Server Components
 */
export function ContentListClientWrapper(props: ContentListClientWrapperProps) {
  const [currentSortBy, setCurrentSortBy] = useState<SortOption>(props.sortBy);
  const [currentFilters, setCurrentFilters] = useState<ContentFilters>(props.filters);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleSortChange = useCallback((sort: SortOption) => {
    console.log('Sort change requested:', sort);
    setCurrentSortBy(sort);
    // TODO: Implement actual sorting logic with API calls
  }, []);

  const handleFilterChange = useCallback((filters: ContentFilters) => {
    console.log('Filter change requested:', filters);
    setCurrentFilters(filters);
    // TODO: Implement actual filtering logic with API calls
  }, []);

  const handleLoadMore = useCallback(() => {
    console.log('Load more requested');
    setIsLoadingMore(true);
    // TODO: Implement actual pagination logic with API calls
    // For now, just reset the loading state after a delay
    setTimeout(() => setIsLoadingMore(false), 1000);
  }, []);

  return (
    <ContentList
      {...props}
      sortBy={currentSortBy}
      filters={currentFilters}
      isLoadingMore={isLoadingMore}
      onSortChange={handleSortChange}
      onFilterChange={handleFilterChange}
      onLoadMore={handleLoadMore}
    />
  );
} 