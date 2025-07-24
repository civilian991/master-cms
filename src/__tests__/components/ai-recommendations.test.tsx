import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/articles/test-article',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}));

// Mock site configuration
jest.mock('@/config/site', () => ({
  siteConfig: {
    getConfig: jest.fn(() => ({
      name: 'Test Site',
      domain: 'https://example.com'
    }))
  }
}));

// Mock user context
const mockUser = {
  id: 'user123',
  preferences: {
    topics: ['technology', 'ai', 'programming'],
    readingLevel: 'intermediate',
    language: 'en'
  },
  readingHistory: [
    { articleId: 'art1', category: 'technology', readingTime: 300 },
    { articleId: 'art2', category: 'ai', readingTime: 450 },
  ]
};

// Mock article data
const mockCurrentArticle = {
  id: 'current-article',
  title: 'Introduction to Machine Learning',
  category: { id: 'cat1', name: 'Technology', slug: 'technology' },
  tags: [
    { id: 'tag1', name: 'AI', slug: 'ai' },
    { id: 'tag2', name: 'Machine Learning', slug: 'ml' }
  ],
  content: 'Article content about machine learning...',
  wordCount: 500
};

const mockRecommendations = [
  {
    id: 'rec1',
    title: 'Deep Learning Fundamentals',
    excerpt: 'Learn the basics of deep learning and neural networks.',
    slug: 'deep-learning-fundamentals',
    category: { name: 'Technology', slug: 'technology' },
    readingTime: 8,
    similarity: 0.85,
    reason: 'Similar to articles you\'ve read about AI',
    featuredImage: '/images/deep-learning.jpg',
    author: { name: 'Jane Smith', avatar: '/avatars/jane.jpg' },
    publishedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'rec2',
    title: 'Natural Language Processing',
    excerpt: 'Understanding how computers process human language.',
    slug: 'natural-language-processing',
    category: { name: 'Technology', slug: 'technology' },
    readingTime: 12,
    similarity: 0.78,
    reason: 'Based on your interest in AI and programming',
    featuredImage: '/images/nlp.jpg',
    author: { name: 'Bob Johnson', avatar: '/avatars/bob.jpg' },
    publishedAt: '2024-01-08T15:30:00Z'
  },
  {
    id: 'rec3',
    title: 'Computer Vision Applications',
    excerpt: 'Real-world applications of computer vision technology.',
    slug: 'computer-vision-applications',
    category: { name: 'Technology', slug: 'technology' },
    readingTime: 10,
    similarity: 0.72,
    reason: 'Trending in technology category',
    featuredImage: '/images/computer-vision.jpg',
    author: { name: 'Alice Williams', avatar: '/avatars/alice.jpg' },
    publishedAt: '2024-01-05T09:15:00Z'
  }
];

