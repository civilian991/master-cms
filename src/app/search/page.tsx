import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { ContentList, ArticleCard } from '@/components/ui/content';
import { ContentServerWrapper } from '@/components/ui/content-server-wrapper';
import { BreadcrumbNavigation } from '@/components/ui/navigation';
import { Icon, MagnifyingGlass, Article, Gear, X } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

// Types for search results
interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
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
  readingTime: number;
  views: number;
  likes: number;
  isBookmarked: boolean;
  isLiked: boolean;
  searchScore?: number;
  highlights?: {
    title?: string;
    excerpt?: string;
    content?: string[];
  };
}

interface SearchFilters {
  query: string;
  category?: string;
  tags: string[];
  author?: string;
  dateRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  sortBy: 'relevance' | 'newest' | 'oldest' | 'popular';
}

// Server-side search function
async function searchContent(searchParams: { [key: string]: string | string[] | undefined }): Promise<{
  results: SearchResult[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  filters: SearchFilters;
  suggestions?: string[];
}> {
  // Extract search parameters
  const query = (searchParams.q as string) || '';
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category as string;
  const tags = Array.isArray(searchParams.tags) ? searchParams.tags : (searchParams.tags ? [searchParams.tags] : []);
  const author = searchParams.author as string;
  const dateRange = (searchParams.dateRange as 'week' | 'month' | 'quarter' | 'year' | 'all') || 'all';
  const sortBy = (searchParams.sortBy as 'relevance' | 'newest' | 'oldest' | 'popular') || 'relevance';
  const limit = 12;

  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    // Build query parameters for the search API call
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category) params.append('categoryId', category);
    if (tags.length > 0) params.append('tagIds', tags.join(','));
    if (author) params.append('authorId', author);
    if (dateRange !== 'all') params.append('dateRange', dateRange);
    
    // Map sort options to API parameters
    const sortMapping = {
      'relevance': 'score_desc',
      'newest': 'publishedAt_desc',
      'oldest': 'publishedAt_asc',
      'popular': 'views_desc'
    };
    params.append('sort', sortMapping[sortBy as keyof typeof sortMapping] || 'score_desc');
    
    const response = await fetch(`${config.domain}/api/content/search?${params}`, {
      cache: 'no-cache',
      next: { revalidate: 60 } // 1 minute for search results
    });

    if (!response.ok) {
      throw new Error(`Search API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid search API response format');
    }

    const { results, totalCount, totalPages, currentPage, suggestions } = result.data;
    const hasMore = currentPage < totalPages;

    return {
      results: results || [],
      totalCount: totalCount || 0,
      currentPage: currentPage || 1,
      totalPages: totalPages || 0,
      hasMore,
      filters: { query, category, tags, author, dateRange, sortBy },
      suggestions: suggestions || []
    };
  } catch (error) {
    console.error('Error performing search:', error);
    
    // Fallback to mock data for development/demo purposes
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'The Future of AI in Media Production',
        excerpt: 'Exploring how artificial intelligence is revolutionizing content creation and media workflows.',
        slug: 'future-ai-media-production',
        publishedAt: '2024-01-15T10:00:00Z',
        author: { id: '1', name: 'Sarah Al-Ahmad', avatar: '/avatars/sarah.jpg' },
        category: { id: '1', name: 'Technology', slug: 'technology' },
        tags: [
          { id: '1', name: 'AI', slug: 'ai' },
          { id: '2', name: 'Media', slug: 'media' },
          { id: '3', name: 'Innovation', slug: 'innovation' }
        ],
        featuredImage: '/images/articles/ai-media.jpg',
        readingTime: 8,
        views: 2450,
        likes: 127,
        isBookmarked: false,
        isLiked: false,
        searchScore: 0.95,
        highlights: {
          title: 'The Future of <mark>AI</mark> in Media Production',
          excerpt: 'Exploring how <mark>artificial intelligence</mark> is revolutionizing content creation',
          content: ['<mark>AI</mark> systems can now generate compelling video content']
        }
      },
      {
        id: '7',
        title: 'Machine Learning in Healthcare: Breakthrough Applications',
        excerpt: 'How machine learning is transforming diagnosis, treatment, and patient care.',
        slug: 'machine-learning-healthcare',
        publishedAt: '2024-01-09T15:30:00Z',
        author: { id: '7', name: 'Dr. Amina Hassan', avatar: '/avatars/amina.jpg' },
        category: { id: '1', name: 'Technology', slug: 'technology' },
        tags: [
          { id: '1', name: 'AI', slug: 'ai' },
          { id: '16', name: 'Healthcare', slug: 'healthcare' },
          { id: '17', name: 'Machine Learning', slug: 'machine-learning' }
        ],
        featuredImage: '/images/articles/ml-healthcare.jpg',
        readingTime: 12,
        views: 1876,
        likes: 203,
        isBookmarked: true,
        isLiked: false,
        searchScore: 0.88,
        highlights: {
          title: '<mark>Machine Learning</mark> in Healthcare: Breakthrough Applications',
          excerpt: 'How <mark>machine learning</mark> is transforming diagnosis, treatment',
        }
      },
      {
        id: '2',
        title: 'Economic Outlook 2024: Trends and Predictions',
        excerpt: 'Comprehensive analysis of economic trends shaping the business landscape in 2024.',
        slug: 'economic-outlook-2024',
        publishedAt: '2024-01-14T14:30:00Z',
        author: { id: '2', name: 'Ahmed Hassan', avatar: '/avatars/ahmed.jpg' },
        category: { id: '2', name: 'Economy', slug: 'economy' },
        tags: [
          { id: '4', name: 'Economy', slug: 'economy' },
          { id: '5', name: 'Business', slug: 'business' },
          { id: '6', name: 'Trends', slug: 'trends' }
        ],
        readingTime: 12,
        views: 3210,
        likes: 189,
        isBookmarked: true,
        isLiked: false,
        searchScore: 0.72,
      },
    ];

    // Apply filtering based on search query
    let filteredResults = mockResults;
    
    if (query) {
      filteredResults = mockResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        result.tags?.some(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (category) {
      filteredResults = filteredResults.filter(result => result.category.slug === category);
    }
    
    if (tags.length > 0) {
      filteredResults = filteredResults.filter(result =>
        result.tags?.some(tag => tags.includes(tag.slug))
      );
    }
    
    if (author) {
      filteredResults = filteredResults.filter(result => 
        result.author.name.toLowerCase().includes(author.toLowerCase())
      );
    }

    // Apply date filtering
    if (dateRange !== 'all') {
      const now = new Date();
      const dateThreshold = new Date();
      
      switch (dateRange) {
        case 'week':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateThreshold.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          dateThreshold.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          dateThreshold.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredResults = filteredResults.filter(result => 
        new Date(result.publishedAt) >= dateThreshold
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filteredResults.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'oldest':
        filteredResults.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        break;
      case 'popular':
        filteredResults.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default: // relevance
        filteredResults.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);
    const hasMore = filteredResults.length > startIndex + limit;
    const totalPages = Math.ceil(filteredResults.length / limit);

    // Generate search suggestions for empty results
    const suggestions = filteredResults.length === 0 && query ? [
      'artificial intelligence',
      'machine learning',
      'business strategy',
      'economic trends',
      'innovation technology'
    ] : undefined;

    return {
      results: paginatedResults,
      totalCount: filteredResults.length,
      currentPage: page,
      totalPages,
      hasMore,
      filters: {
        query,
        category,
        tags,
        author,
        dateRange: dateRange as any,
        sortBy: sortBy as any,
      },
      suggestions,
    };
  }
}

// Get filter options
async function getFilterOptions() {
  // TODO: Replace with actual API calls
  return {
    categories: [
      { id: '1', name: 'Technology', slug: 'technology' },
      { id: '2', name: 'Economy', slug: 'economy' },
      { id: '3', name: 'Business', slug: 'business' },
      { id: '4', name: 'Culture', slug: 'culture' },
    ],
    popularTags: [
      { id: '1', name: 'AI', slug: 'ai' },
      { id: '5', name: 'Business', slug: 'business' },
      { id: '3', name: 'Innovation', slug: 'innovation' },
      { id: '4', name: 'Economy', slug: 'economy' },
      { id: '16', name: 'Healthcare', slug: 'healthcare' },
    ],
    authors: [
      { id: '1', name: 'Sarah Al-Ahmad' },
      { id: '2', name: 'Ahmed Hassan' },
      { id: '3', name: 'Maria Rodriguez' },
      { id: '7', name: 'Dr. Amina Hassan' },
    ],
  };
}

// Loading component
function SearchLoading() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="flex space-4">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

// Search filters component
function SearchFilters({ 
  filters, 
  filterOptions,
  onFilterChange 
}: { 
  filters: SearchFilters;
  filterOptions: any;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({ category: '', tags: [], author: '', dateRange: 'all' })}
        >
          <Icon icon={X} size="sm" className="mr-1" />
          Clear Filters
        </Button>
      </div>
      
      <Grid cols={1} responsive={{ md: 2, lg: 4 }} gap="md">
        <GridItem>
          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map((category: any) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </GridItem>
        
        <GridItem>
          <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value as any })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="quarter">Past 3 Months</option>
            <option value="year">Past Year</option>
          </select>
        </GridItem>
        
        <GridItem>
          <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="relevance">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </GridItem>
        
        <GridItem>
          <label className="block text-sm font-medium text-foreground mb-2">Popular Tags</label>
          <div className="flex flex-wrap gap-1">
            {filterOptions.popularTags.map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => {
                  const newTags = filters.tags.includes(tag.slug)
                    ? filters.tags.filter(t => t !== tag.slug)
                    : [...filters.tags, tag.slug];
                  onFilterChange({ tags: newTags });
                }}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  filters.tags.includes(tag.slug)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </GridItem>
      </Grid>
    </div>
  );
}

// Search result component with highlighting
function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <article className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {result.featuredImage && (
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
            <img
              src={result.featuredImage}
              alt={result.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <Link href={`/articles/${result.slug}`} className="block">
            <h3 
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2"
              dangerouslySetInnerHTML={{ 
                __html: result.highlights?.title || result.title 
              }}
            />
          </Link>
          
          <div 
            className="text-muted-foreground text-sm mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: result.highlights?.excerpt || result.excerpt 
            }}
          />
          
          {result.highlights?.content && (
            <div className="mb-3">
              {result.highlights.content.map((snippet, index) => (
                <div 
                  key={index}
                  className="text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-1"
                  dangerouslySetInnerHTML={{ __html: `...${snippet}...` }}
                />
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>{result.author.name}</span>
              <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
              <Link
                href={`/articles?category=${result.category.slug}`}
                className="text-primary hover:underline"
               >
                {result.category.name}
              </Link>
            </div>
            
            {result.searchScore && (
              <div className="text-xs text-muted-foreground">
                {Math.round(result.searchScore * 100)}% match
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// Main Search Page Component
export default async function SearchPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { 
    results, 
    totalCount, 
    currentPage, 
    totalPages, 
    hasMore, 
    filters,
    suggestions 
  } = await searchContent(searchParams);
  
  const filterOptions = await getFilterOptions();
  const config = siteConfig.getConfig();

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Search', isActive: true },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Navigation */}
      <Section background="muted" spacing={{ top: 'sm', bottom: 'sm' }}>
        <Container>
          <BreadcrumbNavigation items={breadcrumbItems} />
        </Container>
      </Section>
      {/* Search Header */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Icon icon={MagnifyingGlass} size="lg" className="text-primary" />
              <h1 className="text-4xl font-bold text-foreground">
                Search Results
              </h1>
            </div>
            
            {filters.query ? (
              <p className="text-lg text-muted-foreground">
                {totalCount} result{totalCount !== 1 ? 's' : ''} for &quot;<strong>{filters.query}</strong>&quot;
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">
                Use the search filters below to find relevant content
              </p>
            )}
          </div>
        </Container>
      </Section>
      {/* Search Content */}
      <Section background="default" spacing={{ top: 'none', bottom: 'xl' }}>
        <Container>
          <SearchFilters
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={() => {}} // Client-side handling will be added
          />

          <Suspense fallback={<SearchLoading />}>
            {results.length > 0 ? (
              <div className="space-y-6">
                {results.map(result => (
                  <SearchResultCard key={result.id} result={result} />
                ))}
              </div>
            ) : filters.query ? (
              <div className="text-center py-12">
                <Icon icon={MagnifyingGlass} size="2xl" className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No results found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search terms or filters
                </p>
                
                {suggestions && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Try searching for:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion, index) => (
                        <Link
                          key={index}
                          href={`/search?q=${encodeURIComponent(suggestion)}`}
                          className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                         >
                          {suggestion}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon icon={MagnifyingGlass} size="2xl" className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Start Your Search
                </h3>
                <p className="text-muted-foreground">
                  Enter a search term or use the filters above to find content
                </p>
              </div>
            )}
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-4 mt-12">
              <div className="flex items-center space-2">
                {currentPage > 1 && (
                  <a 
                    href={`/search?${new URLSearchParams({
                      ...Object.fromEntries(Object.entries(searchParams).filter(([k, v]) => k !== 'page' && v)),
                      page: String(currentPage - 1)
                    })}`}
                    className="px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Previous
                  </a>
                )}
                
                <div className="flex items-center space-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    
                    return (
                      <a
                        key={pageNum}
                        href={`/search?${new URLSearchParams({
                          ...Object.fromEntries(Object.entries(searchParams).filter(([k, v]) => k !== 'page' && v)),
                          page: String(pageNum)
                        })}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-border hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {pageNum}
                      </a>
                    );
                  })}
                </div>

                {currentPage < totalPages && (
                  <a 
                    href={`/search?${new URLSearchParams({
                      ...Object.fromEntries(Object.entries(searchParams).filter(([k, v]) => k !== 'page' && v)),
                      page: String(currentPage + 1)
                    })}`}
                    className="px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  const config = siteConfig.getConfig();
  const query = searchParams.q as string;
  
  const title = query ? `Search: ${query}` : 'Search';
  const description = query 
    ? `Search results for "${query}" - find relevant articles and content.`
    : 'Search for articles, insights, and content across all topics.';

  return {
    title: `${title} | ${config.name}`,
    description,
    openGraph: {
      title: `${title} | ${config.name}`,
      description,
      type: 'website',
    },
  };
} 