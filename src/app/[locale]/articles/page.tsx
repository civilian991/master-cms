import React, { Suspense } from 'react';
import { ContentServerWrapper } from '@/components/ui/content-server-wrapper';
import { Container, Section } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc } from 'lucide-react';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface LocaleArticlesPageProps {
  params: { locale: Locale }
  searchParams?: { 
    search?: string
    category?: string
    tag?: string
    sort?: string
  }
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'All Articles',
      description: 'Explore our comprehensive collection of articles and insights',
      searchPlaceholder: 'Search articles...',
      filterByCategory: 'Filter by Category',
      filterByTag: 'Filter by Tag',
      sortBy: 'Sort by',
      allCategories: 'All Categories',
      allTags: 'All Tags',
      newest: 'Newest',
      oldest: 'Oldest',
      popular: 'Most Popular',
      alphabetical: 'A to Z',
      noArticlesFound: 'No articles found',
      tryDifferentSearch: 'Try adjusting your search or filters',
      clearFilters: 'Clear Filters'
    },
    ar: {
      title: 'جميع المقالات',
      description: 'استكشف مجموعتنا الشاملة من المقالات والرؤى',
      searchPlaceholder: 'البحث في المقالات...',
      filterByCategory: 'تصفية حسب الفئة',
      filterByTag: 'تصفية حسب العلامة',
      sortBy: 'ترتيب حسب',
      allCategories: 'جميع الفئات',
      allTags: 'جميع العلامات',
      newest: 'الأحدث',
      oldest: 'الأقدم',
      popular: 'الأكثر شيوعاً',
      alphabetical: 'أ إلى ي',
      noArticlesFound: 'لم يتم العثور على مقالات',
      tryDifferentSearch: 'جرب تعديل البحث أو المرشحات',
      clearFilters: 'مسح المرشحات'
    }
  }
  
  return content[locale] || content.en
}

// Mock data - replace with real API calls
async function getArticles(locale: Locale, searchParams: any) {
  // This would typically be an API call
  return {
    articles: [
      {
        id: '1',
        title: locale === 'en' ? 'Getting Started with Next.js 15' : 'البدء مع Next.js 15',
        excerpt: locale === 'en' 
          ? 'Learn the fundamentals of Next.js 15 and its new features.'
          : 'تعلم أساسيات Next.js 15 وميزاته الجديدة.',
        slug: 'getting-started-nextjs-15',
        publishedAt: '2024-01-15',
        author: { id: '1', name: 'John Doe', avatar: '/images/avatars/john.jpg' },
        category: { id: '1', name: locale === 'en' ? 'Technology' : 'التكنولوجيا', slug: 'technology' },
        tags: [
          { id: '1', name: locale === 'en' ? 'React' : 'ريآكت', slug: 'react' },
          { id: '2', name: 'Next.js', slug: 'nextjs' }
        ],
        imageUrl: '/images/placeholder.jpg',
        readTime: 5,
        featured: true,
        content: '',
        status: 'PUBLISHED' as const,
        views: 1250
      },
      {
        id: '2',
        title: locale === 'en' ? 'Understanding Web Performance' : 'فهم أداء الويب',
        excerpt: locale === 'en' 
          ? 'Optimize your website for better performance and user experience.'
          : 'حسّن موقعك للحصول على أداء أفضل وتجربة مستخدم محسّنة.',
        slug: 'understanding-web-performance',
        publishedAt: '2024-01-12',
        author: { id: '2', name: 'Sarah Wilson', avatar: '/images/avatars/sarah.jpg' },
        category: { id: '2', name: locale === 'en' ? 'Development' : 'التطوير', slug: 'development' },
        tags: [
          { id: '3', name: locale === 'en' ? 'Performance' : 'الأداء', slug: 'performance' },
          { id: '4', name: 'Web', slug: 'web' }
        ],
        imageUrl: '/images/placeholder.jpg',
        readTime: 8,
        featured: false,
        content: '',
        status: 'PUBLISHED' as const,
        views: 890
      }
    ],
    total: 2,
    categories: [
      { id: '1', name: locale === 'en' ? 'Technology' : 'التكنولوجيا', slug: 'technology' },
      { id: '2', name: locale === 'en' ? 'Development' : 'التطوير', slug: 'development' }
    ],
    tags: [
      { id: '1', name: locale === 'en' ? 'React' : 'ريآكت', slug: 'react' },
      { id: '2', name: locale === 'en' ? 'Performance' : 'الأداء', slug: 'performance' }
    ]
  }
}

