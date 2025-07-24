'use client';

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ShareIcon,
  BookmarkIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/outline';

// Mobile article reader component
export interface MobileArticleReaderProps {
  title: string;
  content: string;
  author?: {
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  readTime?: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  onBookmark?: () => void;
  onShare?: () => void;
  onLike?: () => void;
  bookmarked?: boolean;
  liked?: boolean;
  likesCount?: number;
  className?: string;
}

const MobileArticleReader = forwardRef<HTMLArticleElement, MobileArticleReaderProps>(
  ({
    title,
    content,
    author,
    publishedAt,
    readTime,
    category,
    tags,
    imageUrl,
    onBookmark,
    onShare,
    onLike,
    bookmarked = false,
    liked = false,
    likesCount = 0,
    className,
  }, ref) => {
    const [fontSize, setFontSize] = useState(16);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const increaseFontSize = () => setFontSize(Math.min(24, fontSize + 2));
    const decreaseFontSize = () => setFontSize(Math.max(12, fontSize - 2));

    return (
      <article ref={ref} className={cn('max-w-full', className)}>
        {/* Header Image */}
        {imageUrl && (
          <div className="relative w-full h-48 sm:h-64 mb-6 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-6">
          {category && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                {category}
              </span>
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">
            {title}
          </h1>
          
          {/* Article Meta */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-3">
              {author?.avatar && (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                {author?.name && <div className="font-medium">{author.name}</div>}
                <div className="flex items-center gap-2">
                  {publishedAt && <span>{publishedAt}</span>}
                  {readTime && (
                    <>
                      <span>•</span>
                      <span>{readTime} min read</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reading Controls */}
          <div className="flex items-center justify-between py-3 border-y border-border">
            {/* Font Size Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={decreaseFontSize}
                className="p-2 rounded-full hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Decrease font size"
              >
                <MagnifyingGlassMinusIcon className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                {fontSize}px
              </span>
              <button
                onClick={increaseFontSize}
                className="p-2 rounded-full hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Increase font size"
              >
                <MagnifyingGlassPlusIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {isPlaying ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="h-4 w-4" />
                ) : (
                  <SpeakerWaveIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onLike && (
                <button
                  onClick={onLike}
                  className={cn(
                    'flex items-center gap-1 p-2 rounded-full min-h-[40px] px-3',
                    'transition-colors touch-manipulation',
                    liked 
                      ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                  aria-label={liked ? 'Unlike article' : 'Like article'}
                >
                  <HeartIcon className={cn('h-4 w-4', liked && 'fill-current')} />
                  {likesCount > 0 && (
                    <span className="text-xs font-medium">{likesCount}</span>
                  )}
                </button>
              )}
              
              {onBookmark && (
                <button
                  onClick={onBookmark}
                  className={cn(
                    'p-2 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center',
                    'transition-colors touch-manipulation',
                    bookmarked 
                      ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                  aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  <BookmarkIcon className={cn('h-4 w-4', bookmarked && 'fill-current')} />
                </button>
              )}
              
              {onShare && (
                <button
                  onClick={onShare}
                  className="p-2 rounded-full hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center text-muted-foreground"
                  aria-label="Share article"
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div 
          className="prose prose-gray max-w-none leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Tags */}
        {tags && tags.length > 0 && (
          <footer className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>
    );
  }
);
MobileArticleReader.displayName = 'MobileArticleReader';

// Mobile media gallery component
export interface MobileMediaGalleryProps {
  items: Array<{
    id: string;
    type: 'image' | 'video';
    src: string;
    thumbnail?: string;
    alt?: string;
    caption?: string;
  }>;
  initialIndex?: number;
  showThumbnails?: boolean;
  showCounter?: boolean;
  onItemChange?: (index: number) => void;
  className?: string;
}

const MobileMediaGallery = forwardRef<HTMLDivElement, MobileMediaGalleryProps>(
  ({
    items,
    initialIndex = 0,
    showThumbnails = true,
    showCounter = true,
    onItemChange,
    className,
  }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    const galleryRef = useRef<HTMLDivElement>(null);
    const startX = useRef<number>(0);
    const currentX = useRef<number>(0);
    const isDragging = useRef<boolean>(false);

    const goToNext = () => {
      const nextIndex = (currentIndex + 1) % items.length;
      setCurrentIndex(nextIndex);
      onItemChange?.(nextIndex);
    };

    const goToPrevious = () => {
      const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      onItemChange?.(prevIndex);
    };

    const goToIndex = (index: number) => {
      setCurrentIndex(index);
      onItemChange?.(index);
    };

    // Handle touch gestures for swiping
    useEffect(() => {
      const gallery = galleryRef.current;
      if (!gallery) return;

      const handleTouchStart = (e: TouchEvent) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return;
        currentX.current = e.touches[0].clientX;
      };

      const handleTouchEnd = () => {
        if (!isDragging.current) return;
        
        const deltaX = currentX.current - startX.current;
        const threshold = 50;
        
        if (deltaX > threshold) {
          goToPrevious();
        } else if (deltaX < -threshold) {
          goToNext();
        }
        
        isDragging.current = false;
      };

      gallery.addEventListener('touchstart', handleTouchStart);
      gallery.addEventListener('touchmove', handleTouchMove);
      gallery.addEventListener('touchend', handleTouchEnd);

      return () => {
        gallery.removeEventListener('touchstart', handleTouchStart);
        gallery.removeEventListener('touchmove', handleTouchMove);
        gallery.removeEventListener('touchend', handleTouchEnd);
      };
    }, []);

    const currentItem = items[currentIndex];

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Main Gallery */}
        <div
          ref={galleryRef}
          className="relative bg-black rounded-lg overflow-hidden aspect-video touch-manipulation"
        >
          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Previous item"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Next item"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter */}
          {showCounter && items.length > 1 && (
            <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
              {currentIndex + 1} / {items.length}
            </div>
          )}

          {/* Media Content */}
          <div
            className="w-full h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.map((item, index) => (
              <div key={item.id} className="w-full h-full flex-shrink-0 relative">
                {item.type === 'image' ? (
                  <img
                    src={item.src}
                    alt={item.alt || `Image ${index + 1}`}
                    className={cn(
                      'w-full h-full object-contain transition-transform duration-200',
                      isZoomed && 'scale-150 cursor-zoom-out',
                      !isZoomed && 'cursor-zoom-in'
                    )}
                    onClick={() => setIsZoomed(!isZoomed)}
                    loading={index === currentIndex ? 'eager' : 'lazy'}
                  />
                ) : (
                  <video
                    src={item.src}
                    poster={item.thumbnail}
                    controls
                    className="w-full h-full object-contain"
                    preload={index === currentIndex ? 'metadata' : 'none'}
                  />
                )}
                
                {/* Caption Overlay */}
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnails */}
        {showThumbnails && items.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => goToIndex(index)}
                className={cn(
                  'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                  index === currentIndex 
                    ? 'border-primary shadow-sm' 
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <img
                  src={item.thumbnail || item.src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
MobileMediaGallery.displayName = 'MobileMediaGallery';

// Mobile content card with rich interactions
export interface MobileContentCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  meta?: string;
  tags?: string[];
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
  }>;
  onTap?: () => void;
  className?: string;
}

const MobileContentCard = forwardRef<HTMLDivElement, MobileContentCardProps>(
  ({
    title,
    subtitle,
    description,
    imageUrl,
    category,
    meta,
    tags,
    actions,
    onTap,
    className,
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-card border border-border rounded-xl overflow-hidden shadow-sm',
          'transition-all duration-200 touch-manipulation',
          onTap && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
          className
        )}
        onClick={onTap}
      >
        {/* Image */}
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {category && (
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
                  {category}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-primary mt-1 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Meta */}
          {meta && (
            <p className="text-xs text-muted-foreground">
              {meta}
            </p>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs text-muted-foreground">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors touch-manipulation min-h-[40px]',
                    action.variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                    (!action.variant || action.variant === 'secondary') && 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {action.icon && (
                    <span className="flex-shrink-0">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
MobileContentCard.displayName = 'MobileContentCard';

export {
  MobileArticleReader,
  MobileMediaGallery,
  MobileContentCard,
}; 