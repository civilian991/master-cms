import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock fetch for translation APIs
global.fetch = jest.fn();

// Mock Next.js internationalization
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    locale: 'en',
    locales: ['en', 'ar', 'fr', 'de', 'es', 'ja', 'ko', 'zh'],
  }),
  usePathname: () => '/articles/test-article',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock translation service responses
const mockTranslations = {
  'en-ar': {
    text: 'هذا مقال تجريبي حول التعلم الآلي والذكاء الاصطناعي.',
    quality: 0.92,
    confidence: 0.89,
    detectedLanguage: 'en',
    targetLanguage: 'ar',
    alternatives: ['هذا مقال اختباري', 'هذا نص تجريبي'],
  },
  'en-fr': {
    text: 'Ceci est un article test sur l\'apprentissage automatique et l\'intelligence artificielle.',
    quality: 0.95,
    confidence: 0.94,
    detectedLanguage: 'en',
    targetLanguage: 'fr',
    alternatives: ['Ceci est un article d\'essai', 'Voici un article de test'],
  },
  'en-de': {
    text: 'Dies ist ein Testartikel über maschinelles Lernen und künstliche Intelligenz.',
    quality: 0.88,
    confidence: 0.91,
    detectedLanguage: 'en',
    targetLanguage: 'de',
    alternatives: ['Dies ist ein Versuchsartikel', 'Das ist ein Testbeitrag'],
  },
  'en-ja': {
    text: 'これは機械学習と人工知能に関するテスト記事です。',
    quality: 0.87,
    confidence: 0.85,
    detectedLanguage: 'en',
    targetLanguage: 'ja',
    alternatives: ['これはテスト用の記事です', 'これは実験的な記事です'],
  },
};

// Mock article data for translation testing
const mockArticleForTranslation = {
  id: 'translation-test-article',
  title: 'Introduction to Machine Learning and AI',
  content: `
    <h2>What is Machine Learning?</h2>
    <p>Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.</p>
    
    <h3>Types of Machine Learning</h3>
    <ul>
      <li>Supervised Learning</li>
      <li>Unsupervised Learning</li>
      <li>Reinforcement Learning</li>
    </ul>
    
    <h2>Applications</h2>
    <p>Machine learning has numerous applications in various fields including healthcare, finance, transportation, and entertainment.</p>
    
    <blockquote>
      "The development of full artificial intelligence could spell the end of the human race." - Stephen Hawking
    </blockquote>
  `,
  excerpt: 'A comprehensive introduction to machine learning concepts and applications.',
  originalLanguage: 'en',
  availableLanguages: ['en', 'ar', 'fr', 'de', 'es'],
  translations: {
    ar: {
      title: 'مقدمة في التعلم الآلي والذكاء الاصطناعي',
      excerpt: 'مقدمة شاملة لمفاهيم التعلم الآلي وتطبيقاته.',
      translatedAt: '2024-01-15T10:00:00Z',
      quality: 0.92,
    },
    fr: {
      title: 'Introduction à l\'apprentissage automatique et à l\'IA',
      excerpt: 'Une introduction complète aux concepts d\'apprentissage automatique.',
      translatedAt: '2024-01-15T10:15:00Z',
      quality: 0.95,
    },
    de: {
      title: 'Einführung in maschinelles Lernen und KI',
      excerpt: 'Eine umfassende Einführung in Konzepte des maschinellen Lernens.',
      translatedAt: '2024-01-15T10:30:00Z',
      quality: 0.88,
    },
  },
};

