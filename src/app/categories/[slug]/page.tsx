import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { ContentList, ArticleCard } from '@/components/ui/content';
import { ContentServerWrapper } from '@/components/ui/content-server-wrapper';
import { BreadcrumbNavigation } from '@/components/ui/navigation';
import { Icon, Folder, Article, MagnifyingGlass, CaretUp } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

// Types for category data
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  articleCount: number;
  featuredImage?: string;
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

// Server-side function to fetch category by slug
async function getCategory(slug: string): Promise<Category | null> {
  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    const response = await fetch(`${config.domain}/api/content/categories/${slug}`, {
      cache: 'force-cache',
      next: { revalidate: 1800 } // 30 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Category not found
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response format');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    
    // Fallback to mock data for development/demo purposes
    const mockCategories: Record<string, Category> = {
      'technology': {
        id: '1',
        name: 'Technology',
        slug: 'technology',
        description: 'Latest developments in technology, artificial intelligence, software development, and digital innovation.',
        articleCount: 24,
        featuredImage: '/images/categories/technology.jpg',
        children: [
          { id: '11', name: 'Artificial Intelligence', slug: 'artificial-intelligence', articleCount: 8 },
          { id: '12', name: 'Software Development', slug: 'software-development', articleCount: 12 },
          { id: '13', name: 'Digital Innovation', slug: 'digital-innovation', articleCount: 4 },
        ]
      },
      'economy': {
        id: '2',
        name: 'Economy',
        slug: 'economy',
        description: 'Economic analysis, market trends, investment insights, and financial news.',
        articleCount: 18,
        featuredImage: '/images/categories/economy.jpg',
        children: [
          { id: '21', name: 'Market Analysis', slug: 'market-analysis', articleCount: 7 },
          { id: '22', name: 'Investment', slug: 'investment', articleCount: 6 },
          { id: '23', name: 'Global Economics', slug: 'global-economics', articleCount: 5 },
        ]
      },
      'business': {
        id: '3',
        name: 'Business',
        slug: 'business',
        description: 'Business strategy, entrepreneurship, leadership, and corporate trends.',
        articleCount: 32,
        featuredImage: '/images/categories/business.jpg',
        children: [
          { id: '31', name: 'Entrepreneurship', slug: 'entrepreneurship', articleCount: 12 },
          { id: '32', name: 'Leadership', slug: 'leadership', articleCount: 9 },
          { id: '33', name: 'Strategy', slug: 'strategy', articleCount: 11 },
        ]
      },
      'culture': {
        id: '4',
        name: 'Culture',
        slug: 'culture',
        description: 'Cultural insights, arts, society, and lifestyle trends.',
        articleCount: 15,
        featuredImage: '/images/categories/culture.jpg',
        children: [
          { id: '41', name: 'Arts & Design', slug: 'arts-design', articleCount: 6 },
          { id: '42', name: 'Society', slug: 'society', articleCount: 5 },
          { id: '43', name: 'Lifestyle', slug: 'lifestyle', articleCount: 4 },
        ]
      },
    };

    return mockCategories[slug] || null;
  }
}

// Server-side function to fetch articles in category
async function getCategoryArticles(
  categorySlug: string,
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
  const subcategory = searchParams.subcategory as string;
  const tag = searchParams.tag as string;
  const sort = (searchParams.sort as string) || 'newest';
  const limit = 12;

  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    // Build query parameters for the API call
    const params = new URLSearchParams({
      status: 'PUBLISHED',
      categorySlug: categorySlug,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (subcategory) params.append('subcategorySlug', subcategory);
    if (tag) params.append('tagIds', tag);
    
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
    console.error('Error fetching category articles:', error);
    
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
      {
        id: '8',
        title: 'Blockchain Beyond Cryptocurrency: Real-World Applications',
        excerpt: 'Exploring practical blockchain applications in supply chain, healthcare, and governance.',
        slug: 'blockchain-real-world-applications',
        publishedAt: '2024-01-08T10:15:00Z',
        author: { id: '8', name: 'Youssef Mahmoud', avatar: '/avatars/youssef.jpg' },
        category: { id: '1', name: 'Technology', slug: 'technology' },
        tags: [
          { id: '18', name: 'Blockchain', slug: 'blockchain' },
          { id: '3', name: 'Innovation', slug: 'innovation' },
          { id: '19', name: 'Cryptocurrency', slug: 'cryptocurrency' }
        ],
        featuredImage: '/images/articles/blockchain-apps.jpg',
        readingTime: 10,
        views: 2134,
        likes: 156,
        isBookmarked: false,
        isLiked: true,
      },
    ].filter(article => article.category.slug === categorySlug);

    // Apply filtering
    let filteredArticles = mockArticles;
    
    if (tag) {
      filteredArticles = filteredArticles.filter(article =>
        article.tags?.some(t => t.slug === tag)
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

// Loading component
function CategoryLoading() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted rounded w-3/4 mb-8" />
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

// Subcategories component
function Subcategories({ category }: { category: Category }) {
  if (!category.children || category.children.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Subcategories</h3>
             <Grid cols={2} responsive={{ md: 3, lg: 4 }} gap="md">
        {category.children.map(subcategory => (
          <GridItem key={subcategory.id}>
            <a
              href={`/categories/${subcategory.slug}`}
              className="block p-4 bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon icon={Folder} size="sm" className="text-muted-foreground" />
                <h4 className="font-medium">{subcategory.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {subcategory.articleCount} article{subcategory.articleCount !== 1 ? 's' : ''}
              </p>
            </a>
          </GridItem>
        ))}
      </Grid>
    </div>
  );
}

// Main Category Page Component
export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const category = await getCategory(params.slug);
  
  if (!category) {
    notFound();
  }

  const { articles, hasMore, totalPages, currentPage, totalCount } = await getCategoryArticles(
    params.slug,
    searchParams
  );
  const config = siteConfig.getConfig();

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: category.name, isActive: true },
  ];

  // Current filters
  const currentFilters = {
    category: params.slug,
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

      {/* Category Header */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          {category.featuredImage && (
            <div className="aspect-video mb-8 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20">
              <img
                src={category.featuredImage}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Icon icon={Folder} size="lg" className="text-primary" />
              <h1 className="text-4xl font-bold text-foreground">
                {category.name}
              </h1>
            </div>
            
            {category.description && (
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
                {category.description}
              </p>
            )}
            
            <div className="text-muted-foreground">
              {category.articleCount} article{category.articleCount !== 1 ? 's' : ''} in this category
            </div>
          </div>

          <Subcategories category={category} />
        </Container>
      </Section>

      {/* Articles Content */}
      <Section background="default" spacing={{ top: 'none', bottom: 'xl' }}>
        <Container>
          <Suspense fallback={<CategoryLoading />}>
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
                    href={`/categories/${params.slug}?${new URLSearchParams({
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
                        href={`/categories/${params.slug}?${new URLSearchParams({
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
                    href={`/categories/${params.slug}?${new URLSearchParams({
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
  const category = await getCategory(params.slug);
  const config = siteConfig.getConfig();
  
  if (!category) {
    return {
      title: 'Category Not Found | ' + config.name,
      description: 'The requested category could not be found.',
    };
  }

  const title = `${category.name} Articles`;
  const description = category.description || `Explore articles in the ${category.name} category.`;

  return {
    title: `${title} | ${config.name}`,
    description,
    openGraph: {
      title: `${title} | ${config.name}`,
      description,
      type: 'website',
      images: category.featuredImage ? [category.featuredImage] : undefined,
    },
  };
}

// Generate static params for static generation
export async function generateStaticParams() {
  // TODO: Replace with actual API call to get all category slugs
  return [
    { slug: 'technology' },
    { slug: 'economy' },
    { slug: 'business' },
    { slug: 'culture' },
    { slug: 'politics' },
    { slug: 'sports' },
  ];
} 