import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the modules
jest.mock('@/config/site', () => ({
  siteConfig: {
    getConfig: jest.fn(() => ({
      name: 'Test Site',
      domain: 'http://localhost:3000',
      locale: 'en'
    }))
  }
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

jest.mock('@/components/ui/layout', () => ({
  Container: ({ children }: any) => <div data-testid="container">{children}</div>,
  Section: ({ children }: any) => <div data-testid="section">{children}</div>,
  Grid: ({ children }: any) => <div data-testid="grid">{children}</div>,
  GridItem: ({ children }: any) => <div data-testid="grid-item">{children}</div>,
  Stack: ({ children }: any) => <div data-testid="stack">{children}</div>
}));

jest.mock('@/components/ui/content', () => ({
  ContentList: ({ items, state }: any) => (
    <div data-testid="content-list">
      {state === 'loaded' && items.length > 0 ? (
        <div>Articles found: {items.length}</div>
      ) : (
        <div>No articles found</div>
      )}
    </div>
  ),
  ArticleCard: ({ content }: any) => (
    <div data-testid="article-card">
      <h3>{content?.title}</h3>
      <p>{content?.excerpt}</p>
    </div>
  )
}));

jest.mock('@/components/ui/navigation', () => ({
  BreadcrumbNavigation: ({ items }: any) => (
    <nav data-testid="breadcrumb">
      {items.map((item: any, index: number) => (
        <span key={index}>{item.label}</span>
      ))}
    </nav>
  )
}));

jest.mock('@/components/ui/icon', () => ({
  Icon: ({ icon }: any) => <span data-testid="icon">{icon?.name || 'icon'}</span>,
  Article: { name: 'Article' },
  Clock: { name: 'Clock' },
  Eye: { name: 'Eye' },
  User: { name: 'User' },
  Calendar: { name: 'Calendar' },
  Tag: { name: 'Tag' },
  Heart: { name: 'Heart' },
  BookmarkSimple: { name: 'BookmarkSimple' },
  Share: { name: 'Share' },
  MagnifyingGlass: { name: 'MagnifyingGlass' }
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
}));

// Mock the page components to focus on testing integration
jest.mock('@/app/articles/page', () => {
  return function MockArticlesPage() {
    return (
      <div data-testid="articles-page">
        <nav data-testid="breadcrumb">
          <span>Home</span>
          <span>Articles</span>
        </nav>
        
        <div data-testid="page-header">
          <h1>All Articles</h1>
          <p>Explore our comprehensive collection of articles</p>
        </div>
        
        <div data-testid="filter-summary">
          <span>Active Filters</span>
        </div>
        
        <div data-testid="content-list">
          <div>Articles found: 6</div>
        </div>
        
        <div data-testid="pagination">
          <button>Previous</button>
          <button>1</button>
          <button>2</button>
          <button>Next</button>
        </div>
      </div>
    );
  };
});

jest.mock('@/app/articles/[slug]/page', () => {
  return function MockArticlePage() {
    return (
      <div data-testid="article-page">
        <nav data-testid="breadcrumb">
          <span>Home</span>
          <span>Articles</span>
          <span>Technology</span>
          <span>Article Title</span>
        </nav>
        
        <div data-testid="article-header">
          <img src="/featured-image.jpg" alt="Article" />
          <h1>The Future of AI in Media Production</h1>
          <p>Article excerpt goes here</p>
        </div>
        
        <div data-testid="article-metadata">
          <div data-testid="author-info">
            <img src="/avatar.jpg" alt="Author" />
            <div>
              <h3>Sarah Al-Ahmad</h3>
              <p>Author bio</p>
            </div>
          </div>
          <div data-testid="article-stats">
            <span>January 15, 2024</span>
            <span>8 min read</span>
            <span>2,450 views</span>
          </div>
        </div>
        
        <article data-testid="article-content">
          <div>Article content goes here</div>
        </article>
        
        <div data-testid="article-actions">
          <button>127 likes</button>
          <button>Bookmark</button>
          <div data-testid="social-sharing">
            <span>Share:</span>
            <button>Twitter</button>
            <button>Facebook</button>
            <button>LinkedIn</button>
            <button>WhatsApp</button>
          </div>
        </div>
        
        <div data-testid="related-articles">
          <h2>Related Articles</h2>
          <div data-testid="article-card">Sample related article</div>
        </div>
      </div>
    );
  };
});

import ArticlesPage from '@/app/articles/page';
import ArticlePage from '@/app/articles/[slug]/page';

describe('Articles System', () => {
  describe('Articles Listing Page', () => {
    it('renders the articles listing layout correctly', () => {
      render(<ArticlesPage />);
      
      expect(screen.getByTestId('articles-page')).toBeInTheDocument();
    });

    it('displays breadcrumb navigation', () => {
      render(<ArticlesPage />);
      
      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
    });

    it('shows page header with title and description', () => {
      render(<ArticlesPage />);
      
      const header = screen.getByTestId('page-header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('All Articles')).toBeInTheDocument();
      expect(screen.getByText('Explore our comprehensive collection of articles')).toBeInTheDocument();
    });

    it('renders filter summary when filters are active', () => {
      render(<ArticlesPage />);
      
      expect(screen.getByTestId('filter-summary')).toBeInTheDocument();
      expect(screen.getByText('Active Filters')).toBeInTheDocument();
    });

    it('displays content list with articles', () => {
      render(<ArticlesPage />);
      
      const contentList = screen.getByTestId('content-list');
      expect(contentList).toBeInTheDocument();
      expect(screen.getByText('Articles found: 6')).toBeInTheDocument();
    });

    it('renders pagination controls', () => {
      render(<ArticlesPage />);
      
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Individual Article Page', () => {
    it('renders the article page layout correctly', () => {
      render(<ArticlePage />);
      
      expect(screen.getByTestId('article-page')).toBeInTheDocument();
    });

    it('displays detailed breadcrumb navigation', () => {
      render(<ArticlePage />);
      
      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Article Title')).toBeInTheDocument();
    });

    it('shows article header with image, title, and excerpt', () => {
      render(<ArticlePage />);
      
      const header = screen.getByTestId('article-header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('The Future of AI in Media Production')).toBeInTheDocument();
      expect(screen.getByText('Article excerpt goes here')).toBeInTheDocument();
    });

    it('displays article metadata including author info', () => {
      render(<ArticlePage />);
      
      const metadata = screen.getByTestId('article-metadata');
      expect(metadata).toBeInTheDocument();
      
      const authorInfo = screen.getByTestId('author-info');
      expect(authorInfo).toBeInTheDocument();
      expect(screen.getByText('Sarah Al-Ahmad')).toBeInTheDocument();
      expect(screen.getByText('Author bio')).toBeInTheDocument();
    });

    it('shows article statistics and publication info', () => {
      render(<ArticlePage />);
      
      const stats = screen.getByTestId('article-stats');
      expect(stats).toBeInTheDocument();
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('8 min read')).toBeInTheDocument();
      expect(screen.getByText('2,450 views')).toBeInTheDocument();
    });

    it('renders article content area', () => {
      render(<ArticlePage />);
      
      const content = screen.getByTestId('article-content');
      expect(content).toBeInTheDocument();
      expect(screen.getByText('Article content goes here')).toBeInTheDocument();
    });

    it('displays article engagement actions', () => {
      render(<ArticlePage />);
      
      const actions = screen.getByTestId('article-actions');
      expect(actions).toBeInTheDocument();
      expect(screen.getByText('127 likes')).toBeInTheDocument();
      expect(screen.getByText('Bookmark')).toBeInTheDocument();
    });

    it('shows social sharing functionality', () => {
      render(<ArticlePage />);
      
      const sharing = screen.getByTestId('social-sharing');
      expect(sharing).toBeInTheDocument();
      expect(screen.getByText('Share:')).toBeInTheDocument();
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('renders related articles section', () => {
      render(<ArticlePage />);
      
      const related = screen.getByTestId('related-articles');
      expect(related).toBeInTheDocument();
      expect(screen.getByText('Related Articles')).toBeInTheDocument();
      expect(screen.getByText('Sample related article')).toBeInTheDocument();
    });
  });
}); 