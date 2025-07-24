'use client'

import React, { useState } from 'react'
import {
  MobileContainer,
  MobileGrid,
  SwipeableCard,
  PullToRefresh,
  TouchCarousel,
  TouchButton,
  MobileArticleCard,
  MobileNavigationHeader
} from '@/components/mobile'
import { 
  BookmarkIcon, 
  TrashIcon, 
  HeartIcon, 
  ShareIcon,
  RefreshCwIcon,
  StarIcon
} from 'lucide-react'

// Sample data for demo
const sampleArticles = [
  {
    id: '1',
    title: 'Mobile-First Design Principles for Modern Web Applications',
    excerpt: 'Learn how to create touch-optimized interfaces that work seamlessly across all mobile devices with these essential design principles.',
    author: { name: 'Sarah Chen', avatar: '/avatars/sarah.jpg' },
    publishedAt: '2024-01-15',
    readingTime: 8,
    image: '/demo/mobile-design.jpg',
    category: 'Design',
    isBookmarked: false,
    isLiked: false,
    likesCount: 42
  },
  {
    id: '2',
    title: 'Advanced Touch Gestures in React Applications',
    excerpt: 'Implement sophisticated touch interactions including pinch-to-zoom, multi-touch gestures, and haptic feedback for enhanced user experience.',
    author: { name: 'Mike Johnson', avatar: '/avatars/mike.jpg' },
    publishedAt: '2024-01-14',
    readingTime: 12,
    image: '/demo/touch-gestures.jpg',
    category: 'Development',
    isBookmarked: true,
    isLiked: true,
    likesCount: 67
  },
  {
    id: '3',
    title: 'Progressive Web App Performance Optimization',
    excerpt: 'Optimize your PWA for mobile devices with advanced caching strategies, service workers, and performance monitoring techniques.',
    author: { name: 'Emma Davis', avatar: '/avatars/emma.jpg' },
    publishedAt: '2024-01-13',
    readingTime: 15,
    image: '/demo/pwa-performance.jpg',
    category: 'Performance',
    isBookmarked: false,
    isLiked: false,
    likesCount: 89
  }
]

const carouselItems = [
  <div key="1" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg text-center">
    <h3 className="text-xl font-bold mb-2">Touch Gestures</h3>
    <p>Swipe, pinch, and tap with natural interactions</p>
  </div>,
  <div key="2" className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-8 rounded-lg text-center">
    <h3 className="text-xl font-bold mb-2">Haptic Feedback</h3>
    <p>Feel the interface respond to your touch</p>
  </div>,
  <div key="3" className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-8 rounded-lg text-center">
    <h3 className="text-xl font-bold mb-2">Smooth Animations</h3>
    <p>Fluid transitions that feel natural</p>
  </div>
]

export default function MobileDemoPage() {
  const [articles, setArticles] = useState(sampleArticles)
  const [refreshCount, setRefreshCount] = useState(0)

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshCount(prev => prev + 1)
  }

  const handleBookmark = (id: string) => {
    setArticles(prev => prev.map(article => 
      article.id === id 
        ? { ...article, isBookmarked: !article.isBookmarked }
        : article
    ))
  }

  const handleLike = (id: string) => {
    setArticles(prev => prev.map(article => 
      article.id === id 
        ? { 
            ...article, 
            isLiked: !article.isLiked,
            likesCount: article.isLiked ? article.likesCount - 1 : article.likesCount + 1
          }
        : article
    ))
  }

  const handleShare = (id: string) => {
    // Simulate share action
    alert(`Sharing article ${id}`)
  }

  const handleArchive = (id: string) => {
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  const handleDelete = (id: string) => {
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigationHeader 
        title="Mobile Demo"
        rightActions={
          <TouchButton variant="ghost" size="sm">
            <StarIcon size={20} />
          </TouchButton>
        }
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <MobileContainer className="py-6 space-y-8">
          
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Mobile Experience Demo
            </h1>
            <p className="text-gray-600">
              Experience our touch-optimized components and gestures
            </p>
            {refreshCount > 0 && (
              <p className="text-sm text-green-600">
                Refreshed {refreshCount} time{refreshCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Touch Carousel */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 px-4">
              Touch Carousel
            </h2>
            <TouchCarousel 
              items={carouselItems}
              autoPlay={true}
              autoPlayInterval={4000}
            />
          </section>

          {/* Interactive Buttons */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 px-4">
              Touch Buttons
            </h2>
            <MobileGrid columns={{ mobile: 2, tablet: 4 }} gap="md" className="px-4">
              <TouchButton variant="primary">
                Primary
              </TouchButton>
              <TouchButton variant="secondary">
                Secondary
              </TouchButton>
              <TouchButton variant="outline">
                Outline
              </TouchButton>
              <TouchButton variant="ghost">
                Ghost
              </TouchButton>
            </MobileGrid>
          </section>

          {/* Swipeable Cards */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 px-4">
              Swipeable Articles
            </h2>
            <p className="text-sm text-gray-600 px-4">
              Swipe right to bookmark, swipe left to archive
            </p>
            
            <div className="space-y-4 px-4">
              {articles.map(article => (
                <SwipeableCard
                  key={article.id}
                  onSwipeLeft={() => handleArchive(article.id)}
                  onSwipeRight={() => handleBookmark(article.id)}
                  leftAction={{
                    label: 'Archive',
                    icon: TrashIcon,
                    color: 'red'
                  }}
                  rightAction={{
                    label: 'Bookmark',
                    icon: BookmarkIcon,
                    color: 'blue'
                  }}
                >
                  <MobileArticleCard
                    article={article}
                    variant="compact"
                    onBookmark={handleBookmark}
                    onLike={handleLike}
                    onShare={handleShare}
                  />
                </SwipeableCard>
              ))}
            </div>
          </section>

          {/* Feature Cards */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 px-4">
              Mobile Features
            </h2>
            
            <MobileGrid columns={{ mobile: 1, tablet: 2 }} gap="md" className="px-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <RefreshCwIcon size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Pull to Refresh</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Pull down from the top to refresh content
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <HeartIcon size={16} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold">Haptic Feedback</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Feel tactile responses to your interactions
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShareIcon size={16} className="text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Touch Gestures</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Swipe, pinch, and long-press interactions
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <StarIcon size={16} className="text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Responsive Design</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Optimized for all screen sizes and orientations
                </p>
              </div>
            </MobileGrid>
          </section>

          {/* Instructions */}
          <section className="space-y-4 pb-20">
            <h2 className="text-lg font-semibold text-gray-900 px-4">
              Try These Gestures
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Navigation Gestures
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Swipe right from edge to go back</li>
                <li>• Pull down to refresh content</li>
                <li>• Long press for context menus</li>
                <li>• Pinch to zoom on images</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-4">
              <h3 className="font-medium text-green-900 mb-2">
                Card Interactions
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Swipe right on articles to bookmark</li>
                <li>• Swipe left on articles to archive</li>
                <li>• Tap buttons for haptic feedback</li>
                <li>• Swipe carousel items left/right</li>
              </ul>
            </div>
          </section>

        </MobileContainer>
      </PullToRefresh>
    </div>
  )
} 