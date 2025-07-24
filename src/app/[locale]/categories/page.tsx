import React, { Suspense } from 'react';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Folder,
  FileText,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface CategoriesPageProps {
  params: { locale: Locale }
  searchParams?: { search?: string }
}

interface Category {
  id: string
  name: string
  nameAr: string
  slug: string
  description: string
  descriptionAr: string
  articleCount: number
  latestArticle: {
    title: string
    publishedAt: string
    slug: string
  } | null
  color: string
  featured: boolean
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'All Categories',
      subtitle: 'Explore our content organized by categories',
      searchPlaceholder: 'Search categories...',
      featuredCategories: 'Featured Categories',
      allCategories: 'All Categories',
      articlesCount: 'articles',
      latestPost: 'Latest:',
      noCategories: 'No categories found',
      tryDifferentSearch: 'Try adjusting your search terms',
      viewArticles: 'View Articles',
      noLatestPost: 'No articles yet'
    },
    ar: {
      title: 'جميع الفئات',
      subtitle: 'استكشف محتوانا المنظم حسب الفئات',
      searchPlaceholder: 'البحث في الفئات...',
      featuredCategories: 'الفئات المميزة',
      allCategories: 'جميع الفئات',
      articlesCount: 'مقال',
      latestPost: 'الأحدث:',
      noCategories: 'لم يتم العثور على فئات',
      tryDifferentSearch: 'جرب تعديل مصطلحات البحث',
      viewArticles: 'عرض المقالات',
      noLatestPost: 'لا توجد مقالات بعد'
    }
  }
  
  return content[locale] || content.en
}

// Mock data - replace with real API calls
async function getCategories(locale: Locale, search?: string): Promise<Category[]> {
  const allCategories: Category[] = [
    {
      id: '1',
      name: 'Technology',
      nameAr: 'التكنولوجيا',
      slug: 'technology',
      description: 'Latest trends and insights in technology, AI, and digital innovation.',
      descriptionAr: 'أحدث الاتجاهات والرؤى في التكنولوجيا والذكاء الاصطناعي والابتكار الرقمي.',
      articleCount: 42,
      latestArticle: {
        title: locale === 'en' ? 'The Future of AI in Web Development' : 'مستقبل الذكاء الاصطناعي في تطوير الويب',
        publishedAt: '2024-01-15',
        slug: 'future-ai-web-development'
      },
      color: 'bg-blue-500',
      featured: true
    },
    {
      id: '2',
      name: 'Web Development',
      nameAr: 'تطوير الويب',
      slug: 'web-development',
      description: 'Tutorials, tips, and best practices for modern web development.',
      descriptionAr: 'دروس ونصائح وأفضل الممارسات لتطوير الويب الحديث.',
      articleCount: 38,
      latestArticle: {
        title: locale === 'en' ? 'Building Scalable React Applications' : 'بناء تطبيقات React قابلة للتوسع',
        publishedAt: '2024-01-12',
        slug: 'scalable-react-applications'
      },
      color: 'bg-green-500',
      featured: true
    },
    {
      id: '3',
      name: 'Design',
      nameAr: 'التصميم',
      slug: 'design',
      description: 'UI/UX design principles, trends, and creative inspiration.',
      descriptionAr: 'مبادئ تصميم واجهة المستخدم وتجربة المستخدم والاتجاهات والإلهام الإبداعي.',
      articleCount: 29,
      latestArticle: {
        title: locale === 'en' ? 'Design Systems for Modern Teams' : 'أنظمة التصميم للفرق الحديثة',
        publishedAt: '2024-01-10',
        slug: 'design-systems-modern-teams'
      },
      color: 'bg-purple-500',
      featured: true
    },
    {
      id: '4',
      name: 'Business',
      nameAr: 'الأعمال',
      slug: 'business',
      description: 'Business strategy, entrepreneurship, and startup insights.',
      descriptionAr: 'استراتيجية الأعمال وريادة الأعمال ورؤى الشركات الناشئة.',
      articleCount: 25,
      latestArticle: {
        title: locale === 'en' ? 'Building a Remote-First Company Culture' : 'بناء ثقافة شركة تعتمد العمل عن بُعد',
        publishedAt: '2024-01-08',
        slug: 'remote-first-company-culture'
      },
      color: 'bg-orange-500',
      featured: false
    },
    {
      id: '5',
      name: 'Data Science',
      nameAr: 'علم البيانات',
      slug: 'data-science',
      description: 'Data analysis, machine learning, and statistical insights.',
      descriptionAr: 'تحليل البيانات والتعلم الآلي والرؤى الإحصائية.',
      articleCount: 18,
      latestArticle: {
        title: locale === 'en' ? 'Machine Learning for Content Optimization' : 'التعلم الآلي لتحسين المحتوى',
        publishedAt: '2024-01-05',
        slug: 'ml-content-optimization'
      },
      color: 'bg-red-500',
      featured: false
    },
    {
      id: '6',
      name: 'Marketing',
      nameAr: 'التسويق',
      slug: 'marketing',
      description: 'Digital marketing strategies and content marketing best practices.',
      descriptionAr: 'استراتيجيات التسويق الرقمي وأفضل ممارسات تسويق المحتوى.',
      articleCount: 22,
      latestArticle: {
        title: locale === 'en' ? 'Content Marketing in the AI Era' : 'تسويق المحتوى في عصر الذكاء الاصطناعي',
        publishedAt: '2024-01-03',
        slug: 'content-marketing-ai-era'
      },
      color: 'bg-pink-500',
      featured: false
    }
  ]

  if (search) {
    const searchLower = search.toLowerCase()
    return allCategories.filter(category => 
      category.name.toLowerCase().includes(searchLower) ||
      category.nameAr.includes(search) ||
      category.description.toLowerCase().includes(searchLower) ||
      category.descriptionAr.includes(search)
    )
  }

  return allCategories
}

