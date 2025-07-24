"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Eye, 
  Heart, 
  Share2, 
  BookOpen, 
  Calendar,
  ArrowRight,
  MessageCircle,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    id: string
    name: string
    slug: string
    color?: string
  }
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
  author?: {
    id: string
    name: string
    avatar?: string
  }
  readTime?: number
  views?: number
  likes?: number
  comments?: number
  readingProgress?: number
  isTrending?: boolean
  isFeatured?: boolean
}

interface ModernArticleCardProps {
  article: Article
  locale: 'en' | 'ar'
  variant?: 'default' | 'compact' | 'featured' | 'minimal'
  showProgress?: boolean
  showActions?: boolean
  showAuthor?: boolean
  className?: string
}

const getLocalizedContent = (locale: 'en' | 'ar') => {
  return {
    en: {
      readMore: 'Read More',
      minuteRead: 'min read',
      viewsCount: 'views',
      published: 'Published',
      trending: 'Trending',
      featured: 'Featured',
      readingProgress: 'Reading Progress',
      continueReading: 'Continue Reading',
      share: 'Share',
      like: 'Like',
      comments: 'Comments'
    },
    ar: {
      readMore: 'اقرأ المزيد',
      minuteRead: 'دقيقة قراءة',
      viewsCount: 'مشاهدة',
      published: 'منشور',
      trending: 'متداول',
      featured: 'مميز',
      readingProgress: 'تقدم القراءة',
      continueReading: 'تابع القراءة',
      share: 'مشاركة',
      like: 'إعجاب',
      comments: 'تعليقات'
    }
  }[locale]
}

function ArticleImage({ 
  article, 
  variant, 
  className 
}: { 
  article: Article
  variant: string
  className?: string 
}) {
  if (!article.featuredImage) return null

  const aspectRatio = variant === 'featured' ? 'aspect-[16/9]' : 'aspect-[4/3]'
  
  return (
    <div className={cn(
      aspectRatio,
      "relative overflow-hidden rounded-t-xl bg-muted",
      className
    )}>
      <img
        src={article.featuredImage}
        alt={article.titleEn}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Overlay Badges */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
        {article.isTrending && (
          <Badge className="bg-red-500/90 text-white backdrop-blur-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}
        {article.isFeatured && (
          <Badge className="bg-yellow-500/90 text-black backdrop-blur-sm">
            Featured
          </Badge>
        )}
      </div>

      {/* Reading Progress */}
      {article.readingProgress && article.readingProgress > 0 && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <span>Reading Progress</span>
              <span>{article.readingProgress}%</span>
            </div>
            <Progress value={article.readingProgress} className="h-1" />
          </div>
        </div>
      )}
    </div>
  )
}

function ArticleContent({ 
  article, 
  locale, 
  variant, 
  showAuthor, 
  showActions 
}: {
  article: Article
  locale: 'en' | 'ar'
  variant: string
  showAuthor: boolean
  showActions: boolean
}) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'

  return (
    <div className="flex flex-col flex-1">
      <CardHeader className={cn("pb-3", variant === 'minimal' && "pb-2")}>
        {/* Category and Meta Info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {article.category && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: article.category.color ? `${article.category.color}20` : undefined,
                  color: article.category.color || undefined,
                  borderColor: article.category.color ? `${article.category.color}40` : undefined
                }}
              >
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
          
          {variant !== 'minimal' && (
            <div className="flex items-center text-xs text-muted-foreground gap-3">
              {article.views && (
                <div className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {article.views.toLocaleString()}
                </div>
              )}
              {article.comments && (
                <div className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {article.comments}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <CardTitle className={cn(
          "group-hover:text-primary transition-colors leading-tight",
          variant === 'featured' ? "text-xl lg:text-2xl" : "text-lg",
          variant === 'minimal' ? "text-base" : "",
          variant === 'compact' ? "line-clamp-2" : "line-clamp-3"
        )}>
          {locale === 'ar' && article.titleAr ? article.titleAr : article.titleEn}
        </CardTitle>

        {/* Author Info */}
        {showAuthor && article.author && variant !== 'minimal' && (
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={article.author.avatar} />
              <AvatarFallback className="text-xs">
                {article.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{article.author.name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pt-0">
        {/* Excerpt */}
        {variant !== 'minimal' && (
          <CardDescription className={cn(
            "flex-1 mb-4",
            variant === 'compact' ? "line-clamp-2" : "line-clamp-3"
          )}>
            {locale === 'ar' && article.excerptAr ? article.excerptAr : article.excerptEn}
          </CardDescription>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && variant === 'featured' && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Bottom Section */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(article.publishedAt).toLocaleDateString(
              locale === 'ar' ? 'ar-SA' : 'en-US',
              { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {showActions && variant !== 'minimal' && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Heart className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <Link href={`/${locale}/articles/${article.slug}`}>
              <Button 
                variant={variant === 'featured' ? 'default' : 'outline'} 
                size="sm" 
                className="group"
              >
                {article.readingProgress && article.readingProgress > 0 
                  ? content.continueReading 
                  : content.readMore
                }
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

export function ModernArticleCard({ 
  article, 
  locale, 
  variant = 'default',
  showProgress = false,
  showActions = true,
  showAuthor = true,
  className 
}: ModernArticleCardProps) {
  const cardClasses = cn(
    "group h-full transition-all duration-300 overflow-hidden",
    "hover:shadow-lg hover:shadow-primary/5",
    "border-border/50 hover:border-border",
    variant === 'featured' && "lg:flex lg:flex-row",
    variant === 'minimal' && "border-none shadow-none hover:shadow-none bg-transparent",
    className
  )

  const contentClasses = cn(
    "flex flex-col",
    variant === 'featured' && "lg:flex-1"
  )

  return (
    <Card className={cardClasses}>
      {variant === 'featured' ? (
        <>
          <div className="lg:w-2/5">
            <ArticleImage article={article} variant={variant} className="lg:rounded-r-none lg:h-full" />
          </div>
          <div className={contentClasses}>
            <ArticleContent 
              article={article}
              locale={locale}
              variant={variant}
              showAuthor={showAuthor}
              showActions={showActions}
            />
          </div>
        </>
      ) : (
        <>
          {variant !== 'minimal' && (
            <ArticleImage article={article} variant={variant} />
          )}
          <div className={contentClasses}>
            <ArticleContent 
              article={article}
              locale={locale}
              variant={variant}
              showAuthor={showAuthor}
              showActions={showActions}
            />
          </div>
        </>
      )}
    </Card>
  )
} 