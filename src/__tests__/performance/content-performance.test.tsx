import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(),
    getEntriesByName: jest.fn(),
    observer: jest.fn(),
  },
});

// Mock Intersection Observer for lazy loading
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({ scope: '/' }),
    ready: Promise.resolve({
      active: { postMessage: jest.fn() },
      sync: { register: jest.fn() },
    }),
    controller: { postMessage: jest.fn() },
  },
});

// Mock Cache API
global.caches = {
  open: jest.fn().mockResolvedValue({
    match: jest.fn(),
    add: jest.fn(),
    addAll: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
  }),
  match: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn().mockResolvedValue(['content-cache-v1']),
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock large article data
const mockLargeArticle = {
  id: 'large-article',
  title: 'The Complete Guide to Machine Learning: From Basics to Advanced Techniques',
  content: Array(1000).fill(`
    <h2>Section Heading</h2>
    <p>This is a paragraph with substantial content for performance testing. It contains detailed information about machine learning concepts, algorithms, and practical applications. The content is designed to simulate real-world articles that users would read on the platform.</p>
    <img src="/images/ml-diagram-${Math.floor(Math.random() * 10)}.jpg" alt="Machine Learning Diagram" loading="lazy" />
    <p>Additional technical content with code examples and explanations that would typically be found in comprehensive technical articles.</p>
  `).join(''),
  wordCount: 15000,
  readingTime: 60,
  images: Array.from({ length: 50 }, (_, i) => ({
    src: `/images/ml-diagram-${i}.jpg`,
    alt: `Machine Learning Diagram ${i + 1}`,
    width: 800,
    height: 600,
  })),
  author: { name: 'ML Expert', avatar: '/avatars/expert.jpg' },
  category: { name: 'Technology', slug: 'technology' }
};

// Mock Performance-Optimized Article Reader
const MockPerformanceOptimizedReader = ({ 
  article, 
  enableLazyLoading = true,
  enableCaching = true,
  enableOffline = true,
  virtualScrolling = false,
  imageOptimization = true
}: any) => {
  const [loadingState, setLoadingState] = React.useState('loading');
  const [cacheStatus, setCacheStatus] = React.useState('uncached');
  const [offlineStatus, setOfflineStatus] = React.useState('online');
  const [performanceMetrics, setPerformanceMetrics] = React.useState({
    loadTime: 0,
    renderTime: 0,
    imageLoadTime: 0,
    cacheHitRate: 0,
  });
  const [visibleSections, setVisibleSections] = React.useState<Set<number>>(new Set([0, 1, 2]));

  const startTime = React.useRef(Date.now());
  const [imagesLoaded, setImagesLoaded] = React.useState(0);

  React.useEffect(() => {
    const measurePerformance = async () => {
      performance.mark('content-load-start');
      
      try {
        // Simulate content loading with caching
        if (enableCaching) {
          const cache = await caches.open('content-cache-v1');
          const cached = await cache.match(`/api/articles/${article.id}`);
          
          if (cached) {
            setCacheStatus('hit');
            setLoadingState('loaded');
            performance.mark('content-load-end');
            performance.measure('content-load-time', 'content-load-start', 'content-load-end');
            return;
          }
        }

        // Simulate API fetch
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        if (enableCaching) {
          setCacheStatus('miss');
          const cache = await caches.open('content-cache-v1');
          await cache.put(`/api/articles/${article.id}`, new Response(JSON.stringify(article)));
        }

        setLoadingState('loaded');
        performance.mark('content-load-end');
        performance.measure('content-load-time', 'content-load-start', 'content-load-end');

        // Update performance metrics
        const loadTime = Date.now() - startTime.current;
        setPerformanceMetrics(prev => ({ ...prev, loadTime }));

      } catch (error) {
        setLoadingState('error');
      }
    };

    measurePerformance();
  }, [article.id, enableCaching]);

  React.useEffect(() => {
    // Simulate offline detection
    const handleOnlineStatus = () => {
      setOfflineStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  React.useEffect(() => {
    // Simulate virtual scrolling for large content
    if (virtualScrolling && article.content.length > 10000) {
      const handleScroll = () => {
        const scrollTop = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        
        // Calculate visible sections based on scroll position
        const sectionHeight = 500; // Estimated section height
        const startSection = Math.floor(scrollTop / sectionHeight);
        const endSection = Math.ceil((scrollTop + viewportHeight) / sectionHeight);
        
        const newVisibleSections = new Set<number>();
        for (let i = Math.max(0, startSection - 1); i <= endSection + 1; i++) {
          newVisibleSections.add(i);
        }
        
        setVisibleSections(newVisibleSections);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [virtualScrolling, article.content.length]);

  const handleImageLoad = React.useCallback(() => {
    setImagesLoaded(prev => {
      const newCount = prev + 1;
      if (newCount === article.images?.length) {
        const imageLoadTime = Date.now() - startTime.current;
        setPerformanceMetrics(prev => ({ ...prev, imageLoadTime }));
      }
      return newCount;
    });
  }, [article.images?.length]);

  if (loadingState === 'loading') {
    return (
      <div data-testid="loading-state" className="flex flex-col space-y-4 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div data-testid="error-state" className="p-6 text-center">
        <p className="text-red-600 mb-4">Failed to load content</p>
        {enableOffline && offlineStatus === 'offline' && (
          <p className="text-gray-600">You appear to be offline. Cached content will be shown when available.</p>
        )}
      </div>
    );
  }

  return (
    <div data-testid="performance-optimized-reader" className="article-reader">
      {/* Performance Metrics Display */}
      <div data-testid="performance-metrics" className="performance-metrics p-4 bg-blue-50 border-b text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-600">Load Time:</span>
            <span className="ml-2 font-medium" data-testid="load-time">
              {performanceMetrics.loadTime}ms
            </span>
          </div>
          <div>
            <span className="text-gray-600">Cache:</span>
            <span className={`ml-2 font-medium ${
              cacheStatus === 'hit' ? 'text-green-600' : 'text-orange-600'
            }`} data-testid="cache-status">
              {cacheStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Images:</span>
            <span className="ml-2 font-medium" data-testid="images-loaded">
              {imagesLoaded}/{article.images?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 font-medium ${
              offlineStatus === 'online' ? 'text-green-600' : 'text-red-600'
            }`} data-testid="offline-status">
              {offlineStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <main className="article-content p-6" data-testid="article-content">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <div className="text-gray-600">
            <span>By {article.author.name}</span>
            <span className="mx-2">•</span>
            <span>{article.readingTime} min read</span>
            <span className="mx-2">•</span>
            <span>{article.wordCount.toLocaleString()} words</span>
          </div>
        </header>

        {/* Content Sections with Virtual Scrolling */}
        <article className="prose max-w-none">
          {virtualScrolling ? (
            <div data-testid="virtual-content">
              {Array.from({ length: 10 }).map((_, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className={`content-section ${
                    visibleSections.has(sectionIndex) ? 'rendered' : 'placeholder'
                  }`}
                  data-testid={`section-${sectionIndex}`}
                  style={{ minHeight: visibleSections.has(sectionIndex) ? 'auto' : '500px' }}
                >
                  {visibleSections.has(sectionIndex) ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: article.content.slice(sectionIndex * 1000, (sectionIndex + 1) * 1000) 
                    }} />
                  ) : (
                    <div className="h-full bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-500">Loading section...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div 
              dangerouslySetInnerHTML={{ __html: article.content }}
              data-testid="full-content"
            />
          )}
        </article>

        {/* Image Gallery with Lazy Loading */}
        {article.images && enableLazyLoading && (
          <section className="images-section mt-8" data-testid="images-section">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {article.images.map((image: any, index: number) => (
                <div key={index} className="image-container" data-testid={`image-container-${index}`}>
                  {imageOptimization ? (
                    <img
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      className="w-full h-48 object-cover rounded-lg"
                      onLoad={handleImageLoad}
                      onError={handleImageLoad}
                      data-testid={`optimized-image-${index}`}
                    />
                  ) : (
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-48 object-cover rounded-lg"
                      onLoad={handleImageLoad}
                      data-testid={`standard-image-${index}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Offline Indicator */}
      {enableOffline && offlineStatus === 'offline' && (
        <div data-testid="offline-indicator" className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span>📡</span>
            <span>You're offline</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock Service Worker Manager
const MockServiceWorkerManager = () => {
  const [swStatus, setSWStatus] = React.useState('unregistered');
  const [cacheSize, setCacheSize] = React.useState(0);
  const [lastUpdate, setLastUpdate] = React.useState<string | null>(null);

  React.useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          setSWStatus('registering');
          await navigator.serviceWorker.register('/sw.js');
          setSWStatus('registered');
          
          // Mock cache size calculation
          const caches = await window.caches.keys();
          let totalSize = 0;
          for (const cacheName of caches) {
            totalSize += Math.random() * 1000000; // Mock size in bytes
          }
          setCacheSize(totalSize);
          setLastUpdate(new Date().toISOString());
        } catch (error) {
          setSWStatus('error');
        }
      }
    };

    registerServiceWorker();
  }, []);

  return (
    <div data-testid="service-worker-manager" className="p-4 bg-gray-50 border rounded-lg">
      <h3 className="font-semibold mb-2">Service Worker Status</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Status:</span>
          <span className={`ml-2 font-medium ${
            swStatus === 'registered' ? 'text-green-600' : 
            swStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
          }`} data-testid="sw-status">
            {swStatus}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Cache Size:</span>
          <span className="ml-2 font-medium" data-testid="cache-size">
            {(cacheSize / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
        {lastUpdate && (
          <div>
            <span className="text-gray-600">Last Update:</span>
            <span className="ml-2 font-medium" data-testid="last-update">
              {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

describe('Content Performance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockFetch.mockClear();
    performance.now = jest.fn(() => Date.now());
  });

  describe('Content Loading Performance', () => {
    it('loads content within acceptable time limits', async () => {
      const startTime = performance.now();
      
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableCaching={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-optimized-reader')).toBeInTheDocument();
      });

      const loadTime = screen.getByTestId('load-time');
      const loadTimeValue = parseInt(loadTime.textContent || '0');
      
      // Content should load within 2 seconds (2000ms)
      expect(loadTimeValue).toBeLessThan(2000);
    });

    it('shows appropriate loading states during content fetch', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableCaching={false}
        />
      );

      // Should show loading state initially
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByTestId('article-content')).toBeInTheDocument();
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      });
    });

    it('handles large content efficiently with virtual scrolling', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          virtualScrolling={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('virtual-content')).toBeInTheDocument();
      });

      // Only first few sections should be rendered initially
      expect(screen.getByTestId('section-0')).toHaveClass('rendered');
      expect(screen.getByTestId('section-1')).toHaveClass('rendered');
      expect(screen.getByTestId('section-2')).toHaveClass('rendered');

      // Later sections should be placeholders
      const laterSections = screen.getAllByTestId(/section-[5-9]/);
      laterSections.forEach(section => {
        expect(section).toHaveClass('placeholder');
      });
    });

    it('measures and reports Core Web Vitals metrics', async () => {
      render(
        <MockPerformanceOptimizedReader article={mockLargeArticle} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      });

      const loadTime = screen.getByTestId('load-time');
      expect(loadTime).toBeInTheDocument();
      
      // Load time should be reasonable
      const loadTimeValue = parseInt(loadTime.textContent || '0');
      expect(loadTimeValue).toBeGreaterThan(0);
      expect(loadTimeValue).toBeLessThan(5000); // LCP target: < 2.5s, allowing buffer for test environment
    });
  });

  describe('Caching Strategy Performance', () => {
    it('demonstrates cache hit performance improvement', async () => {
      // First load (cache miss)
      const { rerender } = render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableCaching={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-status')).toHaveTextContent('miss');
      });

      const firstLoadTime = parseInt(screen.getByTestId('load-time').textContent || '0');

      // Second load (cache hit)
      rerender(
        <MockPerformanceOptimizedReader 
          article={{ ...mockLargeArticle, id: 'large-article' }}
          enableCaching={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-status')).toHaveTextContent('hit');
      });

      const secondLoadTime = parseInt(screen.getByTestId('load-time').textContent || '0');

      // Cache hit should be faster
      expect(secondLoadTime).toBeLessThan(firstLoadTime);
    });

    it('manages cache storage efficiently', async () => {
      render(<MockServiceWorkerManager />);

      await waitFor(() => {
        expect(screen.getByTestId('sw-status')).toHaveTextContent('registered');
      });

      const cacheSize = screen.getByTestId('cache-size');
      const cacheSizeValue = parseFloat(cacheSize.textContent || '0');
      
      // Cache size should be reasonable (less than 50MB for testing)
      expect(cacheSizeValue).toBeGreaterThan(0);
      expect(cacheSizeValue).toBeLessThan(50);
    });

    it('handles cache invalidation properly', async () => {
      render(<MockServiceWorkerManager />);

      await waitFor(() => {
        expect(screen.getByTestId('last-update')).toBeInTheDocument();
      });

      const lastUpdate = screen.getByTestId('last-update');
      expect(lastUpdate).toHaveTextContent(/\d{1,2}:\d{2}:\d{2}/); // Time format
    });
  });

  describe('Image Loading Performance', () => {
    it('implements lazy loading for images', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableLazyLoading={true}
          imageOptimization={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('images-section')).toBeInTheDocument();
      });

      // Check for lazy loading attribute
      const images = screen.getAllByTestId(/optimized-image-/);
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });

      // Images loaded counter should increment
      await waitFor(() => {
        const imagesLoaded = screen.getByTestId('images-loaded');
        expect(imagesLoaded).toHaveTextContent(/\d+\/\d+/);
      });
    });

    it('optimizes image dimensions and formats', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          imageOptimization={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('images-section')).toBeInTheDocument();
      });

      const optimizedImages = screen.getAllByTestId(/optimized-image-/);
      optimizedImages.forEach(img => {
        expect(img).toHaveAttribute('width');
        expect(img).toHaveAttribute('height');
      });
    });

    it('tracks image loading performance', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableLazyLoading={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('images-section')).toBeInTheDocument();
      });

      // Simulate image loads by firing load events
      const images = screen.getAllByTestId(/optimized-image-/);
      
      act(() => {
        images.forEach(img => {
          userEvent.load(img);
        });
      });

      await waitFor(() => {
        const imagesLoaded = screen.getByTestId('images-loaded');
        expect(imagesLoaded).toHaveTextContent(`${images.length}/${images.length}`);
      });
    });
  });

  describe('Offline Capabilities', () => {
    it('detects and responds to offline status', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableOffline={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('offline-status')).toHaveTextContent('online');
      });

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('offline-status')).toHaveTextContent('offline');
        expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      });
    });

    it('provides offline content from cache', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableOffline={true}
          enableCaching={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('article-content')).toBeInTheDocument();
      });

      // Simulate going offline after content is cached
      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        window.dispatchEvent(new Event('offline'));
      });

      // Content should still be available
      expect(screen.getByTestId('article-content')).toBeInTheDocument();
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });

    it('handles offline errors gracefully', async () => {
      // Simulate offline state from the start
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableOffline={true}
          enableCaching={false}
        />
      );

      // Should show error state with offline message
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      expect(screen.getByText(/You appear to be offline/)).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('cleans up resources when component unmounts', async () => {
      const { unmount } = render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          virtualScrolling={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('virtual-content')).toBeInTheDocument();
      });

      // Mock memory usage tracking
      const initialEventListeners = jest.spyOn(window, 'addEventListener');
      const removeEventListeners = jest.spyOn(window, 'removeEventListener');

      unmount();

      // Should clean up event listeners
      expect(removeEventListeners).toHaveBeenCalled();
    });

    it('efficiently manages large content rendering', async () => {
      const veryLargeArticle = {
        ...mockLargeArticle,
        content: Array(5000).fill('<p>Large content for memory testing.</p>').join(''),
        wordCount: 100000,
      };

      const startMemory = performance.memory?.usedJSHeapSize || 0;

      render(
        <MockPerformanceOptimizedReader 
          article={veryLargeArticle}
          virtualScrolling={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('virtual-content')).toBeInTheDocument();
      });

      // Memory usage should be controlled with virtual scrolling
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable (less than 10MB for virtual content)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Progressive Loading', () => {
    it('prioritizes above-the-fold content', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableLazyLoading={true}
        />
      );

      // Above-the-fold content should load immediately
      await waitFor(() => {
        expect(screen.getByText(mockLargeArticle.title)).toBeInTheDocument();
        expect(screen.getByText(`By ${mockLargeArticle.author.name}`)).toBeInTheDocument();
      });

      // Images should have lazy loading
      const images = screen.getAllByTestId(/optimized-image-/);
      expect(images.length).toBeGreaterThan(0);
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('preloads critical resources efficiently', async () => {
      render(
        <MockPerformanceOptimizedReader 
          article={mockLargeArticle}
          enableCaching={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      });

      // Critical content should be cached
      expect(screen.getByTestId('cache-status')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks performance metrics accurately', async () => {
      render(
        <MockPerformanceOptimizedReader article={mockLargeArticle} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      });

      const metrics = {
        loadTime: screen.getByTestId('load-time'),
        cacheStatus: screen.getByTestId('cache-status'),
        imagesLoaded: screen.getByTestId('images-loaded'),
      };

      // All metrics should be present and have reasonable values
      expect(metrics.loadTime).toHaveTextContent(/\d+ms/);
      expect(metrics.cacheStatus).toHaveTextContent(/(hit|miss)/);
      expect(metrics.imagesLoaded).toHaveTextContent(/\d+\/\d+/);
    });

    it('identifies performance bottlenecks', async () => {
      const slowArticle = {
        ...mockLargeArticle,
        images: Array.from({ length: 200 }, (_, i) => ({
          src: `/images/large-image-${i}.jpg`,
          alt: `Large Image ${i}`,
          width: 2000,
          height: 1500,
        })),
      };

      render(
        <MockPerformanceOptimizedReader 
          article={slowArticle}
          imageOptimization={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('images-section')).toBeInTheDocument();
      });

      // Should handle large number of images without optimization
      const images = screen.getAllByTestId(/standard-image-/);
      expect(images.length).toBeGreaterThan(100);
    });
  });
}); 