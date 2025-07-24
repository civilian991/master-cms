import React, { Suspense } from 'react';
import { ModernHero } from '@/components/site/modern-hero';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, Clock, Eye, User, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface LocalePageProps {
  params: { locale: Locale }
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'Master CMS Framework',
      subtitle: 'Your trusted source for news and insights',
      latestArticles: 'Latest Articles',
      latestArticlesDesc: 'Stay updated with our latest insights and analysis',
      viewAllArticles: 'View All Articles',
      recommendedForYou: 'Recommended for You',
      recommendedDesc: 'Discover personalized content recommendations powered by AI',
      exploreByCategory: 'Explore by Category',
      noFeaturedContent: 'No featured content available',
      noArticlesYet: 'No articles available yet',
      checkBackSoon: 'Check back soon for new content',
      readMore: 'Read More',
      minuteRead: 'min read',
      viewsCount: 'views',
      published: 'Published',
      featuredArticles: 'Featured Articles',
      newsletter: {
        title: 'Stay Updated',
        description: 'Subscribe to our newsletter for the latest articles and insights delivered to your inbox.',
        subscribe: 'Subscribe',
        enterEmail: 'Enter your email'
      }
    },
    ar: {
      title: 'إطار عمل Master CMS',
      subtitle: 'مصدرك الموثوق للأخبار والرؤى',
      latestArticles: 'أحدث المقالات',
      latestArticlesDesc: 'ابق على اطلاع دائم بأحدث رؤانا وتحليلاتنا',
      viewAllArticles: 'عرض جميع المقالات',
      recommendedForYou: 'موصى لك',
      recommendedDesc: 'اكتشف توصيات المحتوى المخصصة المدعومة بالذكاء الاصطناعي',
      exploreByCategory: 'استكشف حسب الفئة',
      noFeaturedContent: 'لا يوجد محتوى مميز متاح',
      noArticlesYet: 'لا توجد مقالات متاحة بعد',
      checkBackSoon: 'تحقق مرة أخرى قريباً للمحتوى الجديد',
      readMore: 'اقرأ المزيد',
      minuteRead: 'دقيقة قراءة',
      viewsCount: 'مشاهدة',
      published: 'منشور',
      featuredArticles: 'المقالات المميزة',
      newsletter: {
        title: 'ابق محدثاً',
        description: 'اشترك في نشرتنا الإخبارية للحصول على أحدث المقالات والرؤى في صندوق بريدك.',
        subscribe: 'اشترك',
        enterEmail: 'أدخل بريدك الإلكتروني'
      }
    }
  }
  
  return content[locale] || content.en
}

// Categories with localized names
const getLocalizedCategories = (locale: Locale) => {
  const categories = {
    en: ['Technology', 'Economy', 'Business', 'Culture', 'Politics', 'Sports'],
    ar: ['التكنولوجيا', 'الاقتصاد', 'الأعمال', 'الثقافة', 'السياسة', 'الرياضة']
  }
  
  return categories[locale] || categories.en
}

// API function to fetch featured content
async function getFeaturedContent() {
  try {
    const config = siteConfig.getConfig();
    const response = await fetch(`${config.domain}/api/content/articles?status=PUBLISHED&limit=3&sort=featured`, {
      cache: 'no-cache',
      next: { revalidate: 300 } // 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch featured content');
    }
    
    const result = await response.json();
    return result.data?.articles || [];
  } catch (error) {
    console.error('Error fetching featured content:', error);
    return [];
  }
}

// API function to fetch latest articles
async function getLatestArticles() {
  try {
    const config = siteConfig.getConfig();
    const response = await fetch(`${config.domain}/api/content/articles?status=PUBLISHED&limit=6&sort=newest`, {
      cache: 'no-cache',
      next: { revalidate: 180 } // 3 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch latest articles');
    }
    
    const result = await response.json();
    return result.data?.articles || [];
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    return [];
  }
}

// Loading components
function ArticleCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function ArticlesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Article Card Component
interface ArticleCardProps {
  article: any
  locale: Locale
}

function ArticleCard({ article, locale }: ArticleCardProps) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'
  
  return (
    <Card className="group h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          {article.category && (
            <Badge variant="secondary" className="text-xs">
              {article.category.name}
            </Badge>
          )}
          {article.readTime && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {article.readTime} {content.minuteRead}
            </div>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {locale === 'ar' && article.titleAr ? article.titleAr : article.titleEn}
        </CardTitle>
        <div className="flex items-center text-xs text-muted-foreground space-x-4">
          {article.author && (
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {article.author.name}
            </div>
          )}
          {article.views && (
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {article.views} {content.viewsCount}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="line-clamp-3 mb-4">
          {locale === 'ar' && article.excerptAr ? article.excerptAr : article.excerptEn}
        </CardDescription>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {content.published} {new Date(article.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
          </span>
          <Link href={`/${locale}/articles/${article.slug}`}>
            <Button variant="outline" size="sm" className="group">
              {content.readMore}
              <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Latest articles section component  
async function LatestArticlesSection({ locale }: { locale: Locale }) {
  const latestArticles = await getLatestArticles();
  const content = getLocalizedContent(locale);
  const categories = getLocalizedCategories(locale);
  
  if (!latestArticles || latestArticles.length === 0) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {content.latestArticles}
              </h2>
              <p className="text-muted-foreground">
                {content.latestArticlesDesc}
              </p>
            </div>
            <Link href={`/${locale}/articles`}>
              <Button variant="outline">
                {content.viewAllArticles}
                <BookOpen className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{content.noArticlesYet}</p>
              <p className="text-sm text-muted-foreground mt-2">{content.checkBackSoon}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {content.latestArticles}
            </h2>
            <p className="text-muted-foreground">
              {content.latestArticlesDesc}
            </p>
          </div>
          <Link href={`/${locale}/articles`}>
            <Button variant="outline">
              {content.viewAllArticles}
              <BookOpen className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {latestArticles.map((article: any) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>

        {/* Quick Navigation */}
        <Card className="p-6 bg-accent/5 border-accent/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">
              {content.exploreByCategory}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <Link
                  key={category}
                  href={`/${locale}/categories/${category.toLowerCase()}`}
                  className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                 >
                  <TrendingUp className="mr-2 h-3 w-3" />
                  {category}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Newsletter section
function NewsletterSection({ locale }: { locale: Locale }) {
  const content = getLocalizedContent(locale)
  const config = siteConfig.getConfig();

  if (!config.contentTypes?.newsletters) {
    return null
  }

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {content.newsletter.title}
          </h2>
          <p className="text-xl opacity-90 mb-8">
            {content.newsletter.description}
          </p>
          <Card className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder={content.newsletter.enterEmail}
                  className="flex-1 px-4 py-3 rounded-lg text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
                <Button variant="secondary" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  {content.newsletter.subscribe}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default async function LocalizedHomepage({ params }: LocalePageProps) {
  const { locale } = await params;
  const config = siteConfig.getConfig();

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <Suspense fallback={
        <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Skeleton className="h-12 w-96 mx-auto mb-4 bg-white/10" />
            <Skeleton className="h-6 w-64 mx-auto bg-white/10" />
          </div>
        </div>
      }>
        <ModernHero 
          locale={locale} 
          siteConfig={config} 
          featuredContent={[]} // This will be populated by server component
        />
      </Suspense>

      {/* Latest Articles Section */}
      <Suspense fallback={
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <ArticlesGridSkeleton />
          </div>
        </section>
      }>
        <LatestArticlesSection locale={locale} />
      </Suspense>

      {/* Newsletter Signup Section */}
      <NewsletterSection locale={locale} />
    </div>
  );
} 