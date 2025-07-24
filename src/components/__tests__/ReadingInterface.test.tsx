import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ReadingInterface } from '../reading/ReadingInterface'

// Mock components
vi.mock('../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>
}))

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}))

vi.mock('../ui/slider', () => ({
  Slider: ({ value, onValueChange, ...props }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      data-testid="slider"
      {...props}
    />
  )
}))

describe('ReadingInterface', () => {
  const mockArticle = {
    id: '1',
    title: 'Test Article',
    content: '<p>This is a test article content.</p>',
    author: 'Test Author',
    publishedAt: '2024-01-15',
    readingTime: 5,
    category: 'Technology'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders article title and content', () => {
    render(<ReadingInterface article={mockArticle} />)
    
    expect(screen.getByText('Test Article')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
  })

  it('changes reading mode when buttons are clicked', async () => {
    render(<ReadingInterface article={mockArticle} />)
    
    const focusModeButton = screen.getByText(/Focus Mode/i)
    fireEvent.click(focusModeButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('reading-interface')).toHaveClass('focus-mode')
    })
  })

  it('adjusts font size with slider', async () => {
    render(<ReadingInterface article={mockArticle} />)
    
    const fontSizeSlider = screen.getByTestId('slider')
    fireEvent.change(fontSizeSlider, { target: { value: '20' } })
    
    await waitFor(() => {
      const contentElement = screen.getByTestId('article-content')
      expect(contentElement).toHaveStyle('font-size: 20px')
    })
  })

  it('toggles dark mode', async () => {
    render(<ReadingInterface article={mockArticle} />)
    
    const darkModeToggle = screen.getByText(/Dark Mode/i)
    fireEvent.click(darkModeToggle)
    
    await waitFor(() => {
      expect(screen.getByTestId('reading-interface')).toHaveClass('dark')
    })
  })

  it('displays progress indicator', () => {
    render(<ReadingInterface article={mockArticle} showProgress={true} />)
    
    expect(screen.getByTestId('reading-progress')).toBeInTheDocument()
  })

  it('calls onComplete when article is finished', async () => {
    const onComplete = vi.fn()
    render(<ReadingInterface article={mockArticle} onComplete={onComplete} />)
    
    // Simulate scrolling to bottom
    const contentElement = screen.getByTestId('article-content')
    Object.defineProperty(contentElement, 'scrollTop', { value: 1000, writable: true })
    Object.defineProperty(contentElement, 'scrollHeight', { value: 1000, writable: true })
    Object.defineProperty(contentElement, 'clientHeight', { value: 500, writable: true })
    
    fireEvent.scroll(contentElement)
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(mockArticle.id)
    })
  })

  it('saves reading settings to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    render(<ReadingInterface article={mockArticle} />)
    
    const fontSizeSlider = screen.getByTestId('slider')
    fireEvent.change(fontSizeSlider, { target: { value: '18' } })
    
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        'reading-settings',
        expect.stringContaining('"fontSize":18')
      )
    })
  })
})