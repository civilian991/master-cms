import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
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
      domain: 'https://example.com',
      locale: 'en'
    }))
  }
}));

// Mock reading interface components
const mockArticle = {
  id: '1',
  title: 'Test Article Title',
  content: `
    <h2>Introduction</h2>
    <p>This is the first paragraph of the test article content.</p>
    <h2>Main Section</h2>
    <p>This is the second paragraph with more detailed content for testing purposes.</p>
    <h3>Subsection</h3>
    <p>This paragraph contains technical details and examples.</p>
    <h2>Conclusion</h2>
    <p>Final thoughts and summary of the article content.</p>
  `,
  excerpt: 'Test article excerpt',
  slug: 'test-article',
  publishedAt: '2024-01-15T10:00:00Z',
  readingTime: 5,
  wordCount: 250,
  author: {
    id: 'author1',
    name: 'John Doe',
    avatar: '/avatars/john.jpg'
  },
  category: {
    id: 'cat1',
    name: 'Technology',
    slug: 'technology'
  },
  tags: [
    { id: 'tag1', name: 'React', slug: 'react' },
    { id: 'tag2', name: 'Testing', slug: 'testing' }
  ]
};

// Mock ArticleReader component
const MockArticleReader = ({ 
  article, 
  onReadingProgress, 
  onTypographyChange,
  readingMode = 'light',
  fontSize = 16,
  lineHeight = 1.6,
  fontFamily = 'serif'
}: any) => {
  const [progress, setProgress] = React.useState(0);
  const [currentSection, setCurrentSection] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 10, 100);
        if (onReadingProgress) {
          onReadingProgress({
            progress: newProgress,
            timeSpent: Math.floor(newProgress / 10),
            wordsRead: Math.floor((article.wordCount * newProgress) / 100),
            currentSection: currentSection
          });
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onReadingProgress, article.wordCount, currentSection]);

  return (
    <div data-testid="article-reader" className={`reading-mode-${readingMode}`}>
      {/* Reading Progress Bar */}
      <div data-testid="reading-progress-bar" className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
          data-testid="progress-indicator"
        />
      </div>

      {/* Typography Controls */}
      <div data-testid="typography-controls" className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <span>Font Size:</span>
            <input
              type="range"
              min="14"
              max="24"
              value={fontSize}
              onChange={(e) => onTypographyChange && onTypographyChange({ fontSize: parseInt(e.target.value) })}
              data-testid="font-size-slider"
            />
            <span data-testid="font-size-value">{fontSize}px</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <span>Line Height:</span>
            <input
              type="range"
              min="1.4"
              max="2.0"
              step="0.1"
              value={lineHeight}
              onChange={(e) => onTypographyChange && onTypographyChange({ lineHeight: parseFloat(e.target.value) })}
              data-testid="line-height-slider"
            />
            <span data-testid="line-height-value">{lineHeight}</span>
          </label>

          <select
            value={fontFamily}
            onChange={(e) => onTypographyChange && onTypographyChange({ fontFamily: e.target.value })}
            data-testid="font-family-select"
          >
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
      </div>

      {/* Reading Mode Selector */}
      <div data-testid="reading-mode-selector" className="mb-6">
        <div className="flex space-x-2">
          {['light', 'dark', 'sepia', 'high-contrast'].map(mode => (
            <button
              key={mode}
              onClick={() => onTypographyChange && onTypographyChange({ readingMode: mode })}
              className={`px-3 py-1 rounded ${readingMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              data-testid={`reading-mode-${mode}`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Contents */}
      <div data-testid="table-of-contents" className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Table of Contents</h3>
        <nav>
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setCurrentSection(0)}
                className={`text-left hover:text-blue-500 ${currentSection === 0 ? 'text-blue-500 font-medium' : ''}`}
                data-testid="toc-introduction"
              >
                Introduction
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentSection(1)}
                className={`text-left hover:text-blue-500 ${currentSection === 1 ? 'text-blue-500 font-medium' : ''}`}
                data-testid="toc-main-section"
              >
                Main Section
              </button>
            </li>
            <li className="ml-4">
              <button 
                onClick={() => setCurrentSection(2)}
                className={`text-left hover:text-blue-500 ${currentSection === 2 ? 'text-blue-500 font-medium' : ''}`}
                data-testid="toc-subsection"
              >
                Subsection
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentSection(3)}
                className={`text-left hover:text-blue-500 ${currentSection === 3 ? 'text-blue-500 font-medium' : ''}`}
                data-testid="toc-conclusion"
              >
                Conclusion
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Article Content */}
      <article 
        className="prose max-w-none"
        style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily }}
        data-testid="article-content"
      >
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4" data-testid="article-title">
            {article.title}
          </h1>
          <div className="flex items-center space-x-4 text-gray-600 mb-4">
            <div className="flex items-center space-x-2">
              <img 
                src={article.author.avatar} 
                alt={article.author.name}
                className="w-8 h-8 rounded-full"
              />
              <span data-testid="article-author">{article.author.name}</span>
            </div>
            <span data-testid="reading-time">{article.readingTime} min read</span>
            <span data-testid="word-count">{article.wordCount} words</span>
          </div>
        </header>

        <div 
          dangerouslySetInnerHTML={{ __html: article.content }}
          data-testid="article-body"
        />
      </article>

      {/* Reading Statistics */}
      <div data-testid="reading-statistics" className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Reading Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Progress:</span>
            <span className="ml-2 font-medium" data-testid="progress-percentage">{progress}%</span>
          </div>
          <div>
            <span className="text-gray-600">Time Spent:</span>
            <span className="ml-2 font-medium" data-testid="time-spent">{Math.floor(progress / 10)}m</span>
          </div>
          <div>
            <span className="text-gray-600">Words Read:</span>
            <span className="ml-2 font-medium" data-testid="words-read">
              {Math.floor((article.wordCount * progress) / 100)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Current Section:</span>
            <span className="ml-2 font-medium" data-testid="current-section">{currentSection + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock BookmarkButton component
const MockBookmarkButton = ({ articleId, isBookmarked: initialBookmarked = false, onBookmark }: any) => {
  const [isBookmarked, setIsBookmarked] = React.useState(initialBookmarked);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleBookmark = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setIsBookmarked(!isBookmarked);
      if (onBookmark) {
        onBookmark(!isBookmarked);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isBookmarked ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      data-testid="bookmark-button"
    >
      <span data-testid="bookmark-icon">
        {isBookmarked ? '★' : '☆'}
      </span>
      <span data-testid="bookmark-text">
        {isLoading ? 'Saving...' : isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </span>
    </button>
  );
};

// Mock AudioPlayer component
const MockAudioPlayer = ({ content, isPlaying: initialPlaying = false, onPlayStateChange }: any) => {
  const [isPlaying, setIsPlaying] = React.useState(initialPlaying);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(300); // 5 minutes
  const [playbackRate, setPlaybackRate] = React.useState(1.0);
  const [selectedVoice, setSelectedVoice] = React.useState('female');

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = Math.min(prev + 1, duration);
          if (newTime >= duration) {
            setIsPlaying(false);
            if (onPlayStateChange) onPlayStateChange(false);
          }
          return newTime;
        });
      }, 1000 / playbackRate);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, duration, onPlayStateChange]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (onPlayStateChange) onPlayStateChange(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div data-testid="audio-player" className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Audio Playback</h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm">
            Voice:
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="ml-2 text-sm"
              data-testid="voice-selector"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="child">Child</option>
            </select>
          </label>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center space-x-4 mb-3">
        <button
          onClick={togglePlay}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          data-testid="play-pause-button"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm" data-testid="current-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseInt(e.target.value))}
            className="flex-1"
            data-testid="progress-slider"
          />
          <span className="text-sm" data-testid="total-duration">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm">Speed:</span>
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="text-sm"
            data-testid="playback-rate-selector"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>
      </div>

      {/* Audio Progress Indicator */}
      <div className="text-sm text-gray-600" data-testid="audio-status">
        {isPlaying ? `Playing at ${playbackRate}x speed with ${selectedVoice} voice` : 'Audio paused'}
      </div>
    </div>
  );
};

describe('Reading Interface Components', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('ArticleReader Component', () => {
    it('renders article content with proper typography', () => {
      const onReadingProgress = jest.fn();
      const onTypographyChange = jest.fn();

      render(
        <MockArticleReader
          article={mockArticle}
          onReadingProgress={onReadingProgress}
          onTypographyChange={onTypographyChange}
        />
      );

      expect(screen.getByTestId('article-reader')).toBeInTheDocument();
      expect(screen.getByTestId('article-title')).toHaveTextContent('Test Article Title');
      expect(screen.getByTestId('article-author')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('reading-time')).toHaveTextContent('5 min read');
      expect(screen.getByTestId('word-count')).toHaveTextContent('250 words');
    });

    it('displays and updates reading progress correctly', async () => {
      const onReadingProgress = jest.fn();

      render(
        <MockArticleReader
          article={mockArticle}
          onReadingProgress={onReadingProgress}
        />
      );

      const progressBar = screen.getByTestId('progress-indicator');
      expect(progressBar).toHaveStyle('width: 0%');

      // Wait for progress to update
      await waitFor(() => {
        expect(screen.getByTestId('progress-percentage')).toHaveTextContent('10%');
      }, { timeout: 2000 });

      expect(onReadingProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 10,
          timeSpent: 1,
          wordsRead: 25,
          currentSection: 0
        })
      );
    });

    it('allows typography customization', async () => {
      const onTypographyChange = jest.fn();

      render(
        <MockArticleReader
          article={mockArticle}
          onTypographyChange={onTypographyChange}
          fontSize={18}
          lineHeight={1.8}
          fontFamily="sans-serif"
        />
      );

      const articleContent = screen.getByTestId('article-content');
      expect(articleContent).toHaveStyle({
        fontSize: '18px',
        lineHeight: '1.8',
        fontFamily: 'sans-serif'
      });

      // Test font size adjustment
      const fontSizeSlider = screen.getByTestId('font-size-slider');
      await user.click(fontSizeSlider);
      fireEvent.change(fontSizeSlider, { target: { value: '20' } });

      expect(onTypographyChange).toHaveBeenCalledWith({ fontSize: 20 });
    });

    it('provides interactive table of contents', async () => {
      render(<MockArticleReader article={mockArticle} />);

      const toc = screen.getByTestId('table-of-contents');
      expect(toc).toBeInTheDocument();

      const introButton = screen.getByTestId('toc-introduction');
      const mainSectionButton = screen.getByTestId('toc-main-section');

      expect(introButton).toHaveClass('text-blue-500', 'font-medium');
      expect(mainSectionButton).not.toHaveClass('text-blue-500');

      await user.click(mainSectionButton);
      expect(screen.getByTestId('current-section')).toHaveTextContent('2');
    });

    it('supports different reading modes', async () => {
      const onTypographyChange = jest.fn();

      render(
        <MockArticleReader
          article={mockArticle}
          onTypographyChange={onTypographyChange}
          readingMode="light"
        />
      );

      const reader = screen.getByTestId('article-reader');
      expect(reader).toHaveClass('reading-mode-light');

      const darkModeButton = screen.getByTestId('reading-mode-dark');
      await user.click(darkModeButton);

      expect(onTypographyChange).toHaveBeenCalledWith({ readingMode: 'dark' });
    });

    it('displays reading statistics accurately', async () => {
      render(<MockArticleReader article={mockArticle} />);

      const statistics = screen.getByTestId('reading-statistics');
      expect(statistics).toBeInTheDocument();

      // Initial state
      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('time-spent')).toHaveTextContent('0m');
      expect(screen.getByTestId('words-read')).toHaveTextContent('0');

      // Wait for progress update
      await waitFor(() => {
        expect(screen.getByTestId('progress-percentage')).toHaveTextContent('10%');
        expect(screen.getByTestId('words-read')).toHaveTextContent('25');
      }, { timeout: 2000 });
    });
  });

  describe('BookmarkButton Component', () => {
    it('renders bookmark button with correct initial state', () => {
      render(<MockBookmarkButton articleId="1" isBookmarked={false} />);

      const button = screen.getByTestId('bookmark-button');
      const icon = screen.getByTestId('bookmark-icon');
      const text = screen.getByTestId('bookmark-text');

      expect(button).toBeInTheDocument();
      expect(icon).toHaveTextContent('☆');
      expect(text).toHaveTextContent('Bookmark');
    });

    it('toggles bookmark state on click', async () => {
      const onBookmark = jest.fn();

      render(
        <MockBookmarkButton
          articleId="1"
          isBookmarked={false}
          onBookmark={onBookmark}
        />
      );

      const button = screen.getByTestId('bookmark-button');
      await user.click(button);

      expect(screen.getByTestId('bookmark-text')).toHaveTextContent('Saving...');

      await waitFor(() => {
        expect(screen.getByTestId('bookmark-icon')).toHaveTextContent('★');
        expect(screen.getByTestId('bookmark-text')).toHaveTextContent('Bookmarked');
      });

      expect(onBookmark).toHaveBeenCalledWith(true);
    });

    it('shows bookmarked state correctly', () => {
      render(<MockBookmarkButton articleId="1" isBookmarked={true} />);

      expect(screen.getByTestId('bookmark-icon')).toHaveTextContent('★');
      expect(screen.getByTestId('bookmark-text')).toHaveTextContent('Bookmarked');
    });

    it('handles loading state during bookmark action', async () => {
      render(<MockBookmarkButton articleId="1" isBookmarked={false} />);

      const button = screen.getByTestId('bookmark-button');
      await user.click(button);

      expect(button).toBeDisabled();
      expect(screen.getByTestId('bookmark-text')).toHaveTextContent('Saving...');

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('AudioPlayer Component', () => {
    it('renders audio player with controls', () => {
      render(<MockAudioPlayer content="Test content" />);

      expect(screen.getByTestId('audio-player')).toBeInTheDocument();
      expect(screen.getByTestId('play-pause-button')).toHaveTextContent('Play');
      expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
      expect(screen.getByTestId('playback-rate-selector')).toBeInTheDocument();
    });

    it('controls playback state correctly', async () => {
      const onPlayStateChange = jest.fn();

      render(
        <MockAudioPlayer
          content="Test content"
          onPlayStateChange={onPlayStateChange}
        />
      );

      const playButton = screen.getByTestId('play-pause-button');
      expect(playButton).toHaveTextContent('Play');

      await user.click(playButton);

      expect(playButton).toHaveTextContent('Pause');
      expect(onPlayStateChange).toHaveBeenCalledWith(true);
      expect(screen.getByTestId('audio-status')).toHaveTextContent('Playing at 1x speed');
    });

    it('updates progress during playback', async () => {
      render(<MockAudioPlayer content="Test content" isPlaying={true} />);

      const currentTimeElement = screen.getByTestId('current-time');
      expect(currentTimeElement).toHaveTextContent('0:00');

      await waitFor(() => {
        expect(currentTimeElement).toHaveTextContent('0:01');
      }, { timeout: 2000 });
    });

    it('allows voice and speed customization', async () => {
      render(<MockAudioPlayer content="Test content" />);

      const voiceSelector = screen.getByTestId('voice-selector');
      const speedSelector = screen.getByTestId('playback-rate-selector');

      await user.selectOptions(voiceSelector, 'male');
      await user.selectOptions(speedSelector, '1.5');

      expect(voiceSelector).toHaveValue('male');
      expect(speedSelector).toHaveValue('1.5');
    });

    it('handles progress slider interaction', async () => {
      render(<MockAudioPlayer content="Test content" />);

      const progressSlider = screen.getByTestId('progress-slider');
      fireEvent.change(progressSlider, { target: { value: '150' } });

      expect(screen.getByTestId('current-time')).toHaveTextContent('2:30');
    });

    it('shows correct time formatting', () => {
      render(<MockAudioPlayer content="Test content" />);

      expect(screen.getByTestId('current-time')).toHaveTextContent('0:00');
      expect(screen.getByTestId('total-duration')).toHaveTextContent('5:00');
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper ARIA labels and semantic HTML', () => {
      render(<MockArticleReader article={mockArticle} />);

      const articleElement = screen.getByTestId('article-content');
      expect(articleElement.tagName.toLowerCase()).toBe('article');

      const progressBar = screen.getByTestId('reading-progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('supports keyboard navigation for controls', async () => {
      render(<MockArticleReader article={mockArticle} />);

      const fontSizeSlider = screen.getByTestId('font-size-slider');
      fontSizeSlider.focus();
      expect(fontSizeSlider).toHaveFocus();

      // Test keyboard navigation
      await user.keyboard('{ArrowRight}');
      expect((fontSizeSlider as HTMLInputElement).value).toBe('16');
    });

    it('maintains focus management in table of contents', async () => {
      render(<MockArticleReader article={mockArticle} />);

      const tocIntro = screen.getByTestId('toc-introduction');
      const tocMain = screen.getByTestId('toc-main-section');

      tocIntro.focus();
      expect(tocIntro).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(tocMain).toHaveFocus();
    });

    it('provides audio player accessibility features', () => {
      render(<MockAudioPlayer content="Test content" />);

      const playButton = screen.getByTestId('play-pause-button');
      const progressSlider = screen.getByTestId('progress-slider');

      expect(playButton).toBeInTheDocument();
      expect(progressSlider).toHaveAttribute('type', 'range');
    });
  });

  describe('Performance and Loading States', () => {
    it('handles loading states gracefully', async () => {
      render(<MockBookmarkButton articleId="1" isBookmarked={false} />);

      const button = screen.getByTestId('bookmark-button');
      await user.click(button);

      expect(screen.getByTestId('bookmark-text')).toHaveTextContent('Saving...');
      expect(button).toBeDisabled();
    });

    it('updates reading progress without performance issues', async () => {
      const onReadingProgress = jest.fn();

      render(
        <MockArticleReader
          article={mockArticle}
          onReadingProgress={onReadingProgress}
        />
      );

      // Wait for multiple progress updates
      await waitFor(() => {
        expect(onReadingProgress).toHaveBeenCalledTimes(1);
      }, { timeout: 2000 });

      // Verify performance is maintained
      expect(onReadingProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: expect.any(Number),
          timeSpent: expect.any(Number),
          wordsRead: expect.any(Number)
        })
      );
    });

    it('efficiently renders large content without blocking', () => {
      const largeArticle = {
        ...mockArticle,
        content: Array(100).fill('<p>Large content paragraph for performance testing.</p>').join(''),
        wordCount: 1000
      };

      const start = performance.now();
      render(<MockArticleReader article={largeArticle} />);
      const end = performance.now();

      // Should render within reasonable time (100ms)
      expect(end - start).toBeLessThan(100);
      expect(screen.getByTestId('article-content')).toBeInTheDocument();
    });
  });
}); 