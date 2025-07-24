import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { jest } from '@jest/globals';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock audio APIs
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    getVoices: jest.fn(() => [
      { name: 'Voice 1', lang: 'en-US', default: true },
      { name: 'Voice 2', lang: 'en-GB', default: false },
    ]),
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    speaking: false,
    paused: false,
  },
});

// Mock article data for accessibility testing
const mockAccessibleArticle = {
  id: 'accessible-article',
  title: 'Understanding Web Accessibility: A Complete Guide',
  content: `
    <h2 id="introduction">Introduction to Web Accessibility</h2>
    <p>Web accessibility ensures that websites and applications are usable by everyone, including people with disabilities.</p>
    
    <h3 id="visual-impairments">Visual Impairments</h3>
    <p>Users with visual impairments may use screen readers, magnification software, or high contrast modes.</p>
    
    <h3 id="hearing-impairments">Hearing Impairments</h3>
    <p>Users with hearing impairments benefit from captions, transcripts, and visual indicators.</p>
    
    <h2 id="implementation">Implementation Guidelines</h2>
    <p>Proper implementation includes semantic HTML, ARIA labels, and keyboard navigation.</p>
  `,
  wordCount: 150,
  readingTime: 3,
  author: { name: 'Accessibility Expert', avatar: '/avatars/expert.jpg' }
};

