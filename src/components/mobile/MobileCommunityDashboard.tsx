'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Users, 
  Plus, 
  Search, 
  Menu, 
  Heart, 
  MessageSquare, 
  Share2,
  ChevronDown,
  ChevronUp,
  Filter,
  Bookmark,
  TrendingUp,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  lastActivity: Date;
  category: string;
  avatar?: string;
  isPrivate: boolean;
  trending: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  community: {
    id: string;
    name: string;
  };
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: Date;
  images?: string[];
  type: 'text' | 'image' | 'video' | 'poll' | 'event';
}

export default function MobileCommunityDashboard() {
  const { data: session } = useSession();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'trending' | 'events'>('feed');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pullToRefresh, setPullToRefresh] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef<number>(0);
  const pullDistance = useRef<number>(0);

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pull to refresh functionality
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (scrollRef.current && scrollRef.current.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (pullStartY.current > 0) {
        const currentY = e.touches[0].clientY;
        pullDistance.current = currentY - pullStartY.current;
        
        if (pullDistance.current > 50) {
          setPullToRefresh(true);
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullToRefresh) {
        handleRefresh();
      }
      pullStartY.current = 0;
      pullDistance.current = 0;
      setPullToRefresh(false);
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('touchstart', handleTouchStart);
      scrollContainer.addEventListener('touchmove', handleTouchMove);
      scrollContainer.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('touchstart', handleTouchStart);
        scrollContainer.removeEventListener('touchmove', handleTouchMove);
        scrollContainer.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [pullToRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCommunities(),
        fetchPosts()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities');
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      // Load from cache if offline
      if (!isOnline) {
        const cached = localStorage.getItem('cached-communities');
        if (cached) {
          setCommunities(JSON.parse(cached));
        }
      }
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/content/articles');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        // Cache for offline use
        localStorage.setItem('cached-posts', JSON.stringify(data.posts || []));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Load from cache if offline
      if (!isOnline) {
        const cached = localStorage.getItem('cached-posts');
        if (cached) {
          setPosts(JSON.parse(cached));
        }
      }
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/content/articles/${postId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Queue for offline sync
      if (!isOnline) {
        queueOfflineAction('like', { postId, action: 'toggle' });
      }
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch(`/api/content/articles/${postId}/bookmark`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isBookmarked: !post.isBookmarked }
            : post
        ));
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      if (!isOnline) {
        queueOfflineAction('bookmark', { postId, action: 'toggle' });
      }
    }
  };

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: `/posts/${post.id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(`${post.title} - ${window.location.origin}/posts/${post.id}`);
      alert('Link copied to clipboard!');
    }
  };

  const queueOfflineAction = (type: string, data: any) => {
    const actions = JSON.parse(localStorage.getItem('offline-actions') || '[]');
    actions.push({
      type,
      data,
      timestamp: Date.now(),
    });
    localStorage.setItem('offline-actions', JSON.stringify(actions));
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {post.author.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{post.author.name}</p>
                      <p className="text-xs text-gray-500">{post.community.name} • {new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-2 text-gray-900">{post.title}</h3>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">{post.content}</p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={post.images[0]} 
                        alt="Post image" 
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 text-sm ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500'
                        } touch-target`}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-sm text-gray-500 touch-target">
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.comments}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleShare(post)}
                        className="flex items-center space-x-1 text-sm text-gray-500 touch-target"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleBookmark(post.id)}
                      className={`p-2 rounded-full touch-target ${
                        post.isBookmarked ? 'text-blue-500' : 'text-gray-400'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
        
      case 'communities':
        return (
          <div className="space-y-3">
            {communities.map((community) => (
              <Card key={community.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {community.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">{community.name}</h3>
                        {community.trending && (
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                        )}
                        {community.isPrivate && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{community.memberCount} members</span>
                        <span>{community.postCount} posts</span>
                      </div>
                    </div>
                    <Button
                      variant={community.isJoined ? "outline" : "default"}
                      size="sm"
                      className="whitespace-nowrap touch-target"
                    >
                      {community.isJoined ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
        
      case 'trending':
        return (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Trending Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['#AI', '#WebDev', '#Community', '#Mobile', '#PWA'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {posts.slice(0, 5).map((post) => (
              <Card key={post.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-600">Trending</span>
                  </div>
                  <h3 className="font-semibold mb-2">{post.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.likes} likes • {post.comments} comments</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
        
      case 'events':
        return (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                </div>
                <p className="text-sm text-gray-600">Join community events and meetups</p>
              </CardContent>
            </Card>
            
            {[1, 2, 3].map((event) => (
              <Card key={event} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-green-700">MAR</span>
                      <span className="text-sm font-bold text-green-900">{15 + event}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Community Meetup #{event}</h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>Virtual Event</span>
                      </div>
                      <p className="text-sm text-gray-600">Join us for an exciting community discussion</p>
                    </div>
                    <Button size="sm" variant="outline" className="touch-target">
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 touch-target"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Communities</h1>
            {!isOnline && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                Offline
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-gray-100 touch-target"
            >
              <Filter className="w-6 h-6" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 touch-target relative">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search communities, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t bg-gray-50">
            <div className="flex overflow-x-auto space-x-2 py-2">
              {['All', 'Following', 'Popular', 'Recent', 'Nearby'].map((filter) => (
                <button
                  key={filter}
                  className="px-4 py-2 bg-white rounded-full text-sm font-medium whitespace-nowrap border hover:bg-gray-50 touch-target"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Pull to Refresh Indicator */}
      {pullToRefresh && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm z-50">
          Release to refresh
        </div>
      )}

      {/* Main Content */}
      <main 
        ref={scrollRef}
        className="pb-20 overflow-y-auto"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <div className="p-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="flex space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex items-center justify-around py-2">
          {[
            { key: 'feed', icon: Users, label: 'Feed' },
            { key: 'communities', icon: Users, label: 'Communities' },
            { key: 'trending', icon: TrendingUp, label: 'Trending' },
            { key: 'events', icon: Calendar, label: 'Events' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg touch-target ${
                activeTab === key 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center touch-target hover:bg-blue-700 transition-colors">
        <Plus className="w-6 h-6" />
      </button>

      {/* Side Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMenu(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 touch-target"
                >
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>
              
              <nav className="space-y-2">
                {[
                  { icon: Users, label: 'My Communities', href: '/communities/my' },
                  { icon: Bell, label: 'Notifications', href: '/notifications' },
                  { icon: Bookmark, label: 'Saved Posts', href: '/saved' },
                  { icon: Calendar, label: 'Events', href: '/events' },
                  { icon: TrendingUp, label: 'Analytics', href: '/analytics' },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={href}
                    href={href}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 touch-target"
                  >
                    <Icon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 