async function getCategoriesAndTags(locale: Locale) {
  // Mock data - replace with real API call
  return {
    categories: [
      { id: '1', name: locale === 'en' ? 'Technology' : 'التكنولوجيا', slug: 'technology' },
      { id: '2', name: locale === 'en' ? 'Development' : 'التطوير', slug: 'development' },
      { id: '3', name: locale === 'en' ? 'Design' : 'التصميم', slug: 'design' }
    ],
    tags: [
      { id: '1', name: locale === 'en' ? 'React' : 'ريآكت', slug: 'react' },
      { id: '2', name: locale === 'en' ? 'Performance' : 'الأداء', slug: 'performance' },
      { id: '3', name: locale === 'en' ? 'UI/UX' : 'واجهة المستخدم', slug: 'ui-ux' }
    ]
  }
}

export default async function LocaleArticlesPage({ 
  params: { locale }, 
  searchParams = {} 
}: LocaleArticlesPageProps) {
  const content = getLocalizedContent(locale)
  const { articles, total } = await getArticles(locale, searchParams)
  const { categories, tags } = await getCategoriesAndTags(locale)
  
  const activeFilters = {
    search: searchParams.search || '',
    category: searchParams.category || '',
    tag: searchParams.tag || '',
    sort: searchParams.sort || 'newest'
  }

  const hasActiveFilters = activeFilters.search || activeFilters.category || activeFilters.tag

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <Section background="muted" spacing={{ top: 'lg', bottom: 'lg' }}>
        <Container>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {content.description}
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={content.searchPlaceholder}
                  defaultValue={activeFilters.search}
                  className={`pl-10 ${locale === 'ar' ? 'text-right' : ''}`}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Category Filter */}
              <div>
                <select 
                  defaultValue={activeFilters.category}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">{content.allCategories}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <select 
                  defaultValue={activeFilters.sort}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="newest">{content.newest}</option>
                  <option value="oldest">{content.oldest}</option>
                  <option value="popular">{content.popular}</option>
                  <option value="alphabetical">{content.alphabetical}</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeFilters.search && (
                  <Badge variant="secondary">
                    Search: {activeFilters.search}
                  </Badge>
                )}
                {activeFilters.category && (
                  <Badge variant="secondary">
                    Category: {categories.find(c => c.slug === activeFilters.category)?.name}
                  </Badge>
                )}
                {activeFilters.tag && (
                  <Badge variant="secondary">
                    Tag: {tags.find(t => t.slug === activeFilters.tag)?.name}
                  </Badge>
                )}
                <Button variant="ghost" size="sm">
                  {content.clearFilters}
                </Button>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Articles Content */}
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Suspense fallback={<div className="text-center py-12">Loading articles...</div>}>
            <ContentServerWrapper
              items={articles}
              state={articles.length > 0 ? 'loaded' : 'empty'}
              layout="grid"
              variant="compact"
              sortBy="newest"
              filters={{}}
              categories={categories}
              tags={tags}
              className="max-w-6xl mx-auto"
            />
          </Suspense>

          {/* Results Summary */}
          <div className="text-center mt-8 text-muted-foreground">
            <p>
              {locale === 'en' 
                ? `Showing ${articles.length} of ${total} articles`
                : `عرض ${articles.length} من ${total} مقالة`
              }
            </p>
          </div>
        </Container>
      </Section>
    </div>
  )
} 