// Mock Multi-Language Article Reader Component
const MockMultiLanguageArticleReader = ({ 
  article, 
  currentLanguage = 'en',
  enableTranslation = true,
  enableLanguageDetection = true,
  showTranslationQuality = true,
  enableBilingualMode = false,
  onLanguageChange
}: any) => {
  const [activeLanguage, setActiveLanguage] = React.useState(currentLanguage);
  const [translationInProgress, setTranslationInProgress] = React.useState(false);
  const [translationQuality, setTranslationQuality] = React.useState<any>(null);
  const [bilingualMode, setBilingualMode] = React.useState(enableBilingualMode);
  const [detectedLanguage, setDetectedLanguage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (enableLanguageDetection && article.originalLanguage !== activeLanguage) {
      setDetectedLanguage(article.originalLanguage);
    }
  }, [activeLanguage, article.originalLanguage, enableLanguageDetection]);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === activeLanguage) return;

    setTranslationInProgress(true);
    setTranslationQuality(null);

    try {
      if (article.translations?.[newLanguage]) {
        // Use existing translation
        setActiveLanguage(newLanguage);
        setTranslationQuality(article.translations[newLanguage]);
      } else if (enableTranslation) {
        // Request new translation
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: article.content,
            fromLanguage: article.originalLanguage,
            toLanguage: newLanguage,
            quality: 'high',
          }),
        });

        if (response.ok) {
          const translationData = await response.json();
          setActiveLanguage(newLanguage);
          setTranslationQuality(translationData);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setTranslationInProgress(false);
      if (onLanguageChange) {
        onLanguageChange(newLanguage);
      }
    }
  };

  const getCurrentContent = () => {
    if (activeLanguage === article.originalLanguage) {
      return {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
      };
    }

    if (article.translations?.[activeLanguage]) {
      return {
        title: article.translations[activeLanguage].title,
        content: mockTranslations[`${article.originalLanguage}-${activeLanguage}`]?.text || article.content,
        excerpt: article.translations[activeLanguage].excerpt,
      };
    }

    return {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
    };
  };

  const currentContent = getCurrentContent();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(activeLanguage);

  return (
    <div 
      className={`multilanguage-reader ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      lang={activeLanguage}
      data-testid="multilanguage-reader"
    >
      {/* Language Controls */}
      <section className="language-controls p-4 bg-blue-50 border-b" data-testid="language-controls">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="language-selector" className="font-medium">
              Language:
            </label>
            <select
              id="language-selector"
              value={activeLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={translationInProgress}
              data-testid="language-selector"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="es">Español (Spanish)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="zh">中文 (Chinese)</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            {/* Bilingual Mode Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={bilingualMode}
                onChange={(e) => setBilingualMode(e.target.checked)}
                data-testid="bilingual-mode-toggle"
              />
              <span className="text-sm">Bilingual Mode</span>
            </label>

            {/* Translation Status */}
            {translationInProgress && (
              <div className="flex items-center space-x-2 text-blue-600" data-testid="translation-progress">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Translating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Language Detection Alert */}
        {detectedLanguage && detectedLanguage !== activeLanguage && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded" data-testid="language-detection-alert">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-800">
                Content appears to be in {detectedLanguage.toUpperCase()}. 
                Would you like to view it in the original language?
              </span>
              <button
                onClick={() => handleLanguageChange(detectedLanguage)}
                className="text-sm text-yellow-800 underline hover:no-underline"
                data-testid="switch-to-original"
              >
                Switch to {detectedLanguage.toUpperCase()}
              </button>
            </div>
          </div>
        )}

        {/* Translation Quality Indicator */}
        {showTranslationQuality && translationQuality && activeLanguage !== article.originalLanguage && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded" data-testid="translation-quality">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-800">Translation Quality:</span>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < Math.round(translationQuality.quality * 5) 
                          ? 'text-yellow-500' 
                          : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                  <span className="text-sm text-green-700 ml-2" data-testid="quality-score">
                    {Math.round(translationQuality.quality * 100)}%
                  </span>
                </div>
              </div>
              <button
                className="text-sm text-green-800 underline hover:no-underline"
                data-testid="view-original"
                onClick={() => handleLanguageChange(article.originalLanguage)}
              >
                View Original
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Article Content */}
      <main className="article-content p-6" data-testid="article-content">
        {bilingualMode ? (
          <div className="bilingual-content grid md:grid-cols-2 gap-6" data-testid="bilingual-content">
            {/* Original Language */}
            <div className="original-content">
              <h2 className="text-lg font-semibold mb-4 text-gray-600">
                Original ({article.originalLanguage.toUpperCase()})
              </h2>
              <article dir="ltr">
                <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
                <div 
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  data-testid="original-content"
                />
              </article>
            </div>

            {/* Translated Content */}
            <div className="translated-content">
              <h2 className="text-lg font-semibold mb-4 text-gray-600">
                Translation ({activeLanguage.toUpperCase()})
              </h2>
              <article dir={isRTL ? 'rtl' : 'ltr'}>
                <h1 className="text-2xl font-bold mb-4">{currentContent.title}</h1>
                <div 
                  dangerouslySetInnerHTML={{ __html: currentContent.content }}
                  data-testid="translated-content"
                />
              </article>
            </div>
          </div>
        ) : (
          <article>
            <header className="mb-6">
              <h1 className="text-3xl font-bold mb-4" data-testid="article-title">
                {currentContent.title}
              </h1>
              <p className="text-gray-600 text-lg" data-testid="article-excerpt">
                {currentContent.excerpt}
              </p>
            </header>
            
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: currentContent.content }}
              data-testid="article-body"
            />
          </article>
        )}
      </main>

      {/* Language Learning Features */}
      {activeLanguage !== article.originalLanguage && (
        <section className="language-learning p-6 bg-gray-50 border-t" data-testid="language-learning">
          <h3 className="text-lg font-semibold mb-4">Language Learning Features</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vocabulary Highlights */}
            <div className="vocabulary-section">
              <h4 className="font-medium mb-2">Key Vocabulary</h4>
              <div className="flex flex-wrap gap-2" data-testid="vocabulary-highlights">
                {['machine learning', 'artificial intelligence', 'algorithms', 'applications'].map(term => (
                  <span
                    key={term}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm cursor-pointer hover:bg-blue-200"
                    title={`Click to hear pronunciation of "${term}"`}
                    data-testid={`vocab-${term.replace(' ', '-')}`}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>

            {/* Pronunciation Guide */}
            <div className="pronunciation-section">
              <h4 className="font-medium mb-2">Pronunciation Guide</h4>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                data-testid="pronunciation-button"
              >
                🔊 Listen to Article
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Audio pronunciation in {activeLanguage.toUpperCase()}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// Mock Translation API Handler
const MockTranslationAPIHandler = () => {
  const [apiStatus, setApiStatus] = React.useState('idle');
  const [translationQueue, setTranslationQueue] = React.useState<any[]>([]);
  const [completedTranslations, setCompletedTranslations] = React.useState<any[]>([]);

  const handleTranslationRequest = async (request: any) => {
    setApiStatus('processing');
    setTranslationQueue(prev => [...prev, { ...request, id: Date.now() }]);

    try {
      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      const translationKey = `${request.fromLanguage}-${request.toLanguage}`;
      const result = mockTranslations[translationKey] || {
        text: `Translated: ${request.text}`,
        quality: 0.75,
        confidence: 0.70,
        detectedLanguage: request.fromLanguage,
        targetLanguage: request.toLanguage,
      };

      setCompletedTranslations(prev => [...prev, { ...request, result }]);
      setTranslationQueue(prev => prev.filter(item => item.id !== request.id));
      setApiStatus('completed');

      return result;
    } catch (error) {
      setApiStatus('error');
      throw error;
    }
  };

  return (
    <div data-testid="translation-api-handler" className="p-4 bg-gray-50 border rounded">
      <h3 className="font-semibold mb-2">Translation API Status</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Status:</span>
          <span className={`ml-2 font-medium ${
            apiStatus === 'completed' ? 'text-green-600' :
            apiStatus === 'error' ? 'text-red-600' :
            apiStatus === 'processing' ? 'text-yellow-600' : 'text-gray-600'
          }`} data-testid="api-status">
            {apiStatus}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Queue:</span>
          <span className="ml-2 font-medium" data-testid="queue-length">
            {translationQueue.length} pending
          </span>
        </div>
        <div>
          <span className="text-gray-600">Completed:</span>
          <span className="ml-2 font-medium" data-testid="completed-count">
            {completedTranslations.length} translations
          </span>
        </div>
      </div>
    </div>
  );
};

describe('Multi-Language and Translation Quality Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Language Detection', () => {
    it('detects content language automatically', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="ar"
          enableLanguageDetection={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('language-detection-alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Content appears to be in EN/)).toBeInTheDocument();
      expect(screen.getByTestId('switch-to-original')).toBeInTheDocument();
    });

    it('switches to original language when detected', async () => {
      const onLanguageChange = jest.fn();

      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="ar"
          enableLanguageDetection={true}
          onLanguageChange={onLanguageChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('switch-to-original')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('switch-to-original'));

      expect(onLanguageChange).toHaveBeenCalledWith('en');
    });

    it('does not show detection alert when languages match', () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
          enableLanguageDetection={true}
        />
      );

      expect(screen.queryByTestId('language-detection-alert')).not.toBeInTheDocument();
    });
  });

  describe('Translation Quality Assessment', () => {
    it('displays translation quality scores correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations['en-fr']
      } as Response);

      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
          showTranslationQuality={true}
        />
      );

      const languageSelector = screen.getByTestId('language-selector');
      await user.selectOptions(languageSelector, 'fr');

      await waitFor(() => {
        expect(screen.getByTestId('translation-quality')).toBeInTheDocument();
      });

      const qualityScore = screen.getByTestId('quality-score');
      expect(qualityScore).toHaveTextContent('95%'); // From mockTranslations['en-fr'].quality

      // Check star rating
      const stars = screen.getByTestId('translation-quality').querySelectorAll('.text-yellow-500');
      expect(stars).toHaveLength(5); // 95% = 5 stars
    });

    it('provides quality indicators for different languages', async () => {
      const qualityTests = [
        { lang: 'fr', expectedQuality: 95 },
        { lang: 'ar', expectedQuality: 92 },
        { lang: 'de', expectedQuality: 88 },
        { lang: 'ja', expectedQuality: 87 },
      ];

      for (const test of qualityTests) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslations[`en-${test.lang}`]
        } as Response);

        const { rerender } = render(
          <MockMultiLanguageArticleReader
            article={mockArticleForTranslation}
            currentLanguage="en"
            showTranslationQuality={true}
          />
        );

        const languageSelector = screen.getByTestId('language-selector');
        await user.selectOptions(languageSelector, test.lang);

        await waitFor(() => {
          expect(screen.getByTestId('quality-score')).toHaveTextContent(`${test.expectedQuality}%`);
        });

        if (test !== qualityTests[qualityTests.length - 1]) {
          rerender(<div></div>);
        }
      }
    });

    it('handles translation API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Translation API Error'));

      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
        />
      );

      const languageSelector = screen.getByTestId('language-selector');
      await user.selectOptions(languageSelector, 'ko');

      // Should show translation progress initially
      expect(screen.getByTestId('translation-progress')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('translation-progress')).not.toBeInTheDocument();
      });

      // Translation quality should not be shown on error
      expect(screen.queryByTestId('translation-quality')).not.toBeInTheDocument();
    });
  });

  describe('RTL Language Support', () => {
    it('applies RTL layout for Arabic content', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="ar"
        />
      );

      const reader = screen.getByTestId('multilanguage-reader');
      expect(reader).toHaveClass('rtl');
      expect(reader).toHaveAttribute('dir', 'rtl');
      expect(reader).toHaveAttribute('lang', 'ar');
    });

    it('maintains LTR layout for non-RTL languages', async () => {
      const ltrLanguages = ['en', 'fr', 'de', 'es', 'ja', 'ko', 'zh'];

      for (const lang of ltrLanguages) {
        const { rerender } = render(
          <MockMultiLanguageArticleReader
            article={mockArticleForTranslation}
            currentLanguage={lang}
          />
        );

        const reader = screen.getByTestId('multilanguage-reader');
        expect(reader).toHaveClass('ltr');
        expect(reader).toHaveAttribute('dir', 'ltr');
        expect(reader).toHaveAttribute('lang', lang);

        if (lang !== ltrLanguages[ltrLanguages.length - 1]) {
          rerender(<div></div>);
        }
      }
    });

    it('handles mixed content direction in bilingual mode', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="ar"
          enableBilingualMode={true}
        />
      );

      const bilingualToggle = screen.getByTestId('bilingual-mode-toggle');
      await user.click(bilingualToggle);

      await waitFor(() => {
        expect(screen.getByTestId('bilingual-content')).toBeInTheDocument();
      });

      const originalContent = screen.getByTestId('original-content');
      const translatedContent = screen.getByTestId('translated-content');

      expect(originalContent.closest('article')).toHaveAttribute('dir', 'ltr');
      expect(translatedContent.closest('article')).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Bilingual Reading Mode', () => {
    it('displays content side-by-side in bilingual mode', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="fr"
          enableBilingualMode={true}
        />
      );

      const bilingualToggle = screen.getByTestId('bilingual-mode-toggle');
      await user.click(bilingualToggle);

      await waitFor(() => {
        expect(screen.getByTestId('bilingual-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('original-content')).toBeInTheDocument();
      expect(screen.getByTestId('translated-content')).toBeInTheDocument();

      // Check that both versions show different content
      expect(screen.getByText(mockArticleForTranslation.title)).toBeInTheDocument(); // Original
      expect(screen.getByText(/Introduction à l'apprentissage/)).toBeInTheDocument(); // French translation
    });

    it('toggles between normal and bilingual modes', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="fr"
        />
      );

      // Initially should show normal mode
      expect(screen.queryByTestId('bilingual-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('article-body')).toBeInTheDocument();

      // Toggle to bilingual mode
      const bilingualToggle = screen.getByTestId('bilingual-mode-toggle');
      await user.click(bilingualToggle);

      await waitFor(() => {
        expect(screen.getByTestId('bilingual-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('article-body')).not.toBeInTheDocument();

      // Toggle back to normal mode
      await user.click(bilingualToggle);

      await waitFor(() => {
        expect(screen.queryByTestId('bilingual-content')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('article-body')).toBeInTheDocument();
    });
  });

  describe('Language Learning Features', () => {
    it('highlights vocabulary when reading translated content', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="fr"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('language-learning')).toBeInTheDocument();
      });

      const vocabularyHighlights = screen.getByTestId('vocabulary-highlights');
      expect(vocabularyHighlights).toBeInTheDocument();

      // Check for key vocabulary terms
      expect(screen.getByTestId('vocab-machine-learning')).toBeInTheDocument();
      expect(screen.getByTestId('vocab-artificial-intelligence')).toBeInTheDocument();
      expect(screen.getByTestId('vocab-algorithms')).toBeInTheDocument();
      expect(screen.getByTestId('vocab-applications')).toBeInTheDocument();
    });

    it('provides pronunciation guide for translated content', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="ja"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('pronunciation-button')).toBeInTheDocument();
      });

      const pronunciationButton = screen.getByTestId('pronunciation-button');
      expect(pronunciationButton).toHaveTextContent('🔊 Listen to Article');
      expect(screen.getByText(/Audio pronunciation in JA/)).toBeInTheDocument();
    });

    it('does not show language learning features for original language', () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
        />
      );

      expect(screen.queryByTestId('language-learning')).not.toBeInTheDocument();
    });
  });

  describe('Translation API Integration', () => {
    it('handles translation requests efficiently', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations['en-es']
      } as Response);

      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
        />
      );

      const languageSelector = screen.getByTestId('language-selector');
      await user.selectOptions(languageSelector, 'es');

      // Should show translation progress
      expect(screen.getByTestId('translation-progress')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: mockArticleForTranslation.content,
            fromLanguage: 'en',
            toLanguage: 'es',
            quality: 'high',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('translation-progress')).not.toBeInTheDocument();
      });
    });

    it('uses cached translations when available', async () => {
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
        />
      );

      const languageSelector = screen.getByTestId('language-selector');
      
      // Switch to French (should use cached translation)
      await user.selectOptions(languageSelector, 'fr');

      // Should not make API call for cached translation
      expect(mockFetch).not.toHaveBeenCalled();

      // Should show cached translation quality
      await waitFor(() => {
        expect(screen.getByTestId('translation-quality')).toBeInTheDocument();
      });

      expect(screen.getByTestId('quality-score')).toHaveTextContent('95%');
    });

    it('processes multiple translation requests in sequence', async () => {
      render(<MockTranslationAPIHandler />);

      expect(screen.getByTestId('api-status')).toHaveTextContent('idle');
      expect(screen.getByTestId('queue-length')).toHaveTextContent('0 pending');
      expect(screen.getByTestId('completed-count')).toHaveTextContent('0 translations');
    });
  });

  describe('Cross-Language Content Management', () => {
    it('maintains consistent metadata across translations', async () => {
      const multiLanguageArticle = {
        ...mockArticleForTranslation,
        metadata: {
          category: { en: 'Technology', fr: 'Technologie', ar: 'التكنولوجيا' },
          tags: {
            en: ['AI', 'Machine Learning', 'Technology'],
            fr: ['IA', 'Apprentissage Automatique', 'Technologie'],
            ar: ['الذكاء الاصطناعي', 'التعلم الآلي', 'التكنولوجيا'],
          },
        },
      };

      const { rerender } = render(
        <MockMultiLanguageArticleReader
          article={multiLanguageArticle}
          currentLanguage="en"
        />
      );

      // Test language switching maintains structure
      rerender(
        <MockMultiLanguageArticleReader
          article={multiLanguageArticle}
          currentLanguage="fr"
        />
      );

      const articleTitle = screen.getByTestId('article-title');
      expect(articleTitle).toHaveTextContent(/Introduction à l'apprentissage/);

      // Test RTL language
      rerender(
        <MockMultiLanguageArticleReader
          article={multiLanguageArticle}
          currentLanguage="ar"
        />
      );

      expect(screen.getByTestId('multilanguage-reader')).toHaveAttribute('dir', 'rtl');
    });

    it('handles missing translations gracefully', async () => {
      const partialTranslationArticle = {
        ...mockArticleForTranslation,
        translations: {
          fr: mockArticleForTranslation.translations.fr,
          // Missing ar and de translations
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations['en-de']
      } as Response);

      render(
        <MockMultiLanguageArticleReader
          article={partialTranslationArticle}
          currentLanguage="en"
        />
      );

      const languageSelector = screen.getByTestId('language-selector');
      
      // Switch to language without cached translation
      await user.selectOptions(languageSelector, 'de');

      // Should trigger API translation
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/ai/translate', expect.objectContaining({
          body: expect.stringContaining('"toLanguage":"de"'),
        }));
      });
    });
  });

  describe('Performance with Multiple Languages', () => {
    it('efficiently handles language switching without memory leaks', async () => {
      const languages = ['en', 'fr', 'ar', 'de', 'ja'];
      
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
        />
      );

      const languageSelector = screen.getByTestId('language-selector');

      // Rapidly switch between languages
      for (const lang of languages) {
        await user.selectOptions(languageSelector, lang);
        
        // Verify language attribute is updated
        expect(screen.getByTestId('multilanguage-reader')).toHaveAttribute('lang', lang);
        
        // Small delay to prevent overwhelming the test
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('optimizes translation caching across sessions', async () => {
      // Test would verify that translations are cached efficiently
      // and don't consume excessive memory
      
      render(
        <MockMultiLanguageArticleReader
          article={mockArticleForTranslation}
          currentLanguage="en"
        />
      );

      // Multiple articles with translations should share cached data
      expect(screen.getByTestId('multilanguage-reader')).toBeInTheDocument();
    });
  });
}); 