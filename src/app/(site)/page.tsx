import React, { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { FeaturedContentHero, ArticleCard, ContentList, AIRecommendations, ContentItem } from '@/components/ui/content';
import { Icon, Article, Calendar, User, Eye, MagnifyingGlass } from '@/components/ui/icon';
import { siteConfig } from '@/config/site';

// API function to fetch featured content
async function getFeaturedContent() {
  try {
    const config = siteConfig.getConfig();
    const response = await fetch(`${config.domain}/api/content/articles?status=PUBLISHED&limit=3&sort=featured`, {
      cache: 'no-cache',
      next: { revalidate: 300 } // 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch featured content');
    }
    
    const result = await response.json();
    return result.data?.articles || [];
  } catch (error) {
    console.error('Error fetching featured content:', error);
    return [];
  }
}

// API function to fetch latest articles
async function getLatestArticles() {
  try {
    const config = siteConfig.getConfig();
    const response = await fetch(`${config.domain}/api/content/articles?status=PUBLISHED&limit=6&sort=newest`, {
      cache: 'no-cache',
      next: { revalidate: 180 } // 3 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch latest articles');
    }
    
    const result = await response.json();
    return result.data?.articles || [];
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    return [];
  }
}

// Site-specific hero content configuration
function getSiteHeroContent() {
  const config = siteConfig.getConfig();
  
  return {
    title: config.seo?.titleEn || config.name,
    subtitle: config.seo?.descriptionEn || config.description || 'Your trusted source for news and insights',
  };
}

// Loading component for featured content
function FeaturedContentLoading() {
  return (
    <div className="h-96 bg-muted animate-pulse rounded-lg mb-12"></div>
  );
}

// Loading component for articles grid
function ArticlesGridLoading() {
  return (
    <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
      {[...Array(6)].map((_, index) => (
        <GridItem key={index}>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        </GridItem>
      ))}
    </Grid>
  );
}

// Featured content section component
async function FeaturedContentSection() {
  const featuredContent = await getFeaturedContent();
  
  if (!featuredContent || featuredContent.length === 0) {
    return (
      <Section background="default" spacing={{ top: 'none', bottom: 'lg' }}>
        <Container>
          <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center mb-12">
            <div className="text-center">
              <Icon icon={Article} size="xl" className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No featured content available</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section background="default" spacing={{ top: 'none', bottom: 'lg' }}>
      <Container>
        <FeaturedContentHero
          items={featuredContent}
          autoRotate={6000}
          showDots={true}
          showArrows={true}
          className="mb-12"
        />
      </Container>
    </Section>
  );
}

// Latest articles section component  
async function LatestArticlesSection() {
  const latestArticles = await getLatestArticles();
  
  if (!latestArticles || latestArticles.length === 0) {
    return (
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Latest Articles
              </h2>
              <p className="text-muted-foreground">
                Stay updated with our latest insights and analysis
              </p>
            </div>
            <Link href="/articles">
              <Button variant="outline">
                View All Articles
                <Icon icon={Article} size="sm" className="ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Icon icon={Article} size="xl" className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No articles available yet</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for new content</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Latest Articles
            </h2>
            <p className="text-muted-foreground">
              Stay updated with our latest insights and analysis
            </p>
          </div>
          <Link href="/articles">
            <Button variant="outline">
              View All Articles
              <Icon icon={Article} size="sm" className="ml-2" />
            </Button>
          </Link>
        </div>

        <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
          {latestArticles.map((article: ContentItem) => (
            <GridItem key={article.id}>
              <ArticleCard
                content={article}
                variant="compact"
                showExcerpt={true}
                showActions={false}
              />
            </GridItem>
          ))}
        </Grid>

        {/* Quick Navigation */}
        <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-lg">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Explore by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            {['Technology', 'Economy', 'Business', 'Culture', 'Politics', 'Sports'].map((category) => (
              <Link
                key={category}
                href={`/categories/${category.toLowerCase()}`}
                className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
               >
                <Icon icon={Article} size="xs" className="mr-2" />
                {category}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default function Homepage() {
  const config = siteConfig.getConfig();
  const heroContent = getSiteHeroContent();

  return (
    <div className="min-h-screen">
      {/* Featured Content Hero Section */}
      <Suspense fallback={<FeaturedContentLoading />}>
        <FeaturedContentSection />
      </Suspense>
      {/* Site-Specific Hero Section */}
      <Section background="muted" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {heroContent.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {heroContent.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/articles">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Icon icon={Article} size="sm" className="mr-2" />
                  Browse Articles
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline">
                  <Icon icon={MagnifyingGlass} size="sm" className="mr-2" />
                  Search Content
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
      {/* Latest Articles Section */}
      <Suspense fallback={<ArticlesGridLoading />}>
        <LatestArticlesSection />
      </Suspense>
      {/* AI Recommendations Section */}
      <Section background="muted" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Recommended for You
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover personalized content recommendations powered by AI
            </p>
          </div>
          
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg"></div>}>
            <AIRecommendations 
              userId="anonymous"
              limit={4}
              className="max-w-4xl mx-auto"
            />
          </Suspense>
        </Container>
      </Section>
      {/* Newsletter Signup Section */}
      {config.contentTypes?.newsletters && (
        <Section background="primary" spacing={{ top: 'xl', bottom: 'xl' }}>
          <Container>
            <div className="text-center text-primary-foreground">
              <h2 className="text-3xl font-bold mb-4">
                Stay Updated
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
                Subscribe to our newsletter for the latest articles and insights delivered to your inbox.
              </p>
              <div className="max-w-md mx-auto flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button variant="secondary" size="lg">
                  Subscribe
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
} 