"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, BookOpen, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeroProps {
  locale: 'en' | 'ar'
  siteConfig: any
  featuredContent?: any[]
  className?: string
}

interface Article {
  id: string
  titleEn: string
  titleAr?: string
  excerptEn: string
  excerptAr?: string
  slug: string
  publishedAt: string
  featuredImage?: string
  category?: {
    name: string
    slug: string
  }
  readTime?: number
}

const getLocalizedContent = (locale: 'en' | 'ar') => {
  return {
    en: {
      heroTitle: "Welcome to the Future of Content",
      heroSubtitle: "Discover insights, stories, and perspectives that matter. Join our community of readers exploring the latest in technology, business, and innovation.",
      exploreContent: "Explore Content",
      watchIntro: "Watch Introduction",
      featuredStories: "Featured Stories",
      latestInsights: "Latest Insights",
      readMore: "Read More",
      minuteRead: "min read",
      stats: {
        articles: "Articles Published",
        readers: "Active Readers", 
        categories: "Content Categories"
      }
    },
    ar: {
      heroTitle: "مرحباً بك في مستقبل المحتوى",
      heroSubtitle: "اكتشف الرؤى والقصص ووجهات النظر المهمة. انضم إلى مجتمعنا من القراء الذين يستكشفون أحدث التطورات في التكنولوجيا والأعمال والابتكار.",
      exploreContent: "استكشف المحتوى",
      watchIntro: "شاهد المقدمة",
      featuredStories: "القصص المميزة",
      latestInsights: "أحدث الرؤى",
      readMore: "اقرأ المزيد",
      minuteRead: "دقيقة قراءة",
      stats: {
        articles: "مقال منشور",
        readers: "قارئ نشط",
        categories: "فئة محتوى"
      }
    }
  }[locale]
}

function StatsSection({ locale, className }: { locale: 'en' | 'ar', className?: string }) {
  const content = getLocalizedContent(locale)
  
  const stats = [
    { value: "2,500+", label: content.stats.articles, icon: BookOpen },
    { value: "15,000+", label: content.stats.readers, icon: Users },
    { value: "12", label: content.stats.categories, icon: TrendingUp },
  ]

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="text-center border-none bg-white/5 backdrop-blur-sm">
            <CardContent className="pt-6">
              <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function FeaturedCarousel({ 
  featuredContent, 
  locale, 
  className 
}: { 
  featuredContent: Article[], 
  locale: 'en' | 'ar', 
  className?: string 
}) {
  const content = getLocalizedContent(locale)

  if (!featuredContent || featuredContent.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <h3 className="text-xl font-semibold text-white mb-6">{content.featuredStories}</h3>
      <Carousel className="w-full" opts={{ align: "start", loop: true }}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {featuredContent.map((article, index) => (
            <CarouselItem key={article.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="group hover:shadow-lg transition-all duration-300 border-none bg-white/10 backdrop-blur-sm text-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    {article.category && (
                      <Badge variant="secondary" className="text-xs">
                        {article.category.name}
                      </Badge>
                    )}
                    {article.readTime && (
                      <span className="text-xs text-white/70">
                        {article.readTime} {content.minuteRead}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {locale === 'ar' && article.titleAr ? article.titleAr : article.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-white/80 line-clamp-3 mb-4">
                    {locale === 'ar' && article.excerptAr ? article.excerptAr : article.excerptEn}
                  </CardDescription>
                  <Link href={`/${locale}/articles/${article.slug}`}>
                    <Button variant="outline" size="sm" className="group border-white/20 text-white hover:bg-white hover:text-primary">
                      {content.readMore}
                      <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-white/20 text-white hover:bg-white hover:text-primary" />
        <CarouselNext className="border-white/20 text-white hover:bg-white hover:text-primary" />
      </Carousel>
    </div>
  );
}

export function ModernHero({ locale, siteConfig, featuredContent = [], className }: HeroProps) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'

  return (
    <section className={cn(
      "relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
      <div className="relative">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className={cn("space-y-8", isRTL && "text-right")}>
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  {content.heroTitle}
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                  {content.heroSubtitle}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${locale}/articles`}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <BookOpen className="mr-2 h-5 w-5" />
                    {content.exploreContent}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/20 text-white hover:bg-white hover:text-primary"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {content.watchIntro}
                </Button>
              </div>
            </div>

            {/* Featured Visual */}
            <div className="relative">
              <div className="relative z-10">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <div className="aspect-square bg-gradient-to-br from-primary to-purple-600 rounded-full w-3/4 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
            </div>
          </div>

          {/* Stats Section */}
          <StatsSection locale={locale} className="mb-20" />

          {/* Featured Content Carousel */}
          {featuredContent.length > 0 && (
            <FeaturedCarousel 
              featuredContent={featuredContent} 
              locale={locale}
              className="max-w-6xl mx-auto"
            />
          )}
        </div>
      </div>
    </section>
  );
} 