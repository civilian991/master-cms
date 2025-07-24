import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section, Grid, GridItem, Stack } from '@/components/ui/layout';
import { ArticleCard, ContentList } from '@/components/ui/content';
import { BreadcrumbNavigation } from '@/components/ui/navigation';
import { Icon, Article, Clock, Eye, Heart, BookmarkSimple, Share, User, Calendar, Tag, ArrowLeft } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

// Enhanced Reading Interface Components
import { ArticleReader } from '@/components/reading/ArticleReader';
import { ReadingProgress } from '@/components/reading/ReadingProgress';
import { BookmarkButton } from '@/components/reading/BookmarkButton';

// AI-Powered Content Features
import { AIPanel } from '@/components/reading/AIPanel';

// Social Engagement Features
import { SocialEngagementPanel } from '@/components/social/SocialEngagementPanel';
import { FloatingReactions } from '@/components/social/FloatingReactions';

// Reading Analytics Features
import { ReadingAnalyticsPanel } from '@/components/analytics/ReadingAnalyticsPanel';

// Types for article data
interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: {
    id: string;
    name: string;
    bio?: string;
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
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

// Server-side function to fetch article by slug
async function getArticle(slug: string): Promise<Article | null> {
  // Integrate with Content Management APIs from Story 1.6
  try {
    const config = siteConfig.getConfig();
    
    const response = await fetch(`${config.domain}/api/content/articles/slug/${slug}`, {
      cache: 'no-cache',
      next: { revalidate: 300 } // 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Article not found
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response format');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching article:', error);
    
    // Fallback to mock data for development/demo purposes
    const mockArticles: Record<string, Article> = {
      'future-ai-media-production': {
        id: '1',
        title: 'The Future of AI in Media Production',
        content: `
          <h2>Introduction</h2>
          <p>Artificial intelligence is rapidly transforming the media production landscape, revolutionizing how content is created, distributed, and consumed. From automated video editing to AI-generated scripts, the technology is reshaping every aspect of the industry.</p>
          
          <h2>AI-Powered Content Creation</h2>
          <p>Modern AI systems can now generate compelling video content, write engaging articles, and even compose music. These tools are not replacing human creativity but rather augmenting it, allowing creators to explore new possibilities and streamline their workflows.</p>
          
          <h3>Automated Video Editing</h3>
          <p>AI-powered editing tools can analyze hours of footage and automatically create compelling cuts, transitions, and effects. This technology is particularly valuable for news organizations and content creators who need to produce high-quality videos quickly.</p>
          
          <h3>Script Generation and Writing Assistance</h3>
          <p>Natural language processing models are becoming increasingly sophisticated at generating coherent, engaging scripts for various media formats. While human oversight remains crucial, these tools can significantly speed up the initial writing process.</p>
          
          <h2>The Role of Human Creativity</h2>
          <p>Despite the advances in AI technology, human creativity remains irreplaceable. The most successful media productions combine AI efficiency with human insight, emotional intelligence, and cultural understanding.</p>
          
          <h2>Future Trends and Predictions</h2>
          <p>Looking ahead, we can expect to see even more sophisticated AI tools that can understand context, emotion, and cultural nuances. The key to success will be finding the right balance between automation and human creativity.</p>
          
          <h2>Conclusion</h2>
          <p>The future of AI in media production is bright, offering unprecedented opportunities for creators and organizations. By embracing these tools while maintaining focus on human creativity and storytelling, the industry can reach new heights of innovation and engagement.</p>
        `,
        excerpt: 'Exploring how artificial intelligence is revolutionizing content creation and media workflows.',
        slug: 'future-ai-media-production',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T12:30:00Z',
        author: {
          id: '1',
          name: 'Sarah Al-Ahmad',
          bio: 'Technology journalist and AI researcher with over 10 years of experience in media innovation.',
          avatar: '/avatars/sarah.jpg'
        },
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
        seo: {
          metaTitle: 'The Future of AI in Media Production - Revolutionary Changes Ahead',
          metaDescription: 'Discover how artificial intelligence is transforming media production, from automated editing to AI-generated content.',
          keywords: ['AI', 'artificial intelligence', 'media production', 'video editing', 'content creation']
        }
      },
      'economic-outlook-2024': {
        id: '2',
        title: 'Economic Outlook 2024: Trends and Predictions',
        content: `
          <h2>Executive Summary</h2>
          <p>The global economy in 2024 presents a complex landscape of opportunities and challenges. This comprehensive analysis explores the key trends that will shape business and investment decisions throughout the year.</p>
          
          <h2>Global Economic Indicators</h2>
          <p>Key indicators suggest a cautiously optimistic outlook for 2024, with inflation showing signs of stabilization and employment markets remaining relatively robust across major economies.</p>
          
          <h3>Inflation Trends</h3>
          <p>After years of elevated inflation, many central banks are seeing their efforts to control price increases bear fruit. However, regional variations remain significant.</p>
          
          <h3>Employment Markets</h3>
          <p>Labor markets continue to show resilience, though the nature of work is evolving rapidly with technological advancement and changing worker preferences.</p>
          
          <h2>Regional Analysis</h2>
          <p>Different regions face unique challenges and opportunities, from the ongoing digital transformation in Asia to energy transition priorities in Europe.</p>
          
          <h2>Investment Opportunities</h2>
          <p>Despite uncertainties, several sectors show strong potential for growth, including renewable energy, healthcare technology, and sustainable infrastructure.</p>
          
          <h2>Risk Factors</h2>
          <p>Potential challenges include geopolitical tensions, climate-related disruptions, and the ongoing effects of global supply chain reorganization.</p>
          
          <h2>Conclusion</h2>
          <p>While 2024 presents both challenges and opportunities, businesses and investors who remain agile and informed are well-positioned to navigate the evolving landscape successfully.</p>
        `,
        excerpt: 'Comprehensive analysis of economic trends shaping the business landscape in 2024.',
        slug: 'economic-outlook-2024',
        publishedAt: '2024-01-14T14:30:00Z',
        author: {
          id: '2',
          name: 'Ahmed Hassan',
          bio: 'Senior economic analyst with expertise in global markets and financial trends.',
          avatar: '/avatars/ahmed.jpg'
        },
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
        seo: {
          metaTitle: 'Economic Outlook 2024: Comprehensive Analysis of Global Trends',
          metaDescription: 'Expert analysis of economic trends, investment opportunities, and risk factors shaping 2024.',
          keywords: ['economy', 'economic outlook', '2024 trends', 'investment', 'business analysis']
        }
      }
    };

    return mockArticles[slug] || null;
  }
}

// Fetch related articles
async function getRelatedArticles(articleId: string, categorySlug: string): Promise<Article[]> {
  // TODO: Replace with actual API call using AI-powered recommendations
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock related articles based on category
    const mockRelatedArticles = [
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
          { id: '7', name: 'Sustainability', slug: 'sustainability' }
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
          { id: '10', name: 'Architecture', slug: 'architecture' }
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
          { id: '12', name: 'Remote Work', slug: 'remote-work' }
        ],
        readingTime: 9,
        views: 2103,
        likes: 156,
        isBookmarked: true,
        isLiked: true,
      }
    ];

    return mockRelatedArticles.filter(article => article.id !== articleId).slice(0, 3);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }
}

