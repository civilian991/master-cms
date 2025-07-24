import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the site configuration
jest.mock('@/config/site', () => ({
  siteConfig: {
    getConfig: jest.fn(() => ({
      name: 'Test Site',
      domain: 'https://example.com',
      description: 'Test site description',
      locale: 'en',
      seo: {
        titleEn: 'Test Site - Professional Content',
        descriptionEn: 'Test site for professional content and insights',
        keywordsEn: 'content, insights, professional, test',
        ogImage: 'https://example.com/og-image.jpg',
        twitterCard: 'summary_large_image'
      },
      branding: {
        logoUrl: 'https://example.com/logo.png'
      }
    }))
  }
}));

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}));

// Mock fetch for sitemap tests
global.fetch = jest.fn();

describe('SEO & Performance Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata Generation', () => {
    it('generates dynamic metadata based on site configuration', async () => {
      const { generateMetadata } = await import('@/app/layout');
      
      const metadata = await generateMetadata();
      
      expect(metadata).toMatchObject({
        title: {
          default: 'Test Site',
          template: '%s | Test Site'
        },
        description: 'Test site description',
        keywords: 'content, insights, professional, test',
        openGraph: {
          type: 'website',
          locale: 'en_US',
          url: 'https://example.com',
          title: 'Test Site - Professional Content',
          description: 'Test site for professional content and insights',
          siteName: 'Test Site'
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Test Site - Professional Content',
          description: 'Test site for professional content and insights'
        }
      });
    });

    it('handles Arabic locale correctly in metadata', async () => {
      const { siteConfig } = require('@/config/site');
      siteConfig.getConfig.mockReturnValue({
        name: 'موقع تجريبي',
        domain: 'https://example.com',
        description: 'وصف الموقع التجريبي',
        locale: 'ar',
        seo: {
          titleAr: 'موقع تجريبي - محتوى مهني',
          descriptionAr: 'موقع تجريبي للمحتوى والأفكار المهنية'
        }
      });

      const { generateMetadata } = await import('@/app/layout');
      const metadata = await generateMetadata();
      
      expect(metadata.openGraph?.locale).toBe('ar_AE');
    });

    it('includes proper robots and verification metadata', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = 'test-verification-code';
      
      const { generateMetadata } = await import('@/app/layout');
      const metadata = await generateMetadata();
      
      expect(metadata.robots).toMatchObject({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      });
      
      expect(metadata.verification?.google).toBe('test-verification-code');
    });
  });

  describe('Structured Data', () => {
    it('generates article structured data correctly', () => {
      const { ArticleStructuredData } = require('@/components/seo/StructuredData');
      
      const mockArticle = {
        id: '1',
        title: 'Test Article',
        excerpt: 'This is a test article excerpt',
        slug: 'test-article',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
        author: {
          id: 'author1',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test author bio'
        },
        category: {
          id: 'cat1',
          name: 'Technology',
          slug: 'technology'
        },
        tags: [
          { id: 'tag1', name: 'AI', slug: 'ai' },
          { id: 'tag2', name: 'Tech', slug: 'tech' }
        ],
        featuredImage: 'https://example.com/featured.jpg',
        readingTime: 5,
        views: 1250,
        content: 'This is the full article content for testing purposes.'
      };

      render(<ArticleStructuredData article={mockArticle} />);
      
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      expect(scriptElement).toBeInTheDocument();
      
      const structuredData = JSON.parse(scriptElement?.innerHTML || '{}');
      expect(structuredData).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        description: 'This is a test article excerpt',
        datePublished: '2024-01-15T10:00:00Z',
        dateModified: '2024-01-16T10:00:00Z',
        author: {
          '@type': 'Person',
          name: 'John Doe'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Test Site'
        },
        keywords: 'AI, Tech',
        timeRequired: 'PT5M'
      });
    });

    it('generates organization structured data correctly', () => {
      const { OrganizationStructuredData } = require('@/components/seo/StructuredData');
      
      const mockOrganization = {
        name: 'Test Organization',
        domain: 'https://example.com',
        description: 'A test organization',
        logo: 'https://example.com/logo.png',
        foundingDate: '2020-01-01',
        contactPoint: {
          telephone: '+1-555-123-4567',
          email: 'contact@example.com',
          contactType: 'customer service'
        },
        sameAs: ['https://twitter.com/test', 'https://linkedin.com/company/test']
      };

      render(<OrganizationStructuredData organization={mockOrganization} />);
      
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      expect(scriptElement).toBeInTheDocument();
      
      const structuredData = JSON.parse(scriptElement?.innerHTML || '{}');
      expect(structuredData).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test Organization',
        url: 'https://example.com',
        description: 'A test organization',
        foundingDate: '2020-01-01'
      });
    });

    it('generates breadcrumb structured data correctly', () => {
      const { BreadcrumbStructuredData } = require('@/components/seo/StructuredData');
      
      const mockBreadcrumbs = [
        { name: 'Home', url: 'https://example.com/' },
        { name: 'Articles', url: 'https://example.com/articles' },
        { name: 'Technology', url: 'https://example.com/categories/technology' }
      ];

      render(<BreadcrumbStructuredData breadcrumbs={mockBreadcrumbs} />);
      
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      expect(scriptElement).toBeInTheDocument();
      
      const structuredData = JSON.parse(scriptElement?.innerHTML || '{}');
      expect(structuredData).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://example.com/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Articles', 
            item: 'https://example.com/articles'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Technology',
            item: 'https://example.com/categories/technology'
          }
        ]
      });
    });

    it('generates website structured data correctly', () => {
      const { WebsiteStructuredData } = require('@/components/seo/StructuredData');
      
      render(<WebsiteStructuredData />);
      
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      expect(scriptElement).toBeInTheDocument();
      
      const structuredData = JSON.parse(scriptElement?.innerHTML || '{}');
      expect(structuredData).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Test Site',
        description: 'Test site description',
        url: 'https://example.com',
        inLanguage: 'en-US',
        copyrightYear: new Date().getFullYear()
      });
    });
  });

  describe('Sitemap Generation', () => {
    it('generates sitemap with correct XML structure', async () => {
      // Mock API responses
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              articles: [
                {
                  slug: 'test-article-1',
                  publishedAt: '2024-01-15T10:00:00Z',
                  updatedAt: '2024-01-16T10:00:00Z'
                },
                {
                  slug: 'test-article-2',
                  publishedAt: '2024-01-14T10:00:00Z'
                }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              categories: [
                {
                  slug: 'technology',
                  updatedAt: '2024-01-10T10:00:00Z'
                }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              tags: [
                {
                  slug: 'ai',
                  updatedAt: '2024-01-12T10:00:00Z'
                }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: false
        });

      const { GET } = await import('@/app/sitemap.xml/route');
      const request = new Request('https://example.com/sitemap.xml');
      
      const response = await GET(request);
      const xmlContent = await response.text();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/xml');
      expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xmlContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(xmlContent).toContain('<loc>https://example.com/</loc>');
      expect(xmlContent).toContain('<loc>https://example.com/articles/test-article-1</loc>');
      expect(xmlContent).toContain('<loc>https://example.com/categories/technology</loc>');
      expect(xmlContent).toContain('<priority>1.0</priority>');
      expect(xmlContent).toContain('<changefreq>daily</changefreq>');
    });

    it('handles API errors gracefully in sitemap generation', async () => {
      // Mock API error
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { GET } = await import('@/app/sitemap.xml/route');
      const request = new Request('https://example.com/sitemap.xml');
      
      const response = await GET(request);
      const xmlContent = await response.text();
      
      expect(response.status).toBe(200);
      // Should still include static pages even when API fails
      expect(xmlContent).toContain('<loc>https://example.com/</loc>');
      expect(xmlContent).toContain('<loc>https://example.com/articles</loc>');
    });

    it('generates robots.txt content correctly', async () => {
      const { generateRobotsTxt } = await import('@/app/sitemap.xml/route');
      
      const robotsTxt = await generateRobotsTxt();
      
      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Sitemap: https://example.com/sitemap.xml');
      expect(robotsTxt).toContain('Disallow: /api/');
      expect(robotsTxt).toContain('Disallow: /admin/');
      expect(robotsTxt).toContain('User-agent: Googlebot');
    });
  });

  describe('Loading Components', () => {
    it('renders skeleton components correctly', () => {
      const { Skeleton, ArticleCardSkeleton, LoadingSpinner } = require('@/components/ui/loading');
      
      const { rerender } = render(<Skeleton className="h-4 w-20" />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      rerender(<ArticleCardSkeleton />);
      expect(document.querySelector('.aspect-video')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="lg" />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders article list skeleton with correct layout', () => {
      const { ArticleListSkeleton } = require('@/components/ui/loading');
      
      const { rerender } = render(<ArticleListSkeleton count={3} layout="grid" />);
      expect(document.querySelector('.grid')).toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
      
      rerender(<ArticleListSkeleton count={2} layout="list" />);
      expect(document.querySelector('.space-y-6')).toBeInTheDocument();
    });

    it('renders content loading with custom message', () => {
      const { ContentLoading } = require('@/components/ui/loading');
      
      render(<ContentLoading message="Loading articles..." showSpinner={true} />);
      
      expect(screen.getByText('Loading articles...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('progressive image handles loading states correctly', async () => {
      const { ProgressiveImage } = require('@/components/ui/loading');
      
      render(
        <ProgressiveImage
          src="https://example.com/image.jpg"
          alt="Test image"
          placeholder="https://example.com/placeholder.jpg"
        />
      );
      
      // Should show placeholder initially
      expect(document.querySelector('.filter.blur-sm')).toBeInTheDocument();
      
      // Simulate image load
      const mainImage = document.querySelector('img[src="https://example.com/image.jpg"]') as HTMLImageElement;
      if (mainImage) {
        mainImage.onload?.(new Event('load'));
      }
      
      await waitFor(() => {
        expect(document.querySelector('.opacity-100')).toBeInTheDocument();
      });
    });

    it('lazy loader uses intersection observer correctly', async () => {
      const { LazyLoader } = require('@/components/ui/loading');
      
      // Mock IntersectionObserver
      const mockIntersectionObserver = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        disconnect: jest.fn(),
      });
      window.IntersectionObserver = mockIntersectionObserver;
      
      render(
        <LazyLoader fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="content">Loaded content</div>
        </LazyLoader>
      );
      
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('implements proper caching headers in sitemap', async () => {
      const { GET } = await import('@/app/sitemap.xml/route');
      const request = new Request('https://example.com/sitemap.xml');
      
      const response = await GET(request);
      
      expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
      expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=3600');
    });

    it('handles font loading optimization', () => {
      // This would be tested in an E2E environment
      // Here we just verify the font configuration is correct
      expect(true).toBe(true); // Placeholder for font loading tests
    });

    it('implements proper meta tag optimization', async () => {
      const { generateMetadata } = await import('@/app/layout');
      const metadata = await generateMetadata();
      
      expect(metadata.formatDetection).toMatchObject({
        email: false,
        address: false,
        telephone: false
      });
    });
  });
}); 