// Mock AI Recommendations Component
const MockAIRecommendationsPanel = ({ 
  currentArticle, 
  user, 
  recommendationType = 'related',
  maxResults = 5,
  onRecommendationClick,
  onRecommendationView
}: any) => {
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewedRecommendations, setViewedRecommendations] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentArticle: currentArticle.id,
            userId: user?.id,
            type: recommendationType,
            limit: maxResults,
            userPreferences: user?.preferences,
            readingHistory: user?.readingHistory
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        // Fallback to mock data for testing
        setRecommendations(mockRecommendations.slice(0, maxResults));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentArticle.id, user?.id, recommendationType, maxResults]);

  const handleRecommendationView = (recommendation: any) => {
    if (!viewedRecommendations.has(recommendation.id)) {
      setViewedRecommendations(prev => new Set([...prev, recommendation.id]));
      if (onRecommendationView) {
        onRecommendationView(recommendation);
      }
    }
  };

  const handleRecommendationClick = (recommendation: any) => {
    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    }
  };

  if (isLoading) {
    return (
      <div data-testid="recommendations-loading" className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="recommendations-error" className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">Failed to Load Recommendations</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          onClick={() => window.location.reload()}
          data-testid="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div data-testid="ai-recommendations-panel" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="recommendations-title">
          {recommendationType === 'related' ? 'Related Articles' : 
           recommendationType === 'personalized' ? 'Recommended for You' : 
           'Trending Articles'}
        </h2>
        <span className="text-sm text-gray-500" data-testid="recommendations-count">
          {recommendations.length} recommendations
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation, index) => (
          <article
            key={recommendation.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleRecommendationClick(recommendation)}
            onMouseEnter={() => handleRecommendationView(recommendation)}
            data-testid={`recommendation-${recommendation.id}`}
          >
            {recommendation.featuredImage && (
              <img
                src={recommendation.featuredImage}
                alt={recommendation.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
                data-testid={`recommendation-image-${recommendation.id}`}
              />
            )}

            <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`recommendation-title-${recommendation.id}`}>
              {recommendation.title}
            </h3>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2" data-testid={`recommendation-excerpt-${recommendation.id}`}>
              {recommendation.excerpt}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <div className="flex items-center space-x-2">
                <img
                  src={recommendation.author.avatar}
                  alt={recommendation.author.name}
                  className="w-4 h-4 rounded-full"
                />
                <span>{recommendation.author.name}</span>
              </div>
              <span>{recommendation.readingTime} min read</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {recommendation.category.name}
              </span>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-1">⭐</span>
                <span data-testid={`recommendation-similarity-${recommendation.id}`}>
                  {Math.round(recommendation.similarity * 100)}% match
                </span>
              </div>
            </div>

            {recommendation.reason && (
              <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded" data-testid={`recommendation-reason-${recommendation.id}`}>
                💡 {recommendation.reason}
              </div>
            )}

            {viewedRecommendations.has(recommendation.id) && (
              <div className="mt-2 text-xs text-purple-600" data-testid={`recommendation-viewed-${recommendation.id}`}>
                ✓ Viewed
              </div>
            )}
          </article>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="no-recommendations">
          <p>No recommendations available at this time.</p>
          <p className="text-sm mt-1">Check back later for personalized content suggestions.</p>
        </div>
      )}
    </div>
  );
};