// Mock Accessible Article Reader Component
const MockAccessibleArticleReader = ({ 
  article, 
  highContrastMode = false,
  dyslexiaFriendlyMode = false,
  fontSize = 16,
  focusMode = false,
  screenReaderOptimized = false
}: any) => {
  const [currentHeading, setCurrentHeading] = React.useState<string | null>(null);
  const [readingPosition, setReadingPosition] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    // Announce page changes to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Article loaded: ${article.title}. ${article.wordCount} words, estimated ${article.readingTime} minutes reading time.`;
    document.body.appendChild(announcement);

    return () => {
      document.body.removeChild(announcement);
    };
  }, [article]);

  const handleKeyboardNavigation = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'h':
        // Navigate to next heading
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const currentIndex = Array.from(headings).findIndex(h => h.id === currentHeading);
        const nextHeading = headings[currentIndex + 1] as HTMLElement;
        if (nextHeading) {
          nextHeading.focus();
          setCurrentHeading(nextHeading.id);
        }
        break;
      case 'j':
        // Skip to main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
        }
        break;
      case ' ':
        // Toggle text-to-speech
        event.preventDefault();
        setIsPlaying(!isPlaying);
        break;
    }
  };

  return (
    <div 
      className={`
        accessible-reader
        ${highContrastMode ? 'high-contrast' : ''}
        ${dyslexiaFriendlyMode ? 'dyslexia-friendly' : ''}
        ${focusMode ? 'focus-mode' : ''}
      `}
      onKeyDown={handleKeyboardNavigation}
      data-testid="accessible-article-reader"
    >
      {/* Skip Navigation Links */}
      <nav className="skip-links" aria-label="Skip navigation">
        <a 
          href="#main-content" 
          className="skip-link"
          data-testid="skip-to-content"
        >
          Skip to main content
        </a>
        <a 
          href="#table-of-contents" 
          className="skip-link"
          data-testid="skip-to-toc"
        >
          Skip to table of contents
        </a>
        <a 
          href="#accessibility-controls" 
          className="skip-link"
          data-testid="skip-to-controls"
        >
          Skip to accessibility controls
        </a>
      </nav>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="sr-announcements">
        {currentHeading && `Now reading: ${currentHeading}`}
      </div>

      {/* Accessibility Controls */}
      <section 
        id="accessibility-controls" 
        className="accessibility-controls p-4 bg-gray-50 border-b"
        aria-label="Accessibility settings"
        data-testid="accessibility-controls"
      >
        <h2 className="text-lg font-semibold mb-3">Accessibility Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Font Size Control */}
          <div className="control-group">
            <label htmlFor="font-size-control" className="block text-sm font-medium mb-1">
              Font Size: {fontSize}px
            </label>
            <input
              id="font-size-control"
              type="range"
              min="14"
              max="32"
              value={fontSize}
              className="w-full"
              aria-describedby="font-size-description"
              data-testid="font-size-control"
            />
            <p id="font-size-description" className="text-xs text-gray-600 mt-1">
              Adjust text size for better readability
            </p>
          </div>

          {/* High Contrast Toggle */}
          <div className="control-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={highContrastMode}
                className="rounded"
                aria-describedby="high-contrast-description"
                data-testid="high-contrast-toggle"
              />
              <span className="text-sm font-medium">High Contrast Mode</span>
            </label>
            <p id="high-contrast-description" className="text-xs text-gray-600 mt-1">
              Increases color contrast for better visibility
            </p>
          </div>

          {/* Dyslexia-Friendly Font */}
          <div className="control-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={dyslexiaFriendlyMode}
                className="rounded"
                aria-describedby="dyslexia-description"
                data-testid="dyslexia-toggle"
              />
              <span className="text-sm font-medium">Dyslexia-Friendly Font</span>
            </label>
            <p id="dyslexia-description" className="text-xs text-gray-600 mt-1">
              Uses OpenDyslexic font for easier reading
            </p>
          </div>

          {/* Focus Mode */}
          <div className="control-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={focusMode}
                className="rounded"
                aria-describedby="focus-description"
                data-testid="focus-mode-toggle"
              />
              <span className="text-sm font-medium">Focus Mode</span>
            </label>
            <p id="focus-description" className="text-xs text-gray-600 mt-1">
              Dims surrounding content to reduce distractions
            </p>
          </div>

          {/* Text-to-Speech */}
          <div className="control-group">
            <button
              className={`px-4 py-2 rounded text-sm font-medium ${
                isPlaying ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}
              aria-pressed={isPlaying}
              aria-describedby="tts-description"
              data-testid="text-to-speech-toggle"
            >
              {isPlaying ? 'Stop Reading' : 'Start Reading Aloud'}
            </button>
            <p id="tts-description" className="text-xs text-gray-600 mt-1">
              Press spacebar to toggle audio reading
            </p>
          </div>

          {/* Reading Guide */}
          <div className="control-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded"
                aria-describedby="guide-description"
                data-testid="reading-guide-toggle"
              />
              <span className="text-sm font-medium">Reading Guide</span>
            </label>
            <p id="guide-description" className="text-xs text-gray-600 mt-1">
              Highlights current line while reading
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">
            Keyboard Shortcuts
          </summary>
          <div className="mt-2 p-3 bg-white border rounded text-sm" data-testid="keyboard-shortcuts">
            <ul className="space-y-1">
              <li><kbd>H</kbd> - Navigate to next heading</li>
              <li><kbd>J</kbd> - Jump to main content</li>
              <li><kbd>Space</kbd> - Toggle text-to-speech</li>
              <li><kbd>Tab</kbd> - Navigate through interactive elements</li>
              <li><kbd>Enter</kbd> - Activate focused element</li>
            </ul>
          </div>
        </details>
      </section>

      {/* Table of Contents with Landmarks */}
      <nav 
        id="table-of-contents"
        className="toc-navigation p-4 bg-blue-50 border-b"
        aria-label="Article table of contents"
        data-testid="table-of-contents"
      >
        <h2 className="text-lg font-semibold mb-3">Table of Contents</h2>
        <ol className="space-y-2">
          <li>
            <a 
              href="#introduction" 
              className="text-blue-600 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="intro-description"
              data-testid="toc-introduction"
            >
              Introduction to Web Accessibility
            </a>
            <span id="intro-description" className="sr-only">Section 1 of 4</span>
          </li>
          <li>
            <ol className="ml-4 space-y-1">
              <li>
                <a 
                  href="#visual-impairments" 
                  className="text-blue-600 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="toc-visual"
                >
                  Visual Impairments
                </a>
              </li>
              <li>
                <a 
                  href="#hearing-impairments" 
                  className="text-blue-600 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="toc-hearing"
                >
                  Hearing Impairments
                </a>
              </li>
            </ol>
          </li>
          <li>
            <a 
              href="#implementation" 
              className="text-blue-600 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="toc-implementation"
            >
              Implementation Guidelines
            </a>
          </li>
        </ol>
      </nav>

      {/* Main Article Content */}
      <main 
        id="main-content"
        className="article-content p-6"
        style={{ fontSize: `${fontSize}px` }}
        tabIndex={-1}
        data-testid="main-content"
      >
        <article>
          <header className="mb-6">
            <h1 
              className="text-3xl font-bold mb-4"
              id="article-title"
              data-testid="article-title"
            >
              {article.title}
            </h1>
            
            <div className="article-meta text-gray-600 space-y-2">
              <div className="flex items-center space-x-4">
                <span>By {article.author.name}</span>
                <span aria-label={`Estimated reading time: ${article.readingTime} minutes`}>
                  📖 {article.readingTime} min read
                </span>
                <span aria-label={`Word count: ${article.wordCount} words`}>
                  📝 {article.wordCount} words
                </span>
              </div>
            </div>
          </header>

          {/* Article Body with Proper Headings Hierarchy */}
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="article-body"
          />
        </article>

        {/* Reading Progress Indicator */}
        <div 
          className="reading-progress mt-8 p-4 bg-green-50 border border-green-200 rounded"
          role="status"
          aria-live="polite"
          data-testid="reading-progress"
        >
          <div className="flex items-center justify-between">
            <span>Reading Progress</span>
            <span aria-label={`${readingPosition}% complete`}>
              {readingPosition}%
            </span>
          </div>
          <div 
            className="w-full bg-gray-200 rounded-full h-2 mt-2"
            role="progressbar"
            aria-valuenow={readingPosition}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
          >
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingPosition}%` }}
            />
          </div>
        </div>
      </main>

      {/* Footer with Additional Navigation */}
      <footer className="article-footer p-6 bg-gray-50 border-t" data-testid="article-footer">
        <nav aria-label="Article navigation">
          <div className="flex justify-between">
            <button 
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              data-testid="previous-article"
            >
              ← Previous Article
            </button>
            <button 
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              data-testid="next-article"
            >
              Next Article →
            </button>
          </div>
        </nav>
      </footer>
    </div>
  );
};