function CategoryCard({ category, locale }: { category: Category, locale: Locale }) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
              <Folder className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {locale === 'en' ? category.name : category.nameAr}
              </h3>
              {category.featured && (
                <Badge variant="secondary" className="mt-1">
                  {locale === 'en' ? 'Featured' : 'مميز'}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{category.articleCount}</div>
            <div className="text-sm text-muted-foreground">{content.articlesCount}</div>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
          {locale === 'en' ? category.description : category.descriptionAr}
        </p>

        {category.latestArticle && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">{content.latestPost}</p>
            <Link
              href={`/${locale}/articles/${category.latestArticle.slug}`}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
             >
              {category.latestArticle.title}
            </Link>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(category.latestArticle.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
          </div>
        )}

        <Link href={`/${locale}/categories/${category.slug}`}>
          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {content.viewArticles}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

async function CategoriesContent({ locale, search }: { locale: Locale, search?: string }) {
  const content = getLocalizedContent(locale)
  const categories = await getCategories(locale, search)
  const featuredCategories = categories.filter(cat => cat.featured)
  const regularCategories = categories.filter(cat => !cat.featured)

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {content.noCategories}
        </h3>
        <p className="text-muted-foreground">
          {content.tryDifferentSearch}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Featured Categories */}
      {featuredCategories.length > 0 && !search && (
        <div>
          <div className="flex items-center mb-8">
            <TrendingUp className="h-6 w-6 text-primary mr-3" />
            <h2 className="text-2xl font-bold text-foreground">
              {content.featuredCategories}
            </h2>
          </div>
          
          <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
            {featuredCategories.map((category) => (
              <GridItem key={category.id}>
                <CategoryCard category={category} locale={locale} />
              </GridItem>
            ))}
          </Grid>
        </div>
      )}

      {/* All Categories */}
      <div>
        <div className="flex items-center mb-8">
          <Folder className="h-6 w-6 text-primary mr-3" />
          <h2 className="text-2xl font-bold text-foreground">
            {search ? content.title : content.allCategories}
          </h2>
          {search && (
            <Badge variant="outline" className="ml-3">
              {categories.length} {locale === 'en' ? 'found' : 'وُجد'}
            </Badge>
          )}
        </div>
        
        <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
          {(search ? categories : regularCategories).map((category) => (
            <GridItem key={category.id}>
              <CategoryCard category={category} locale={locale} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </div>
  )
}

export default function CategoriesPage({ 
  params: { locale }, 
  searchParams = {} 
}: CategoriesPageProps) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section background="muted" spacing={{ top: 'lg', bottom: 'lg' }}>
        <Container>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {content.subtitle}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={content.searchPlaceholder}
                defaultValue={searchParams.search}
                className={`pl-10 ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Categories Content */}
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading categories...</p>
            </div>
          }>
            <CategoriesContent locale={locale} search={searchParams.search} />
          </Suspense>
        </Container>
      </Section>
    </div>
  )
} 