// Social sharing component
function SocialSharing({ article }: { article: Article }) {
  const config = siteConfig.getConfig();
  const url = `${config.url}/articles/${article.slug}`;
  const title = article.title;
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

// Article metadata component
function ArticleMetadata({ article }: { article: Article }) {
  return (
    <div className="border-y border-border py-6 my-6">
      <Grid cols={1} responsive={{ md: 2 }} gap="md">
<GridItem>
  <div className="space-y-4">
    <div className="flex items-center space-x-3">
      {article.author.avatar && (
        <img
          src={article.author.avatar}
          alt={article.author.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      )}
      <div>
        <h3 className="font-semibold text-foreground">{article.author.name}</h3>
        {article.author.bio && (
          <p className="text-sm text-muted-foreground">{article.author.bio}</p>
        )}
      </div>
    </div>
    
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <div className="flex items-center space-x-1">
        <Icon icon={Calendar} size="sm" />
        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Icon icon={Clock} size="sm" />
        <span>{article.readingTime} min read</span>
      </div>
      <div className="flex items-center space-x-1">
        <Icon icon={Eye} size="sm" />
        <span>{article.views.toLocaleString()} views</span>
      </div>
    </div>
  </div>
</GridItem>

<GridItem>
  <div className="space-y-4">
    <div>
      <Link
        href={`/articles?category=${article.category.slug}`}
        className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
       >
        {article.category.name}
      </Link>
    </div>
    
    {article.tags && article.tags.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {article.tags.map(tag => (
          <Link
            key={tag.id}
            href={`/articles?tag=${tag.slug}`}
            className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
           >
            <Icon icon={Tag} size="xs" className="mr-1" />
            {tag.name}
          </Link>
        ))}
      </div>
    )}
  </div>
</GridItem>
</Grid>
    </div>
  );
}

// Main Article Page Component
export default async function ArticlePage({
  params
}: {
  params: { slug: string }
}) {
  const article = await getArticle(params.slug);
  
  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.id, article.category.slug);
  const config = siteConfig.getConfig();

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: article.category.name, href: `/articles?category=${article.category.slug}` },
    { label: article.title, isActive: true },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Navigation */}
      <Section background="muted" spacing={{ top: 'sm', bottom: 'sm' }}>
        <Container>
          <div className="flex items-center justify-between">
            <BreadcrumbNavigation items={breadcrumbItems} />
            <Link
              href="/articles"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
             >
              <Icon icon={ArrowLeft} size="sm" className="mr-1" />
              Back to Articles
            </Link>
          </div>
        </Container>
      </Section>
      {/* Article Header */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          <div className="max-w-4xl mx-auto">
            {article.featuredImage && (
              <div className="aspect-video mb-8 rounded-lg overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
              )}
            </header>

            <ArticleMetadata article={article} />
          </div>
        </Container>
      </Section>
      {/* Enhanced Article Content */}
      <Section background="default" spacing={{ top: 'none', bottom: 'lg' }}>
        <Container>
          <Grid cols={12} gap="lg">
            {/* Main Article Content */}
            <GridItem span={8}>
              <ArticleReader
                content={article.content}
                title={article.title}
                author={article.author.name}
                readingTime={article.readingTime}
                publishedAt={article.publishedAt}
              />

              {/* Article Actions */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" className="space-x-1">
                    <Icon icon={Heart} size="sm" />
                    <span>{article.likes}</span>
                  </Button>
                  <BookmarkButton
                    articleId={article.id}
                    articleTitle={article.title}
                    articleUrl={`/articles/${article.slug}`}
                    initialBookmarked={article.isBookmarked}
                    variant="button"
                    size="sm"
                  />
                </div>
                
                <SocialSharing article={article} />
              </div>
            </GridItem>

            {/* AI Assistant Sidebar */}
            <GridItem span={4}>
              <div className="sticky top-6 space-y-6">
                <AIPanel
                  articleId={article.id}
                  content={article.content}
                  title={article.title}
                  category={article.category.name}
                  tags={article.tags?.map(tag => tag.name) || []}
                  readingTime={article.readingTime}
                  views={article.views}
                  likes={article.likes}
                  publishedAt={article.publishedAt}
                />
                
                <SocialEngagementPanel
                  articleId={article.id}
                  articleTitle={article.title}
                  articleUrl={`/articles/${article.slug}`}
                  articleExcerpt={article.excerpt}
                  author={article.author.name}
                  category={article.category.name}
                  tags={article.tags?.map(tag => tag.name) || []}
                  featuredImage={article.featuredImage}
                  views={article.views}
                  likes={article.likes}
                  allowComments={true}
                />
              </div>
            </GridItem>
          </Grid>

          {/* Reading Progress Component */}
          <ReadingProgress
            articleId={article.id}
            content={article.content}
          />

          {/* Floating Reactions */}
          <FloatingReactions
            articleId={article.id}
            position="right"
            showCounts={true}
            autoHide={true}
          />
        </Container>
      </Section>
      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Section background="muted" spacing={{ top: 'lg', bottom: 'xl' }}>
          <Container>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Related Articles
              </h2>
              <p className="text-muted-foreground">
                Discover more content you might find interesting
              </p>
            </div>
            
            <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
              {relatedArticles.map(relatedArticle => (
                <GridItem key={relatedArticle.id}>
                  <ArticleCard
                    article={relatedArticle}
                    variant="default"
                    showAuthor
                    showCategory
                    showStats
                  />
                </GridItem>
              ))}
            </Grid>
          </Container>
        </Section>
      )}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const article = await getArticle(params.slug);
  const config = siteConfig.getConfig();
  
  if (!article) {
    return {
      title: 'Article Not Found | ' + config.name,
      description: 'The requested article could not be found.',
    };
  }

  const title = article.seo?.metaTitle || article.title;
  const description = article.seo?.metaDescription || article.excerpt;
  const keywords = article.seo?.keywords || article.tags?.map(tag => tag.name);

  return {
    title: `${title} | ${config.name}`,
    description,
    keywords,
    authors: [{ name: article.author.name }],
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      images: article.featuredImage ? [article.featuredImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.featuredImage ? [article.featuredImage] : undefined,
    },
  };
}

// Generate static params for static generation (optional)
export async function generateStaticParams() {
  // TODO: Replace with actual API call to get all article slugs
  // This will be used for static generation in production
  return [
    { slug: 'future-ai-media-production' },
    { slug: 'economic-outlook-2024' },
    { slug: 'sustainable-business-digital-age' },
    { slug: 'cultural-innovation-architecture' },
    { slug: 'rise-remote-work-global' },
    { slug: 'investment-strategies-emerging-markets' },
  ];
} 