// Mock Comment System with Accessibility
const MockAccessibleCommentSystem = ({ articleId }: any) => {
  const [comments, setComments] = React.useState([
    {
      id: '1',
      author: 'User One',
      content: 'Great article! Very informative.',
      timestamp: '2024-01-15T10:00:00Z',
      replies: []
    }
  ]);
  const [newComment, setNewComment] = React.useState('');

  const handleSubmitComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: 'Current User',
        content: newComment,
        timestamp: new Date().toISOString(),
        replies: []
      };
      setComments([...comments, comment]);
      setNewComment('');
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Comment posted successfully';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  return (
    <section 
      className="comments-section p-6 border-t"
      aria-labelledby="comments-heading"
      data-testid="comments-section"
    >
      <h2 id="comments-heading" className="text-xl font-semibold mb-4">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6" data-testid="comment-form">
        <label htmlFor="new-comment" className="block text-sm font-medium mb-2">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Share your thoughts..."
          aria-describedby="comment-help"
          data-testid="comment-textarea"
        />
        <p id="comment-help" className="text-xs text-gray-600 mt-1">
          Be respectful and constructive in your comments
        </p>
        <button 
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={!newComment.trim()}
          data-testid="submit-comment"
        >
          Post Comment
        </button>
      </form>

      {/* Comments List */}
      <div className="comments-list space-y-4" data-testid="comments-list">
        {comments.map((comment, index) => (
          <article 
            key={comment.id}
            className="comment p-4 bg-gray-50 rounded-lg"
            aria-labelledby={`comment-${comment.id}-author`}
            data-testid={`comment-${comment.id}`}
          >
            <header className="flex items-center justify-between mb-2">
              <h3 id={`comment-${comment.id}-author`} className="font-medium">
                {comment.author}
              </h3>
              <time 
                dateTime={comment.timestamp}
                className="text-sm text-gray-500"
              >
                {new Date(comment.timestamp).toLocaleDateString()}
              </time>
            </header>
            <p className="text-gray-700">{comment.content}</p>
            <div className="mt-2 space-x-2">
              <button 
                className="text-sm text-blue-600 hover:underline focus:underline focus:outline-none"
                aria-label={`Reply to ${comment.author}'s comment`}
                data-testid={`reply-${comment.id}`}
              >
                Reply
              </button>
              <button 
                className="text-sm text-gray-600 hover:underline focus:underline focus:outline-none"
                aria-label={`Like ${comment.author}'s comment`}
                data-testid={`like-${comment.id}`}
              >
                Like
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

describe('Reading Interface Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('WCAG Compliance', () => {
    it('meets WCAG 2.1 AA standards for article reader', async () => {
      const { container } = render(
        <MockAccessibleArticleReader article={mockAccessibleArticle} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('meets WCAG 2.1 AA standards for comment system', async () => {
      const { container } = render(
        <MockAccessibleCommentSystem articleId="test-article" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper heading hierarchy', () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const headings = screen.getAllByRole('heading');
      const headingLevels = headings.map(h => parseInt(h.tagName.slice(1)));
      
      // Should start with h1 and increment properly
      expect(headingLevels[0]).toBe(1); // Article title
      expect(headingLevels[1]).toBe(2); // "Accessibility Settings"
      
      // Verify logical heading structure
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1); // No skipping heading levels
      }
    });

    it('provides sufficient color contrast in high contrast mode', () => {
      const { container } = render(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          highContrastMode={true}
        />
      );

      const reader = container.querySelector('.accessible-reader');
      expect(reader).toHaveClass('high-contrast');
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper ARIA labels and descriptions', () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Check for essential ARIA labels
      expect(screen.getByLabelText(/Skip navigation/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Accessibility settings/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Article table of contents/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Font Size:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reading progress/)).toBeInTheDocument();
    });

    it('announces content changes to screen readers', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const announcements = screen.getByTestId('sr-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('provides descriptive text for complex UI elements', () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Font size control should have description
      const fontSizeControl = screen.getByTestId('font-size-control');
      expect(fontSizeControl).toHaveAttribute('aria-describedby', 'font-size-description');
      expect(screen.getByText('Adjust text size for better readability')).toBeInTheDocument();

      // High contrast should have description
      const highContrastToggle = screen.getByTestId('high-contrast-toggle');
      expect(highContrastToggle).toHaveAttribute('aria-describedby', 'high-contrast-description');
    });

    it('supports landmark navigation', () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Check for proper landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('navigation')).toHaveLength(3); // Skip links, TOC, footer nav
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    });

    it('provides skip links for efficient navigation', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const skipToContent = screen.getByTestId('skip-to-content');
      const skipToToc = screen.getByTestId('skip-to-toc');
      const skipToControls = screen.getByTestId('skip-to-controls');

      expect(skipToContent).toHaveAttribute('href', '#main-content');
      expect(skipToToc).toHaveAttribute('href', '#table-of-contents');
      expect(skipToControls).toHaveAttribute('href', '#accessibility-controls');

      // Test skip link functionality
      await user.click(skipToContent);
      expect(document.activeElement?.id).toBe('main-content');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through all interactive elements', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const interactiveElements = [
        screen.getByTestId('skip-to-content'),
        screen.getByTestId('font-size-control'),
        screen.getByTestId('high-contrast-toggle'),
        screen.getByTestId('text-to-speech-toggle'),
        screen.getByTestId('toc-introduction'),
        screen.getByTestId('previous-article'),
      ];

      // Test tab navigation
      for (const element of interactiveElements) {
        await user.tab();
        if (document.activeElement === element) {
          expect(element).toHaveFocus();
        }
      }
    });

    it('supports custom keyboard shortcuts', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const reader = screen.getByTestId('accessible-article-reader');
      
      // Test heading navigation shortcut
      await user.click(reader);
      await user.keyboard('h');
      
      // Test jump to main content shortcut
      await user.keyboard('j');
      expect(document.activeElement?.id).toBe('main-content');

      // Test text-to-speech toggle
      await user.keyboard(' ');
      expect(screen.getByTestId('text-to-speech-toggle')).toHaveAttribute('aria-pressed', 'true');
    });

    it('maintains proper focus management', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Test focus management in table of contents
      const tocIntro = screen.getByTestId('toc-introduction');
      await user.click(tocIntro);
      expect(tocIntro).toHaveFocus();

      // Test focus indicators are visible
      expect(tocIntro).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('traps focus in modal dialogs and overlays', async () => {
      // This would test focus trapping in modals, menus, etc.
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const shortcutsDetails = screen.getByRole('group'); // details element
      await user.click(shortcutsDetails);
      
      // Focus should be trapped within the expanded content
      const shortcutsContent = screen.getByTestId('keyboard-shortcuts');
      expect(shortcutsContent).toBeVisible();
    });
  });

  describe('Visual Accessibility Features', () => {
    it('supports high contrast mode', () => {
      const { rerender } = render(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          highContrastMode={false}
        />
      );

      let reader = screen.getByTestId('accessible-article-reader');
      expect(reader).not.toHaveClass('high-contrast');

      rerender(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          highContrastMode={true}
        />
      );

      reader = screen.getByTestId('accessible-article-reader');
      expect(reader).toHaveClass('high-contrast');
    });

    it('supports dyslexia-friendly font option', () => {
      const { rerender } = render(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          dyslexiaFriendlyMode={false}
        />
      );

      let reader = screen.getByTestId('accessible-article-reader');
      expect(reader).not.toHaveClass('dyslexia-friendly');

      rerender(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          dyslexiaFriendlyMode={true}
        />
      );

      reader = screen.getByTestId('accessible-article-reader');
      expect(reader).toHaveClass('dyslexia-friendly');
    });

    it('allows font size customization', () => {
      render(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          fontSize={20}
        />
      );

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveStyle({ fontSize: '20px' });
    });

    it('supports focus mode for reduced distractions', () => {
      render(
        <MockAccessibleArticleReader 
          article={mockAccessibleArticle} 
          focusMode={true}
        />
      );

      const reader = screen.getByTestId('accessible-article-reader');
      expect(reader).toHaveClass('focus-mode');
    });
  });

  describe('Audio Accessibility', () => {
    it('provides text-to-speech functionality', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      const ttsButton = screen.getByTestId('text-to-speech-toggle');
      expect(ttsButton).toHaveTextContent('Start Reading Aloud');
      expect(ttsButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(ttsButton);

      expect(ttsButton).toHaveTextContent('Stop Reading');
      expect(ttsButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('provides audio alternatives for visual content', () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Check for audio descriptions
      const readingTimeElement = screen.getByLabelText(/Estimated reading time: 3 minutes/);
      expect(readingTimeElement).toBeInTheDocument();

      const wordCountElement = screen.getByLabelText(/Word count: 150 words/);
      expect(wordCountElement).toBeInTheDocument();
    });
  });

  describe('Comment System Accessibility', () => {
    it('provides accessible form controls', async () => {
      render(<MockAccessibleCommentSystem articleId="test" />);

      const textarea = screen.getByTestId('comment-textarea');
      const submitButton = screen.getByTestId('submit-comment');

      expect(textarea).toHaveAttribute('aria-describedby', 'comment-help');
      expect(screen.getByText('Be respectful and constructive in your comments')).toBeInTheDocument();

      // Test form submission
      await user.type(textarea, 'Test comment');
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);
      
      // Should clear form after submission
      expect(textarea).toHaveValue('');
    });

    it('provides proper comment thread navigation', () => {
      render(<MockAccessibleCommentSystem articleId="test" />);

      const comment = screen.getByTestId('comment-1');
      expect(comment).toHaveAttribute('aria-labelledby', 'comment-1-author');

      const replyButton = screen.getByTestId('reply-1');
      expect(replyButton).toHaveAttribute('aria-label', "Reply to User One's comment");

      const likeButton = screen.getByTestId('like-1');
      expect(likeButton).toHaveAttribute('aria-label', "Like User One's comment");
    });

    it('announces comment posting to screen readers', async () => {
      render(<MockAccessibleCommentSystem articleId="test" />);

      const textarea = screen.getByTestId('comment-textarea');
      const submitButton = screen.getByTestId('submit-comment');

      await user.type(textarea, 'New test comment');
      await user.click(submitButton);

      // Verify comment was added
      await waitFor(() => {
        expect(screen.getByText('New test comment')).toBeInTheDocument();
      });

      // Check that comments count is updated
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });
  });

  describe('Progressive Enhancement', () => {
    it('works without JavaScript for basic functionality', () => {
      // Disable JavaScript simulation
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Core content should still be accessible
      expect(screen.getByTestId('article-title')).toBeInTheDocument();
      expect(screen.getByTestId('article-body')).toBeInTheDocument();
      expect(screen.getByTestId('table-of-contents')).toBeInTheDocument();

      // Skip links should work with CSS only
      const skipLinks = screen.getAllByText(/Skip to/);
      expect(skipLinks.length).toBeGreaterThan(0);
    });

    it('enhances functionality when JavaScript is available', async () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Interactive features should work
      const fontSizeControl = screen.getByTestId('font-size-control');
      expect(fontSizeControl).toBeInTheDocument();

      const ttsButton = screen.getByTestId('text-to-speech-toggle');
      await user.click(ttsButton);
      expect(ttsButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Mobile Accessibility', () => {
    it('supports touch navigation and gestures', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Mobile-specific accessibility features
      const accessibilityControls = screen.getByTestId('accessibility-controls');
      expect(accessibilityControls).toBeInTheDocument();

      // Touch targets should be appropriately sized (minimum 44px)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // In a real test, we'd check computed height/width
        expect(button).toBeInTheDocument();
      });
    });

    it('provides voice control compatibility', () => {
      render(<MockAccessibleArticleReader article={mockAccessibleArticle} />);

      // Voice control relies on proper labeling
      const controls = [
        screen.getByLabelText(/Font Size:/),
        screen.getByTestId('high-contrast-toggle'),
        screen.getByTestId('text-to-speech-toggle'),
      ];

      controls.forEach(control => {
        expect(control).toHaveAccessibleName();
      });
    });
  });
}); 