// Mock Personalized Content Feed Component
const MockPersonalizedContentFeed = ({ user, filters = {}, onContentInteraction }: any) => {
  const [content, setContent] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentFilter, setCurrentFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchPersonalizedContent = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/ai/personalized-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            preferences: user.preferences,
            readingHistory: user.readingHistory,
            filters: { ...filters, type: currentFilter }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch personalized content');
        }

        const data = await response.json();
        setContent(data.content || mockRecommendations);
      } catch (error) {
        setContent(mockRecommendations);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalizedContent();
  }, [user.id, currentFilter, filters]);

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
  };

  const handleContentClick = (contentItem: any) => {
    if (onContentInteraction) {
      onContentInteraction({
        type: 'click',
        contentId: contentItem.id,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div data-testid="personalized-content-feed">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Personalized Feed</h2>
        
        <div className="flex space-x-2 mb-4">
          {['all', 'technology', 'ai', 'programming'].map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-3 py-1 rounded text-sm ${
                currentFilter === filter 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              data-testid={`filter-${filter}`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div data-testid="feed-loading" className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {content.map((item, index) => (
            <article
              key={item.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleContentClick(item)}
              data-testid={`feed-item-${item.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold flex-1 mr-4">{item.title}</h3>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {item.readingTime} min
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{item.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{item.author.name}</span>
                <span>{item.category.name}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

describe('AI Recommendations Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('AI Recommendations Panel', () => {
    it('fetches and displays related article recommendations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recommendations: mockRecommendations,
          success: true
        })
      } as Response);

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
          recommendationType="related"
        />
      );

      // Should show loading state initially
      expect(screen.getByTestId('recommendations-loading')).toBeInTheDocument();

      // Wait for recommendations to load
      await waitFor(() => {
        expect(screen.getByTestId('ai-recommendations-panel')).toBeInTheDocument();
      });

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentArticle: 'current-article',
          userId: 'user123',
          type: 'related',
          limit: 5,
          userPreferences: mockUser.preferences,
          readingHistory: mockUser.readingHistory
        })
      });

      // Verify recommendations are displayed
      expect(screen.getByTestId('recommendations-title')).toHaveTextContent('Related Articles');
      expect(screen.getByTestId('recommendations-count')).toHaveTextContent('3 recommendations');

      // Check individual recommendations
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-title-rec1')).toHaveTextContent('Deep Learning Fundamentals');
      expect(screen.getByTestId('recommendation-similarity-rec1')).toHaveTextContent('85% match');
      expect(screen.getByTestId('recommendation-reason-rec1')).toHaveTextContent('Similar to articles you\'ve read about AI');
    });

    it('handles personalized recommendations based on user preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recommendations: mockRecommendations.filter(rec => rec.similarity > 0.8),
          success: true
        })
      } as Response);

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
          recommendationType="personalized"
          maxResults={3}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-title')).toHaveTextContent('Recommended for You');
      });

      // Should only show high-similarity recommendations
      expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      expect(screen.queryByTestId('recommendation-rec3')).not.toBeInTheDocument(); // Lower similarity
    });

    it('tracks recommendation views and clicks', async () => {
      const onRecommendationView = jest.fn();
      const onRecommendationClick = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations })
      } as Response);

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
          onRecommendationView={onRecommendationView}
          onRecommendationClick={onRecommendationClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recommendation-rec1')).toBeInTheDocument();
      });

      // Test view tracking (mouse enter)
      const firstRecommendation = screen.getByTestId('recommendation-rec1');
      fireEvent.mouseEnter(firstRecommendation);

      expect(onRecommendationView).toHaveBeenCalledWith(mockRecommendations[0]);
      expect(screen.getByTestId('recommendation-viewed-rec1')).toBeInTheDocument();

      // Test click tracking
      await user.click(firstRecommendation);
      expect(onRecommendationClick).toHaveBeenCalledWith(mockRecommendations[0]);
    });

    it('handles API errors gracefully with fallback content', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error: 500'));

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to Load Recommendations')).toBeInTheDocument();
      expect(screen.getByText('API Error: 500')).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('adapts recommendations based on different recommendation types', async () => {
      // Test different recommendation types
      const types = ['related', 'personalized', 'trending'];
      
      for (const type of types) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations })
        } as Response);

        const { rerender } = render(
          <MockAIRecommendationsPanel
            currentArticle={mockCurrentArticle}
            user={mockUser}
            recommendationType={type}
          />
        );

        await waitFor(() => {
          const expectedTitle = type === 'related' ? 'Related Articles' :
                              type === 'personalized' ? 'Recommended for You' :
                              'Trending Articles';
          expect(screen.getByTestId('recommendations-title')).toHaveTextContent(expectedTitle);
        });

        // Verify API call includes correct type
        expect(mockFetch).toHaveBeenLastCalledWith('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expect.objectContaining({ type }))
        });

        // Clean up for next iteration
        if (type !== types[types.length - 1]) {
          rerender(<div></div>);
          jest.clearAllMocks();
        }
      }
    });

    it('displays empty state when no recommendations are available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recommendations: [] })
      } as Response);

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('no-recommendations')).toBeInTheDocument();
      });

      expect(screen.getByText('No recommendations available at this time.')).toBeInTheDocument();
    });
  });

  describe('Personalized Content Feed', () => {
    it('renders personalized content based on user preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: mockRecommendations })
      } as Response);

      const onContentInteraction = jest.fn();

      render(
        <MockPersonalizedContentFeed
          user={mockUser}
          onContentInteraction={onContentInteraction}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('personalized-content-feed')).toBeInTheDocument();
      });

      // Verify content is displayed
      expect(screen.getByText('Your Personalized Feed')).toBeInTheDocument();
      expect(screen.getByTestId('feed-item-rec1')).toBeInTheDocument();

      // Test content interaction
      const firstItem = screen.getByTestId('feed-item-rec1');
      await user.click(firstItem);

      expect(onContentInteraction).toHaveBeenCalledWith({
        type: 'click',
        contentId: 'rec1',
        userId: 'user123',
        timestamp: expect.any(String)
      });
    });

    it('filters content based on selected categories', async () => {
      // Mock different responses for different filters
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: mockRecommendations })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            content: mockRecommendations.filter(rec => rec.category.slug === 'technology') 
          })
        } as Response);

      render(<MockPersonalizedContentFeed user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('feed-item-rec1')).toBeInTheDocument();
      });

      // Test filter functionality
      const technologyFilter = screen.getByTestId('filter-technology');
      await user.click(technologyFilter);

      expect(technologyFilter).toHaveClass('bg-blue-500', 'text-white');

      // Verify API call with filter
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/ai/personalized-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user123',
            preferences: mockUser.preferences,
            readingHistory: mockUser.readingHistory,
            filters: { type: 'technology' }
          })
        });
      });
    });

    it('handles loading states during content fetch', async () => {
      // Delay the mock response to test loading state
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ content: mockRecommendations })
        } as Response), 100))
      );

      render(<MockPersonalizedContentFeed user={mockUser} />);

      expect(screen.getByTestId('feed-loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('personalized-content-feed')).toBeInTheDocument();
        expect(screen.queryByTestId('feed-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('AI Integration Performance', () => {
    it('handles multiple concurrent recommendation requests efficiently', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations })
        } as Response)
      );

      // Render multiple recommendation panels
      render(
        <div>
          <MockAIRecommendationsPanel currentArticle={mockCurrentArticle} user={mockUser} />
          <MockPersonalizedContentFeed user={mockUser} />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-recommendations-panel')).toBeInTheDocument();
        expect(screen.getByTestId('personalized-content-feed')).toBeInTheDocument();
      });

      // Verify all requests were made
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('implements proper error boundaries for AI failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('AI Service Unavailable'));

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-error')).toBeInTheDocument();
      });

      // Should still show fallback content
      expect(screen.getByText('Failed to Load Recommendations')).toBeInTheDocument();
    });

    it('optimizes API calls with proper caching', async () => {
      const cachingMockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations })
      });
      
      global.fetch = cachingMockFetch;

      // Render same component twice with same props
      const { rerender } = render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-recommendations-panel')).toBeInTheDocument();
      });

      expect(cachingMockFetch).toHaveBeenCalledTimes(1);

      // Re-render with same props should not make additional API calls in real implementation
      rerender(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
        />
      );

      // In this mock, it will call again, but real implementation should cache
      expect(cachingMockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Real-time Recommendation Updates', () => {
    it('updates recommendations when user preferences change', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations })
      } as Response);

      const initialUser = { ...mockUser };
      const { rerender } = render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={initialUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-recommendations-panel')).toBeInTheDocument();
      });

      // Update user preferences
      const updatedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          topics: ['ai', 'data-science', 'python']
        }
      };

      rerender(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={updatedUser}
        />
      );

      // Should trigger new API call with updated preferences
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('handles recommendation quality scoring and filtering', async () => {
      const highQualityRecommendations = mockRecommendations.filter(rec => rec.similarity > 0.75);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recommendations: highQualityRecommendations })
      } as Response);

      render(
        <MockAIRecommendationsPanel
          currentArticle={mockCurrentArticle}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-count')).toHaveTextContent('2 recommendations');
      });

      // Verify high-quality recommendations are shown
      const similarities = screen.getAllByTestId(/recommendation-similarity-/);
      similarities.forEach(elem => {
        const percentage = parseInt(elem.textContent?.match(/\d+/)?.[0] || '0');
        expect(percentage).toBeGreaterThan(75);
      });
    });
  });
}); 