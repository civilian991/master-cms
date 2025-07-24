import React from 'react';
import { ContentItem, SortOption, ContentFilters } from './content';
import { ContentListClientWrapper } from './content-client-wrapper';

interface ContentServerWrapperProps {
  items: ContentItem[];
  state: 'loading' | 'loaded' | 'error' | 'empty';
  sortBy?: SortOption;
  filters?: ContentFilters;
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
 * Server-safe wrapper for ContentList that doesn't require event handlers
 * Use this from Server Components instead of ContentList directly
 */
export function ContentServerWrapper(props: ContentServerWrapperProps) {
  // Map 'empty' state to 'loaded' for ContentList
  const mappedState = props.state === 'empty' ? 'loaded' : props.state;
  
  return (
    <ContentListClientWrapper
      {...props}
      state={mappedState}
      sortBy={props.sortBy || 'newest'}
      filters={props.filters || {}}
    />
  );
} 