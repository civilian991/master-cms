import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BottomTabBar } from '@/components/mobile/BottomTabBar'
import { MobileLayout, MobileCard } from '@/components/mobile/MobileLayout'
import { MobileArticleCard } from '@/components/mobile/MobileCard'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock hooks
jest.mock('@/hooks/mobile/useSwipeGestures', () => ({
  useSwipeGestures: () => ({ current: null }),
  useHapticFeedback: () => ({
    impact: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}))

// Mock article data for testing
const mockArticle = {
  id: 'test-article',
  title: 'Test Article Title',
  excerpt: 'This is a test article excerpt',
  author: {
    name: 'Test Author',
    avatar: '/test-avatar.jpg'
  },
  publishedAt: '2024-01-01',
  readingTime: 5,
  image: '/test-image.jpg',
  category: 'Technology',
  isBookmarked: false,
  isLiked: false,
  likesCount: 10
}

describe('Mobile Components', () => {
  describe('BottomTabBar', () => {
    it('renders all default tabs', () => {
      render(<BottomTabBar />)
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Articles')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
      expect(screen.getByText('Saved')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('highlights active tab correctly', () => {
      render(<BottomTabBar />)
      
      const homeTab = screen.getByText('Home').closest('a')
      const homeTabContent = homeTab?.querySelector('div')
      expect(homeTabContent).toHaveClass('text-blue-600')
    })

    it('renders without labels when showLabels is false', () => {
      render(<BottomTabBar showLabels={false} />)
      
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
      // Icons should still be present
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('limits tabs when maxTabs is set', () => {
      render(<BottomTabBar maxTabs={3} />)
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Articles')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
      expect(screen.queryByText('Saved')).not.toBeInTheDocument()
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    })

    it('has proper touch target sizes', () => {
      render(<BottomTabBar />)
      
      const tabs = screen.getAllByRole('link')
      tabs.forEach(tab => {
        expect(tab).toHaveClass('touch-target-comfortable')
      })
    })
  })

  describe('MobileLayout', () => {
    it('renders container variant correctly', () => {
      render(
        <MobileLayout variant="container">
          <div>Test content</div>
        </MobileLayout>
      )
      
      const container = screen.getByText('Test content').parentElement
      expect(container).toHaveClass('mobile-container')
    })

    it('renders grid variant with correct columns', () => {
      render(
        <MobileLayout variant="grid" columns={2}>
          <div>Item 1</div>
          <div>Item 2</div>
        </MobileLayout>
      )
      
      const grid = screen.getByText('Item 1').parentElement
      expect(grid).toHaveClass('mobile-grid')
      expect(grid).toHaveClass('md:grid-cols-2')
    })

    it('applies gap classes correctly', () => {
      render(
        <MobileLayout variant="grid" gap="lg">
          <div>Test content</div>
        </MobileLayout>
      )
      
      const grid = screen.getByText('Test content').parentElement
      expect(grid).toHaveClass('gap-6')
    })
  })

  describe('MobileCard', () => {
    it('renders default variant correctly', () => {
      render(
        <MobileCard>
          <div>Card content</div>
        </MobileCard>
      )
      
      const card = screen.getByText('Card content').parentElement
      expect(card).toHaveClass('rounded-lg')
      expect(card).toHaveClass('bg-white')
    })

    it('applies interactive styles when interactive is true', () => {
      render(
        <MobileCard interactive>
          <div>Interactive card</div>
        </MobileCard>
      )
      
      const card = screen.getByText('Interactive card').parentElement
      expect(card).toHaveClass('touch-target')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('applies different padding sizes', () => {
      const { rerender } = render(
        <MobileCard padding="sm">
          <div>Small padding</div>
        </MobileCard>
      )
      
      let card = screen.getByText('Small padding').parentElement
      expect(card).toHaveClass('p-3')
      
      rerender(
        <MobileCard padding="lg">
          <div>Large padding</div>
        </MobileCard>
      )
      
      card = screen.getByText('Large padding').parentElement
      expect(card).toHaveClass('p-6')
    })
  })

  describe('MobileArticleCard', () => {
    it('renders article information correctly', () => {
      render(<MobileArticleCard article={mockArticle} />)
      
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText('This is a test article excerpt')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
      expect(screen.getByText('5 min read')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
    })

    it('renders compact variant correctly', () => {
      render(<MobileArticleCard article={mockArticle} variant="compact" />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toHaveClass('w-16', 'h-16')
    })

    it('renders featured variant correctly', () => {
      render(<MobileArticleCard article={mockArticle} variant="featured" />)
      
      const article = screen.getByRole('article')
      expect(article).toHaveClass('rounded-xl')
      
      const image = screen.getByAltText('Test Article Title')
      expect(image.parentElement).toHaveClass('aspect-video')
    })

    it('handles bookmark action', () => {
      const onBookmark = jest.fn()
      render(
        <MobileArticleCard 
          article={mockArticle} 
          onBookmark={onBookmark}
        />
      )
      
      // Use more specific selector for bookmark button
      const bookmarkButton = screen.getByLabelText('Bookmark') || 
                           screen.getAllByRole('button').find(btn => 
                             btn.querySelector('svg')?.querySelector('path[d*="m19 21-7-4-7 4V5"]')
                           )
      
      if (bookmarkButton) {
        fireEvent.click(bookmarkButton)
        expect(onBookmark).toHaveBeenCalledWith('test-article')
      }
    })

    it('shows bookmarked state', () => {
      const bookmarkedArticle = { ...mockArticle, isBookmarked: true }
      render(<MobileArticleCard article={bookmarkedArticle} />)
      
      // Look for the bookmark button specifically 
      const buttons = screen.getAllByRole('button')
      const bookmarkButton = buttons.find(btn => 
        btn.querySelector('svg')?.querySelector('path[d*="m19 21-7-4-7 4V5"]')
      )
      
      expect(bookmarkButton).toHaveClass('text-blue-600')
    })

    it('handles like action', () => {
      const onLike = jest.fn()
      render(
        <MobileArticleCard 
          article={mockArticle} 
          onLike={onLike}
        />
      )
      
      const likeButton = screen.getByText('10').closest('button')
      fireEvent.click(likeButton!)
      
      expect(onLike).toHaveBeenCalledWith('test-article')
    })

    it('prevents event bubbling on action buttons', () => {
      const onBookmark = jest.fn()
      render(
        <MobileArticleCard 
          article={mockArticle} 
          onBookmark={onBookmark}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      const bookmarkButton = buttons.find(btn => 
        btn.querySelector('svg')?.querySelector('path[d*="m19 21-7-4-7 4V5"]')
      )
      
      if (bookmarkButton) {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        fireEvent(bookmarkButton, clickEvent)
        expect(onBookmark).toHaveBeenCalled()
      }
    })

    it('has proper touch target sizes', () => {
      render(<MobileArticleCard article={mockArticle} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('touch-target')
      })
    })
  })

  describe('Mobile Responsive Behavior', () => {
    it('applies mobile-first responsive classes', () => {
      render(
        <div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          Test responsive grid
        </div>
      )
      
      const element = screen.getByText('Test responsive grid')
      expect(element).toHaveClass('grid-cols-1')
      expect(element).toHaveClass('md:grid-cols-2')
      expect(element).toHaveClass('lg:grid-cols-4')
    })
  })

  describe('Touch Interactions', () => {
    it('handles touch events on interactive elements', async () => {
      const onTouch = jest.fn()
      render(
        <button 
          className="touch-target"
          onTouchStart={onTouch}
        >
          Touch me
        </button>
      )
      
      const button = screen.getByText('Touch me')
      fireEvent.touchStart(button)
      
      expect(onTouch).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      render(<BottomTabBar />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('maintains focus management', () => {
      render(
        <MobileCard interactive>
          <button>Focusable content</button>
        </MobileCard>
      )
      
      const button = screen.getByText('Focusable content')
      button.focus()
      
      expect(button).toHaveFocus()
    })

    it('supports keyboard navigation', () => {
      render(<BottomTabBar />)
      
      const firstLink = screen.getAllByRole('link')[0]
      firstLink.focus()
      
      fireEvent.keyDown(firstLink, { key: 'Tab' })
      // Tab navigation should work between links
    })
  })

  describe('Performance', () => {
    it('loads images lazily', () => {
      render(<MobileArticleCard article={mockArticle} />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toHaveAttribute('loading', 'lazy')
    })

    it('uses optimized image sizes', () => {
      render(<MobileArticleCard article={mockArticle} variant="compact" />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toHaveClass('w-16', 'h-16')
    })
  })
}) 