"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Icon, Article, Calendar, Clock, User, Eye, Heart, Share, BookmarkSimple, Tag, Warning, X } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

// Content types
export interface ContentItem {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  featuredImage?: string;
  readingTime?: number;
  views?: number;
  likes?: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
}

// Content state types
export type ContentState = 'loading' | 'loaded' | 'error' | 'empty';

// Sort options for content lists
export type SortOption = 'newest' | 'oldest' | 'popular' | 'trending' | 'relevant';

// Filter options
export interface ContentFilters {
  category?: string;
  tags?: string[];
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Article card props
export interface ArticleCardProps {
  /**
   * Content item data
   */
  content: ContentItem;
  
  /**
   * Card variant/size
   */
  variant?: 'default' | 'compact' | 'featured';
  
  /**
   * Show full content or excerpt
   */
  showExcerpt?: boolean;
  
  /**
   * Show engagement actions
   */
  showActions?: boolean;
  
  /**
   * Action handlers
   */
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onShare?: (id: string) => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Featured content hero props
export interface FeaturedContentHeroProps {
  /**
   * Featured content items
   */
  items: ContentItem[];
  
  /**
   * Auto-rotate interval in ms (0 to disable)
   */
  autoRotate?: number;
  
  /**
   * Show navigation dots
   */
  showDots?: boolean;
  
  /**
   * Show navigation arrows
   */
  showArrows?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Content list props
export interface ContentListProps {
  /**
   * List of content items
   */
  items: ContentItem[];
  
  /**
   * Current loading/error state
   */
  state: ContentState;
  
  /**
   * Current sort option
   */
  sortBy: SortOption;
  
  /**
   * Current filters
   */
  filters: ContentFilters;
  
  /**
   * Available sort options
   */
  sortOptions?: Array<{ value: SortOption; label: string }>;
  
  /**
   * Available categories for filtering
   */
  categories?: Array<{ id: string; name: string; slug: string }>;
  
  /**
   * Available tags for filtering
   */
  tags?: Array<{ id: string; name: string; slug: string }>;
  
  /**
   * Change handlers
   */
  onSortChange?: (sort: SortOption) => void;
  onFilterChange?: (filters: ContentFilters) => void;
  onLoadMore?: () => void;
  
  /**
   * Pagination
   */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// AI recommendations props
export interface AIRecommendationsProps {
  /**
   * Current content ID (for context)
   */
  currentContentId?: string;
  
  /**
   * User ID for personalization
   */
  userId?: string;
  
  /**
   * Recommendation type
   */
  type?: 'related' | 'personalized' | 'trending' | 'similar';
  
  /**
   * Maximum number of recommendations
   */
  limit?: number;
  
  /**
   * Show reason for recommendation
   */
  showReason?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Article Card Component
 * 
 * Displays content with preview, metadata, and engagement actions
 */
export const ArticleCard: React.FC<ArticleCardProps> = ({
  content,
  variant = 'default',
  showExcerpt = true,
  showActions = true,
  onLike,
  onBookmark,
  onShare,
  className,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return null;
    return `${minutes} min read`;
  };

  const cardStyles = {
    default: "p-6",
    compact: "p-4",
    featured: "p-8",
  };

  const imageStyles = {
    default: "h-48",
    compact: "h-32", 
    featured: "h-64",
  };

  return (
    <article className={cn(
      "bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200",
      "group cursor-pointer",
      className
    )}>
      {/* Featured Image */}
      {content.featuredImage && (
        <div className={cn("relative overflow-hidden bg-muted", imageStyles[variant])}>
          {!imageError ? (
            <img
              src={content.featuredImage}
              alt={content.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-300",
                "group-hover:scale-105",
                !isImageLoaded && "opacity-0"
              )}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon icon={Article} size="xl" className="text-muted-foreground" />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Link
              href={`/category/${content.category.slug}`}
              className="inline-block px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
             >
              {content.category.name}
            </Link>
          </div>
        </div>
      )}
      <div className={cardStyles[variant]}>
        {/* Article Header */}
        <div className="mb-4">
          <Link href={`/articles/${content.slug}`} className="block group">
            <h3 className={cn(
              "font-bold text-card-foreground group-hover:text-primary transition-colors",
              variant === 'featured' ? "text-2xl mb-3" : "text-lg mb-2",
              variant === 'compact' && "text-base"
            )}>
              {content.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {showExcerpt && content.excerpt && (
            <p className={cn(
              "text-muted-foreground",
              variant === 'featured' ? "text-base" : "text-sm",
              variant === 'compact' && "line-clamp-2"
            )}>
              {content.excerpt}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-4">
            {/* Author */}
            <div className="flex items-center space-2">
              {content.author.avatar ? (
                <img
                  src={content.author.avatar}
                  alt={content.author.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <Icon icon={User} size="sm" />
              )}
              <span className="font-medium">{content.author.name}</span>
            </div>

            {/* Publish Date */}
            <div className="flex items-center space-1">
              <Icon icon={Calendar} size="xs" />
              <span>{formatDate(content.publishedAt)}</span>
            </div>

            {/* Reading Time */}
            {content.readingTime && (
              <div className="flex items-center space-1">
                <Icon icon={Clock} size="xs" />
                <span>{formatReadingTime(content.readingTime)}</span>
              </div>
            )}
          </div>

          {/* Views */}
          {content.views && (
            <div className="flex items-center space-1">
              <Icon icon={Eye} size="xs" />
              <span>{content.views.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="inline-flex items-center space-1 px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
               >
                <Icon icon={Tag} size="xs" />
                <span>{tag.name}</span>
              </Link>
            ))}
            {content.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{content.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-2">
              {/* Like */}
              {onLike && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onLike(content.id);
                  }}
                  className={cn(
                    "h-8 px-2",
                    content.isLiked && "text-red-500"
                  )}
                >
                  <Icon icon={Heart} size="xs" accent={content.isLiked} />
                  {content.likes && (
                    <span className="ml-1 text-xs">{content.likes}</span>
                  )}
                </Button>
              )}

              {/* Bookmark */}
              {onBookmark && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onBookmark(content.id);
                  }}
                  className={cn(
                    "h-8 px-2",
                    content.isBookmarked && "text-primary"
                  )}
                >
                  <Icon icon={BookmarkSimple} size="xs" accent={content.isBookmarked} />
                </Button>
              )}

              {/* Share */}
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onShare(content.id);
                  }}
                  className="h-8 px-2"
                >
                  <Icon icon={Share} size="xs" />
                </Button>
              )}
            </div>

