import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { ContentList, ArticleCard } from '@/components/ui/content';
import { ContentServerWrapper } from '@/components/ui/content-server-wrapper';
import { BreadcrumbNavigation } from '@/components/ui/navigation';
import { Icon, Tag, Article, MagnifyingGlass } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

// Types for tag data
interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articleCount: number;
}

interface Article {
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
}

// Server-side function to fetch tag by slug
async function getTag(slug: string): Promise<Tag | null> {
  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    const response = await fetch(`${config.domain}/api/content/tags/${slug}`, {
      cache: 'force-cache',
      next: { revalidate: 1800 } // 30 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Tag not found
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response format');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching tag:', error);
    
    // Fallback to mock data for development/demo purposes
    const mockTags: Record<string, Tag> = {
      'ai': {
        id: '1',
        name: 'AI',
        slug: 'ai',
        description: 'Artificial Intelligence, machine learning, and automation technologies.',
        color: '#3B82F6',
        articleCount: 12
      },
      'business': {
        id: '5',
        name: 'Business',
        slug: 'business',
        description: 'Business strategies, entrepreneurship, and corporate insights.',
        color: '#10B981',
        articleCount: 24
      },
      'innovation': {
        id: '3',
        name: 'Innovation',
        slug: 'innovation',
        description: 'Breakthrough technologies and innovative solutions.',
        color: '#F59E0B',
        articleCount: 18
      },
      'economy': {
        id: '4',
        name: 'Economy',
        slug: 'economy',
        description: 'Economic trends, market analysis, and financial insights.',
        color: '#EF4444',
        articleCount: 15
      },
      'sustainability': {
        id: '7',
        name: 'Sustainability',
        slug: 'sustainability',
        description: 'Environmental sustainability and green business practices.',
        color: '#22C55E',
        articleCount: 9
      },
      'healthcare': {
        id: '16',
        name: 'Healthcare',
        slug: 'healthcare',
        description: 'Medical technology, healthcare innovation, and patient care.',
        color: '#8B5CF6',
        articleCount: 7
      }
    };

    return mockTags[slug] || null;
  }
}

// Server-side function to fetch articles with tag
async function getTagArticles(
  tagSlug: string,
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<{
  articles: Article[];
  hasMore: boolean;
  totalPages: number;
  currentPage: number;
  totalCount: number;
}> {
  // Extract search parameters
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category as string;
  const sort = (searchParams.sort as string) || 'newest';
  const limit = 12;

  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    // Build query parameters for the API call
    const params = new URLSearchParams({
      status: 'PUBLISHED',
      tagSlug: tagSlug,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category) params.append('categorySlug', category);
    
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
    console.error('Error fetching tag articles:', error);
    
    // Fallback to mock data for development/demo purposes
    const mockArticles: Article[] = [
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
      },
    ].filter(article => article.tags?.some(tag => tag.slug === tagSlug));

    // Apply category filtering if specified
    let filteredArticles = mockArticles;
    
    if (category) {
      filteredArticles = filteredArticles.filter(article => 
        article.category.slug === category
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

// Get related tags
async function getRelatedTags(tagSlug: string): Promise<Tag[]> {
  // TODO: Replace with actual API call using AI-powered recommendations
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock related tags
    const relatedTagsMap: Record<string, Tag[]> = {
      'ai': [
        { id: '17', name: 'Machine Learning', slug: 'machine-learning', articleCount: 8 },
        { id: '18', name: 'Automation', slug: 'automation', articleCount: 6 },
        { id: '3', name: 'Innovation', slug: 'innovation', articleCount: 18 }
      ],
      'business': [
        { id: '4', name: 'Economy', slug: 'economy', articleCount: 15 },
        { id: '19', name: 'Strategy', slug: 'strategy', articleCount: 11 },
        { id: '20', name: 'Leadership', slug: 'leadership', articleCount: 9 }
      ],
      'sustainability': [
        { id: '21', name: 'Green Tech', slug: 'green-tech', articleCount: 5 },
        { id: '22', name: 'Climate', slug: 'climate', articleCount: 7 },
        { id: '5', name: 'Business', slug: 'business', articleCount: 24 }
      ]
    };

    return relatedTagsMap[tagSlug] || [];
  } catch (error) {
    console.error('Error fetching related tags:', error);
    return [];
  }
}

// Loading component
function TagLoading() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-8" />
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

// Related tags component
function RelatedTags({ relatedTags }: { relatedTags: Tag[] }) {
  if (relatedTags.length === 0) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Related Tags</h3>
      <div className="flex flex-wrap gap-2">
        {relatedTags.map(tag => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="inline-flex items-center px-3 py-1 bg-background border border-border rounded-full text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
           >
            <Icon icon={Tag} size="xs" className="mr-1" />
            {tag.name}
            <span className="ml-1 text-xs text-muted-foreground">({tag.articleCount})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Main Tag Page Component
export default async function TagPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tag = await getTag(params.slug);
  
  if (!tag) {
    notFound();
  }

  const { articles, hasMore, totalPages, currentPage, totalCount } = await getTagArticles(
    params.slug,
    searchParams
  );
  const relatedTags = await getRelatedTags(params.slug);
  const config = siteConfig.getConfig();

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: `#${tag.name}`, isActive: true },
  ];

  // Current filters
  const currentFilters = {
    tags: [params.slug],
    search: searchParams.search as string,
    category: searchParams.category as string,
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

      {/* Tag Header */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Icon icon={Tag} size="lg" className="text-primary" />
              <h1 className="text-4xl font-bold text-foreground">
                #{tag.name}
              </h1>
            </div>
            
            {tag.description && (
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
                {tag.description}
              </p>
            )}
            
            <div className="text-muted-foreground">
              {tag.articleCount} article{tag.articleCount !== 1 ? 's' : ''} tagged with #{tag.name}
            </div>
          </div>

          <RelatedTags relatedTags={relatedTags} />
        </Container>
      </Section>

      {/* Articles Content */}
      <Section background="default" spacing={{ top: 'none', bottom: 'xl' }}>
        <Container>
          <Suspense fallback={<TagLoading />}>
            <ContentList
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
              hasMore={hasMore}
              isLoadingMore={false}
              onSortChange={() => {}} // Client-side handling will be added
              onFilterChange={() => {}} // Client-side handling will be added
              onLoadMore={() => {}} // Pagination handling will be added
            />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-4 mt-12">
              <div className="flex items-center space-2">
                {currentPage > 1 && (
                  <a 
                    href={`/tags/${params.slug}?${new URLSearchParams({
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
                        href={`/tags/${params.slug}?${new URLSearchParams({
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
                    href={`/tags/${params.slug}?${new URLSearchParams({
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
  params
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const tag = await getTag(params.slug);
  const config = siteConfig.getConfig();
  
  if (!tag) {
    return {
      title: 'Tag Not Found | ' + config.name,
      description: 'The requested tag could not be found.',
    };
  }

  const title = `Articles tagged with #${tag.name}`;
  const description = tag.description || `Explore articles tagged with #${tag.name}.`;

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

// Generate static params for static generation
export async function generateStaticParams() {
  // TODO: Replace with actual API call to get all tag slugs
  return [
    { slug: 'ai' },
    { slug: 'business' },
    { slug: 'innovation' },
    { slug: 'economy' },
    { slug: 'sustainability' },
    { slug: 'healthcare' },
    { slug: 'technology' },
    { slug: 'digital' },
  ];
} 