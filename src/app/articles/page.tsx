import React, { Suspense } from 'react';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { ContentList, ArticleCard } from '@/components/ui/content';
import { ContentServerWrapper } from '@/components/ui/content-server-wrapper';
import { PrimaryNavigation, BreadcrumbNavigation } from '@/components/ui/navigation';
import { Icon, Article, MagnifyingGlass, CaretUp } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

// Server-side data fetching function
async function getArticles(searchParams: { [key: string]: string | string[] | undefined }) {
  // Extract search parameters for filtering and pagination
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category as string;
  const tag = searchParams.tag as string;
  const search = searchParams.search as string;
  const sort = (searchParams.sort as string) || 'newest';
  const limit = 12;

  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    // Build query parameters for the API call
    const params = new URLSearchParams({
      status: 'PUBLISHED',
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category) params.append('categoryId', category);
    if (tag) params.append('tagIds', tag);
    if (search) params.append('search', search);
    
    // Map sort options to API parameters
    const sortMapping = {
      'newest': 'publishedAt_desc',
      'oldest': 'publishedAt_asc', 
      'popular': 'views_desc',
      'trending': 'likes_desc'
    };
    params.append('sort', sortMapping[sort as keyof typeof sortMapping] || 'publishedAt_desc');
    
    const response = await fetch(`${config.domain}/api/content/articles?${params}`, {
      cache: 'no-cache',
      next: { revalidate: 300 } // 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response format');
    }

    const { articles, totalCount, totalPages, currentPage } = result.data;
    const hasMore = currentPage < totalPages;

    return {
      articles: articles || [],
      hasMore,
      totalPages: totalPages || 0,
      currentPage: currentPage || 1,
      totalCount: totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching articles from API:', error);
    
    // Fallback to mock data for development/demo purposes
    const mockArticles = [
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
      },
      {
        id: '3',
        title: 'Sustainable Business Practices in the Digital Age',
        excerpt: 'How companies are integrating sustainability into their digital transformation strategies.',
        slug: 'sustainable-business-digital-age',
        publishedAt: '2024-01-13T09:15:00Z',
        author: { id: '3', name: 'Maria Rodriguez', avatar: '/avatars/maria.jpg' },
        category: { id: '3', name: 'Business', slug: 'business' },
        tags: [
          { id: '5', name: 'Business', slug: 'business' },
          { id: '7', name: 'Sustainability', slug: 'sustainability' },
          { id: '8', name: 'Digital', slug: 'digital' }
        ],
        readingTime: 10,
        views: 1875,
        likes: 94,
        isBookmarked: false,
        isLiked: true,
      },
      {
        id: '4',
        title: 'Cultural Innovation in Modern Architecture',
        excerpt: 'Exploring how traditional cultural elements are being reimagined in contemporary design.',
        slug: 'cultural-innovation-architecture',
        publishedAt: '2024-01-12T16:45:00Z',
        author: { id: '4', name: 'Khalid Al-Mansouri', avatar: '/avatars/khalid.jpg' },
        category: { id: '4', name: 'Culture', slug: 'culture' },
        tags: [
          { id: '9', name: 'Culture', slug: 'culture' },
          { id: '10', name: 'Architecture', slug: 'architecture' },
          { id: '11', name: 'Design', slug: 'design' }
        ],
        readingTime: 7,
        views: 1432,
        likes: 67,
        isBookmarked: false,
        isLiked: false,
      },
      {
        id: '5',
        title: 'The Rise of Remote Work: A Global Perspective',
        excerpt: 'Analyzing the long-term impacts of remote work on global business practices.',
        slug: 'rise-remote-work-global',
        publishedAt: '2024-01-11T11:20:00Z',
        author: { id: '5', name: 'Fatima Al-Zahra', avatar: '/avatars/fatima.jpg' },
        category: { id: '3', name: 'Business', slug: 'business' },
        tags: [
          { id: '5', name: 'Business', slug: 'business' },
          { id: '12', name: 'Remote Work', slug: 'remote-work' },
          { id: '13', name: 'Global', slug: 'global' }
        ],
        readingTime: 9,
        views: 2103,
        likes: 156,
        isBookmarked: true,
        isLiked: true,
      },
      {
        id: '6',
        title: 'Investment Strategies for Emerging Markets',
        excerpt: 'Understanding opportunities and risks in developing market economies.',
        slug: 'investment-strategies-emerging-markets',
        publishedAt: '2024-01-10T13:15:00Z',
        author: { id: '6', name: 'Omar Yousef', avatar: '/avatars/omar.jpg' },
        category: { id: '2', name: 'Economy', slug: 'economy' },
        tags: [
          { id: '4', name: 'Economy', slug: 'economy' },
          { id: '14', name: 'Investment', slug: 'investment' },
          { id: '15', name: 'Markets', slug: 'markets' }
        ],
        readingTime: 11,
        views: 1789,
        likes: 73,
        isBookmarked: false,
        isLiked: false,
      },
    ];

    // Apply filtering logic
    let filteredArticles = mockArticles;
    
    if (category) {
      filteredArticles = filteredArticles.filter(article => 
        article.category.slug === category
      );
    }
    
    if (tag) {
      filteredArticles = filteredArticles.filter(article =>
        article.tags?.some(t => t.slug === tag)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        filteredArticles.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        break;
      case 'popular':
        filteredArticles.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'trending':
        filteredArticles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default: // newest
        filteredArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + limit);
    const hasMore = filteredArticles.length > startIndex + limit;
    const totalPages = Math.ceil(filteredArticles.length / limit);

    return {
      articles: paginatedArticles,
      hasMore,
      totalPages,
      currentPage: page,
      totalCount: filteredArticles.length,
    };
  }
}

// Get available categories and tags for filtering
async function getFilterOptions() {
  try {
    const config = siteConfig.getConfig();
    
    // Fetch categories and tags in parallel
    const [categoriesResponse, tagsResponse] = await Promise.all([
      fetch(`${config.domain}/api/content/categories`, {
        cache: 'force-cache',
        next: { revalidate: 3600 } // 1 hour
      }),
      fetch(`${config.domain}/api/content/tags`, {
        cache: 'force-cache',
        next: { revalidate: 3600 } // 1 hour
      })
    ]);

    let categories = [];
    let tags = [];

    if (categoriesResponse.ok) {
      const categoriesResult = await categoriesResponse.json();
      categories = categoriesResult.success ? categoriesResult.data : [];
    }

    if (tagsResponse.ok) {
      const tagsResult = await tagsResponse.json();
      tags = tagsResult.success ? tagsResult.data : [];
    }

    return { categories, tags };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    
    // Fallback to default options
    return {
      categories: [
        { id: '1', name: 'Technology', slug: 'technology' },
        { id: '2', name: 'Economy', slug: 'economy' },
        { id: '3', name: 'Business', slug: 'business' },
        { id: '4', name: 'Culture', slug: 'culture' },
        { id: '5', name: 'Politics', slug: 'politics' },
        { id: '6', name: 'Sports', slug: 'sports' },
      ],
      tags: [
        { id: '1', name: 'AI', slug: 'ai' },
        { id: '2', name: 'Media', slug: 'media' },
        { id: '3', name: 'Innovation', slug: 'innovation' },
        { id: '4', name: 'Economy', slug: 'economy' },
        { id: '5', name: 'Business', slug: 'business' },
        { id: '6', name: 'Trends', slug: 'trends' },
        { id: '7', name: 'Sustainability', slug: 'sustainability' },
        { id: '8', name: 'Digital', slug: 'digital' },
      ],
    };
  }
}

// Loading component for suspense
function ArticlesLoading() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3" />
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

// Main Articles Page Component
export default async function ArticlesPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { articles, hasMore, totalPages, currentPage, totalCount } = await getArticles(searchParams);
  const { categories, tags } = await getFilterOptions();
  const config = siteConfig.getConfig();

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Articles', isActive: true },
  ];

  // Current filters for state
  const currentFilters = {
    category: searchParams.category as string,
    search: searchParams.search as string,
    tags: searchParams.tag ? [searchParams.tag as string] : [],
  };

  const currentSort = (searchParams.sort as string) || 'newest';

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Navigation */}
      <Section background="muted" spacing={{ top: 'sm', bottom: 'sm' }}>
        <Container>
          <BreadcrumbNavigation items={breadcrumbItems} />
        </Container>
      </Section>

      {/* Page Header */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              All Articles
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our comprehensive collection of articles covering technology, business, culture, and more.
            </p>
          </div>

          {/* Filter Summary */}
          {(currentFilters.category || currentFilters.search || currentFilters.tags.length > 0) && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-2">
                  <Icon icon={MagnifyingGlass} size="sm" className="text-accent" />
                  <span className="font-medium text-foreground">Active Filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {currentFilters.category && (
                      <span className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
                        Category: {categories.find((c: any) => c.slug === currentFilters.category)?.name}
                      </span>
                    )}
                    {currentFilters.search && (
                      <span className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
                        Search: &quot;{currentFilters.search}&quot;
                      </span>
                    )}
                    {currentFilters.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
                        Tag: {tags.find((t: any) => t.slug === tag)?.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {totalCount} article{totalCount !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* Articles Content */}
      <Section background="default" spacing={{ top: 'none', bottom: 'xl' }}>
        <Container>
          <Suspense fallback={<ArticlesLoading />}>
            <ContentServerWrapper
              items={articles}
              state={articles.length > 0 ? 'loaded' : 'empty'}
              sortBy={currentSort as any}
              filters={currentFilters}
              sortOptions={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'trending', label: 'Most Liked' },
              ]}
              categories={categories}
              tags={tags}
              hasMore={hasMore}
              isLoadingMore={false}
            />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-4 mt-12">
              <div className="flex items-center space-2">
                {currentPage > 1 && (
                  <a 
                    href={`/articles?${new URLSearchParams({
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
                        href={`/articles?${new URLSearchParams({
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
                    href={`/articles?${new URLSearchParams({
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
}) {
  const config = siteConfig.getConfig();
  const category = searchParams.category as string;
  const search = searchParams.search as string;

  let title = 'Articles';
  let description = 'Explore our comprehensive collection of articles covering technology, business, culture, and more.';

  if (category) {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} Articles`;
    description = `Discover the latest articles in ${category} from our expert contributors.`;
  }

  if (search) {
    title = `Search Results for "${search}"`;
    description = `Articles and content related to "${search}".`;
  }

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