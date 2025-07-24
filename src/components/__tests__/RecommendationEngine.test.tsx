import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { RecommendationEngine } from '../personalization/RecommendationEngine'

// Mock fetch
global.fetch = vi.fn()

// Mock components
vi.mock('../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>
}))

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('../ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  )
}))

vi.mock('../ui/progress', () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value} />
  )
}))

vi.mock('../ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value} onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-value={value}>{children}</button>
  )
}))

describe('RecommendationEngine', () => {
  const mockRecommendations = [
    {
      id: '1',
      title: 'Advanced Machine Learning Techniques',
      excerpt: 'Learn about cutting-edge ML algorithms',
      author: 'Dr. Sarah Chen',
      publishedAt: '2024-01-15T10:30:00Z',
      readingTime: 12,
      category: 'AI Security',
      tags: ['Machine Learning', 'AI'],
      rating: 4.8,
      views: 2847,
      language: 'en',
      difficulty: 'advanced',
      confidenceScore: 0.94,
      reasonCode: 'similar_content'
    },
    {
      id: '2',
      title: 'Cloud Infrastructure Best Practices',
      excerpt: 'Building resilient cloud architectures',
      author: 'Michael Rodriguez',
      publishedAt: '2024-01-14T16:20:00Z',
      readingTime: 8,
      category: 'Cloud Computing',
      tags: ['Cloud', 'Infrastructure'],
      rating: 4.6,
      views: 1923,
      language: 'en',
      difficulty: 'intermediate',
      confidenceScore: 0.87,
      reasonCode: 'author_preference'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations })
    })
  })

  it('renders recommendation engine with title', () => {
    render(<RecommendationEngine userId="test-user" />)
    
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument()
    expect(screen.getByText(/Discover content tailored to your interests/)).toBeInTheDocument()
  })

  it('loads and displays recommendations', async () => {
    render(<RecommendationEngine userId="test-user" />)
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Machine Learning Techniques')).toBeInTheDocument()
      expect(screen.getByText('Cloud Infrastructure Best Practices')).toBeInTheDocument()
    })
  })

  it('displays confidence scores', async () => {
    render(<RecommendationEngine userId="test-user" />)
    
    await waitFor(() => {
      expect(screen.getByText('94% match')).toBeInTheDocument()
      expect(screen.getByText('87% match')).toBeInTheDocument()
    })
  })

  it('shows reasoning for recommendations', async () => {
    render(<RecommendationEngine showReasonings={true} userId="test-user" />)
    
    await waitFor(() => {
      expect(screen.getByText(/Similar to articles you've read/)).toBeInTheDocument()
      expect(screen.getByText(/Author you follow/)).toBeInTheDocument()
    })
  })

  it('handles like interaction', async () => {
    render(<RecommendationEngine userId="test-user" />)
    
    await waitFor(() => {
      const likeButtons = screen.getAllByText('👍')
      fireEvent.click(likeButtons[0])
    })
    
    // Should update interaction state
    expect(screen.getByTestId('like-button-1')).toHaveClass('liked')
  })

  it('handles dislike interaction', async () => {
    render(<RecommendationEngine userId="test-user" />)
    
    await waitFor(() => {
      const dislikeButtons = screen.getAllByText('👎')
      fireEvent.click(dislikeButtons[0])
    })
    
    // Should update interaction state
    expect(screen.getByTestId('dislike-button-1')).toHaveClass('disliked')
  })

  it('refreshes recommendations', async () => {
    render(<RecommendationEngine userId="test-user" />)
    
    const refreshButton = screen.getByTestId('refresh-button')
    fireEvent.click(refreshButton)
    
    expect(global.fetch).toHaveBeenCalledTimes(2) // Initial load + refresh
  })

  it('switches between recommendation tabs', async () => {
    render(<RecommendationEngine userId="test-user" />)
    
    const trendingTab = screen.getByText('Trending')
    fireEvent.click(trendingTab)
    
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'trending')
  })

  it('displays loading state', () => {
    // Mock delayed response
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )
    
    render(<RecommendationEngine userId="test-user" />)
    
    expect(screen.getAllByTestId('loading-card')).toHaveLength(3)
  })

  it('handles API error gracefully', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('API Error'))
    
    render(<RecommendationEngine userId="test-user" />)
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading recommendations/)).toBeInTheDocument()
    })
  })

  it('respects maxRecommendations prop', async () => {
    render(<RecommendationEngine userId="test-user" maxRecommendations={1} />)
    
    await waitFor(() => {
      const articleCards = screen.getAllByTestId('recommendation-card')
      expect(articleCards).toHaveLength(1)
    })
  })

  it('filters by current article', async () => {
    render(
      <RecommendationEngine 
        userId="test-user" 
        currentArticleId="1"
      />
    )
    
    await waitFor(() => {
      // Should not show the current article in recommendations
      expect(screen.queryByText('Advanced Machine Learning Techniques')).not.toBeInTheDocument()
    })
  })
})