            {/* Read More Link */}
            <Link
              href={`/articles/${content.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Read more
            </Link>
          </div>
        )}
      </div>
    </article>
  );
};

ArticleCard.displayName = "ArticleCard";

/**
 * Featured Content Hero Component
 * 
 * Hero section with rotating featured content
 */
export const FeaturedContentHero: React.FC<FeaturedContentHeroProps> = ({
  items,
  autoRotate = 5000,
  showDots = true,
  showArrows = true,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || !isAutoRotating || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoRotate);

    return () => clearInterval(interval);
  }, [autoRotate, isAutoRotating, items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoRotating(false);
    setTimeout(() => setIsAutoRotating(true), 10000); // Resume auto-rotation after 10s
  };

  const goToPrevious = () => {
    goToSlide(currentIndex === 0 ? items.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    goToSlide((currentIndex + 1) % items.length);
  };

  if (!items.length) {
    return (
      <div className={cn("h-96 bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">No featured content available</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className={cn("relative h-96 rounded-lg overflow-hidden group", className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentItem.featuredImage ? (
          <img
            src={currentItem.featuredImage}
            alt={currentItem.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60" />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      {/* Content Overlay */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl text-white">
            {/* Category */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                {currentItem.category.name}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {currentItem.title}
            </h1>

            {/* Excerpt */}
            {currentItem.excerpt && (
              <p className="text-lg text-white/90 mb-6 leading-relaxed">
                {currentItem.excerpt}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center space-4 text-white/80 mb-6">
              <div className="flex items-center space-2">
                <Icon icon={User} size="sm" />
                <span>{currentItem.author.name}</span>
              </div>
              <div className="flex items-center space-2">
                <Icon icon={Calendar} size="sm" />
                <span>{new Date(currentItem.publishedAt).toLocaleDateString()}</span>
              </div>
              {currentItem.readingTime && (
                <div className="flex items-center space-2">
                  <Icon icon={Clock} size="sm" />
                  <span>{currentItem.readingTime} min read</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <Link href={`/articles/${currentItem.slug}`}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Read Article
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous featured content"
          >
            <Icon icon={User} size="sm" /> {/* Replace with ChevronLeft when available */}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next featured content"
          >
            <Icon icon={User} size="sm" /> {/* Replace with ChevronRight when available */}
          </Button>
        </>
      )}
      {/* Dots Navigation */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex space-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

FeaturedContentHero.displayName = "FeaturedContentHero";

/**
 * Content List Component
 * 
 * Filterable and sortable list of content with loading states
 */
export const ContentList: React.FC<ContentListProps> = ({
  items,
  state,
  sortBy,
  filters,
  sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'trending', label: 'Trending' },
  ],
  categories = [],
  tags = [],
  onSortChange,
  onFilterChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange?.({ ...filters, search: searchQuery });
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-full mb-4" />
            <div className="flex space-4">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state
  const ErrorState = () => (
    <div className="text-center py-12">
      <Icon icon={Warning} size="xl" className="mx-auto text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Failed to load content
      </h3>
      <p className="text-muted-foreground mb-4">
        There was an error loading the content. Please try again.
      </p>
      <Button onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-12">
      <Icon icon={Article} size="xl" className="mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No content found
      </h3>
      <p className="text-muted-foreground">
        {filters.search
          ? `No results found for "${filters.search}"`
          : 'No content is available at the moment.'
        }
      </p>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters and Controls */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="flex space-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </div>
          </form>

          {/* Sort */}
          {onSortChange && (
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Category Filter */}
          {categories.length > 0 && onFilterChange && (
            <select
              value={filters.category || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  category: e.target.value || undefined,
                })
              }
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Active Filters */}
        {(filters.category || filters.tags?.length || filters.search) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                Search: "{filters.search}"
                <button
                  onClick={() =>
                    onFilterChange?.({ ...filters, search: undefined })
                  }
                  className="ml-2 hover:text-primary/80"
                >
                  <Icon icon={X} size="xs" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                Category: {categories.find(c => c.slug === filters.category)?.name}
                <button
                  onClick={() =>
                    onFilterChange?.({ ...filters, category: undefined })
                  }
                  className="ml-2 hover:text-primary/80"
                >
                  <Icon icon={X} size="xs" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {state === 'loading' && <LoadingSkeleton />}
      {state === 'error' && <ErrorState />}
      {state === 'empty' && <EmptyState />}
      
      {state === 'loaded' && (
        <>
          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ArticleCard
                key={item.id}
                content={item}
                variant="compact"
                showActions={true}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && onLoadMore && (
            <div className="text-center">
              <Button
                onClick={onLoadMore}
                variant="outline"
                disabled={isLoadingMore}
                className="min-w-32"
              >
                {isLoadingMore ? (
                  <>
                    <Icon icon={User} size="sm" className="animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

ContentList.displayName = "ContentList";

/**
 * AI Recommendations Component
 * 
 * AI-powered content recommendations with reasoning
 */
export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  currentContentId,
  userId,
  type = 'related',
  limit = 5,
  showReason = true,
  className,
}) => {
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [state, setState] = useState<ContentState>('loading');

  useEffect(() => {
    const fetchRecommendations = async () => {
      setState('loading');
      try {
        // Call real AI recommendation API
        const response = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId || 'anonymous',
            context: {
              currentArticle: currentContentId,
              type: type || 'related',
              limit: limit || 5
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setRecommendations(data.data);
          setState(data.data.length > 0 ? 'loaded' : 'empty');
        } else {
          throw new Error(data.error || 'No recommendations available');
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setState('error');
        
        // Set fallback data to prevent UI breaking
        setRecommendations([]);
      }
    };

    fetchRecommendations();
  }, [currentContentId, userId, type, limit]);

  const getRecommendationType = () => {
    const types = {
      related: 'Related Articles',
      personalized: 'Recommended for You',
      trending: 'Trending Now',
      similar: 'Similar Content',
    };
    return types[type];
  };

  const getRecommendationReason = (index: number) => {
    const reasons = [
      'Based on your reading history',
      'Similar topics you enjoyed',
      'Popular with similar readers',
      'Trending in your interests',
      'Related to current article',
    ];
    return reasons[index % reasons.length];
  };

  if (state === 'loading') {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-foreground">
          {getRecommendationType()}
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex space-3 animate-pulse">
              <div className="w-16 h-16 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state === 'error' || state === 'empty') {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-foreground">
        {getRecommendationType()}
      </h3>
      <div className="space-y-3">
        {recommendations.slice(0, limit).map((item, index) => (
          <Link
            key={item.id}
            href={`/articles/${item.slug}`}
            className="block group"
           >
            <div className="flex space-3 p-3 rounded-lg hover:bg-accent transition-colors">
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {item.featuredImage ? (
                  <img
                    src={item.featuredImage}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon icon={Article} size="sm" className="text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                  {item.title}
                </h4>
                
                <div className="flex items-center space-2 text-xs text-muted-foreground">
                  <span>{item.author.name}</span>
                  <span>•</span>
                  <span>{item.readingTime} min</span>
                  {item.views && (
                    <>
                      <span>•</span>
                      <span>{item.views.toLocaleString()} views</span>
                    </>
                  )}
                </div>

                {/* AI Reason */}
                {showReason && (
                  <p className="text-xs text-primary/80 mt-1">
                    {getRecommendationReason(index)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

AIRecommendations.displayName = "AIRecommendations"; 