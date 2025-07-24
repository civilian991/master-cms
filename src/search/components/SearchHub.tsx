'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import {
  Search,
  Mic,
  Camera,
  Filter,
  SortAsc,
  Grid,
  List,
  Loader2,
  X,
  Star,
  Clock,
  TrendingUp,
  Eye,
  Share2,
  Download,
  Bookmark,
  ThumbsUp,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Target,
} from 'lucide-react';

import {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchFilter,
  SearchFacet,
  SearchRecommendation,
  SearchScope,
  SearchMode,
  SortOrder,
  SearchHubProps,
  VoiceSearchResult,
  VisualSearchResult,
  Suggestion,
} from '../types/search.types';

import { useSearch } from '../hooks/useSearch';
import { useAutoComplete } from '../hooks/useAutocomplete';
import { useRecommendations } from '../hooks/useRecommendations';
import { useTrending } from '../hooks/useTrending';
import { SearchBar } from './SearchBar';

export function SearchHub({
  config = {},
  initialQuery = '',
  initialFilters = [],
  onSearch,
  onResultClick,
  onFilterChange,
  onAnalytics,
  className = '',
  children,
}: SearchHubProps) {
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedScope, setSelectedScope] = useState<SearchScope>('all');
  const [searchMode, setSearchMode] = useState<SearchMode>('instant');
  const [sortOrder, setSortOrder] = useState<SortOrder>('relevance');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilter[]>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  // Search hook
  const {
    results,
    facets,
    suggestions,
    recommendations,
    metadata,
    isLoading,
    error,
    search: performSearch,
    clearResults,
  } = useSearch({
    autoSearch: true,
    debounceTime: 300,
    caching: true,
    analytics: true,
    personalization: true,
  });

  // Auto-complete hook
  const {
    suggestions: autoCompleteSuggestions,
    isLoading: isSuggestionsLoading,
    getSuggestions,
  } = useAutoComplete({
    minLength: 2,
    maxSuggestions: 8,
    debounceTime: 200,
  });

  // Recommendations hook
  const {
    recommendations: personalizedRecs,
    isLoading: isRecsLoading,
    getRecommendations,
  } = useRecommendations({
    realTime: true,
    personalization: true,
    diversity: 0.3,
  });

  // Trending hook
  const {
    trending,
    popular,
    getTrending,
  } = useTrending();

  // Memoized search query
  const searchQuery = useMemo((): SearchQuery => ({
    query,
    scope: selectedScope === 'all' ? undefined : [selectedScope],
    mode: searchMode,
    filters: appliedFilters,
    sort: [{ field: sortOrder === 'relevance' ? 'relevance' : sortOrder, order: sortOrder === 'relevance' ? 'desc' : 'asc' }],
    pagination: { page: currentPage, size: 20 },
    highlight: { enabled: true },
    suggestions: true,
    analytics: true,
    personalization: true,
  }), [query, selectedScope, searchMode, appliedFilters, sortOrder, currentPage]);

  // Search execution
  const executeSearch = useCallback(async (searchQuery: SearchQuery) => {
    try {
      await performSearch(searchQuery);
      onSearch?.(searchQuery);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [performSearch, onSearch]);

  // Effects
  useEffect(() => {
    if (query.trim()) {
      executeSearch(searchQuery);
    } else {
      clearResults();
    }
  }, [searchQuery, executeSearch, clearResults]);

  // Load trending and popular content on mount
  useEffect(() => {
    getTrending();
    getRecommendations('trending');
  }, [getTrending, getRecommendations]);

  // Handlers
  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setCurrentPage(1);
  }, []);

  const handleVoiceResult = useCallback((result: VoiceSearchResult) => {
    if (result.finalResult && result.transcript) {
      setQuery(result.transcript);
      setCurrentPage(1);
    }
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    // Handle visual search
    console.log('Visual search with file:', file);
  }, []);

  const handleResultClick = useCallback((result: SearchResult, index: number) => {
    onResultClick?.(result);
    
    // Track click analytics
    onAnalytics?.({
      queryId: metadata?.searchTime?.toString() || '',
      sessionId: 'session-' + Date.now(),
      timestamp: new Date(),
      query,
      resultsCount: metadata?.totalResults || 0,
      clickedResults: [result.id],
      filters: appliedFilters,
      intent: 'unknown',
      userSegment: 'guest',
    });
  }, [onResultClick, onAnalytics, metadata, query, appliedFilters]);

  const handleFilterChange = useCallback((filters: SearchFilter[]) => {
    setAppliedFilters(filters);
    setCurrentPage(1);
    onFilterChange?.(filters);
  }, [onFilterChange]);

  const handleScopeChange = useCallback((scope: string) => {
    setSelectedScope(scope as SearchScope);
    setCurrentPage(1);
  }, []);

  const handleModeChange = useCallback((mode: string) => {
    setSearchMode(mode as SearchMode);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortOrder(sort as SortOrder);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setAppliedFilters([]);
    setCurrentPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  // Content when no search is performed
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Discover Amazing Content</h3>
        <p className="text-muted-foreground mb-6">
          Start typing to search, or explore trending content and personalized recommendations below.
        </p>
        
        {/* Trending Queries */}
        {trending.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending Now
            </h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {trending.slice(0, 6).map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(item.query)}
                  className="text-sm"
                >
                  {item.query}
                  <TrendingUp className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Content */}
        {popular.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center justify-center">
              <Star className="w-4 h-4 mr-2" />
              Popular Content
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {popular.slice(0, 4).map((item, index) => (
                <Card key={index} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h5 className="font-medium text-sm">{item.title}</h5>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Results grid/list view
  const renderResults = () => {
    if (!results.length) {
      return (
        <div className="text-center py-8">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {results.map((result, index) => (
          <SearchResultCard
            key={result.id}
            result={result}
            layout={layout}
            onResultClick={() => handleResultClick(result, index)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Search Everything</h1>
            <p className="text-muted-foreground">
              Discover content with AI-powered search, voice commands, and visual recognition
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar
              placeholder="Search articles, media, users, and more..."
              initialValue={query}
              autoComplete={true}
              voiceSearch={true}
              visualSearch={true}
              onSearch={handleSearch}
              onSuggestionClick={handleSuggestionClick}
              onVoiceResult={handleVoiceResult}
              onImageUpload={handleImageUpload}
              isLoading={isLoading}
              className="mb-4"
            />

            {/* Search Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* Scope Selection */}
              <Select value={selectedScope} onValueChange={handleScopeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="articles">Articles</SelectItem>
                  <SelectItem value="pages">Pages</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Mode */}
              <Select value={searchMode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Search Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Instant
                    </div>
                  </SelectItem>
                  <SelectItem value="semantic">
                    <div className="flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      Semantic
                    </div>
                  </SelectItem>
                  <SelectItem value="fuzzy">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Fuzzy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {appliedFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {appliedFilters.length}
                  </Badge>
                )}
              </Button>

              {/* Layout Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={layout === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={layout === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Applied Filters */}
            {appliedFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {appliedFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {filter.field}: {filter.value}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        const newFilters = appliedFilters.filter((_, i) => i !== index);
                        handleFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {showFilters && facets.length > 0 && (
            <div className="w-64 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {facets.map((facet) => (
                    <div key={facet.field}>
                      <h4 className="font-medium text-sm mb-2">{facet.label}</h4>
                      <div className="space-y-1">
                        {facet.values.slice(0, 5).map((value) => (
                          <label key={value.value} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={value.selected}
                              onChange={() => {
                                const newFilters = value.selected
                                  ? appliedFilters.filter(f => !(f.field === facet.field && f.value === value.value))
                                  : [...appliedFilters, { field: facet.field, type: 'checkbox', value: value.value }];
                                handleFilterChange(newFilters);
                              }}
                              className="rounded"
                            />
                            <span className="flex-1">{value.label}</span>
                            <span className="text-muted-foreground">({value.count})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Results Area */}
          <div className="flex-1">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Searching...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">Search Error</div>
                <p className="text-muted-foreground">{error}</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && !error && (
              <>
                {query.trim() ? (
                  <div>
                    {/* Results Header */}
                    {metadata && (
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          {metadata.totalResults.toLocaleString()} results found in {metadata.searchTime}ms
                        </div>
                        {recommendations.length > 0 && (
                          <Button variant="ghost" size="sm">
                            <Sparkles className="w-4 h-4 mr-1" />
                            AI Suggestions
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Search Results */}
                    {renderResults()}

                    {/* Load More */}
                    {metadata && currentPage < metadata.totalPages && (
                      <div className="text-center mt-8">
                        <Button onClick={handleLoadMore} disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More Results'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                      <div className="mt-12">
                        <Separator className="mb-6" />
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2" />
                          You might also like
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {recommendations.slice(0, 6).map((rec, index) => (
                            <RecommendationCard
                              key={rec.id}
                              recommendation={rec}
                              onItemClick={handleResultClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  renderEmptyState()
                )}
              </>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// Helper Components
function SearchResultCard({
  result,
  layout,
  onResultClick,
}: {
  result: SearchResult;
  layout: 'grid' | 'list';
  onResultClick: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onResultClick}>
      <CardContent className={`p-4 ${layout === 'list' ? 'flex space-x-4' : ''}`}>
        {result.image && (
          <div className={`${layout === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full h-48 mb-4'} bg-muted rounded-lg overflow-hidden`}>
            <img 
              src={result.image} 
              alt={result.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                {result.title}
              </h3>
              <p className="text-xs text-muted-foreground">{result.type}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-xs">{result.relevance.toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {result.description}
          </p>
          
          {result.tags && (
            <div className="flex flex-wrap gap-1 mb-3">
              {result.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              {result.publishedAt && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(result.publishedAt).toLocaleDateString()}
                </div>
              )}
              {result.author && (
                <span>by {result.author}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Eye className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Share2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Bookmark className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({
  recommendation,
  onItemClick,
}: {
  recommendation: SearchRecommendation;
  onItemClick: (result: SearchResult, index: number) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
          {recommendation.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{recommendation.description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendation.items.slice(0, 3).map((item, index) => (
          <div
            key={item.id}
            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
            onClick={() => onItemClick(item, index)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default SearchHub; 