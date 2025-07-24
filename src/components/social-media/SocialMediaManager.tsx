'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Send, Clock, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SocialMediaPost {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  metadata?: any;
}

interface SocialMediaAnalytics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
  likes: number;
  comments: number;
}

export function SocialMediaManager({ siteId }: { siteId: string }) {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [analytics, setAnalytics] = useState<SocialMediaAnalytics | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Load platforms on component mount
  useEffect(() => {
    loadPlatforms();
    loadPosts();
    loadAnalytics();
  }, [siteId]);

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/social-media/platforms');
      const data = await response.json();
      setPlatforms(data.platforms || []);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/social-media?siteId=${siteId}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/social-media/analytics?siteId=${siteId}`);
      const data = await response.json();
      if (data.analytics && data.analytics.length > 0) {
        // Aggregate analytics data
        const aggregated = data.analytics.reduce((acc: any, curr: any) => {
          const data = curr.data;
          return {
            impressions: (acc.impressions || 0) + (data.impressions || 0),
            reach: (acc.reach || 0) + (data.reach || 0),
            engagement: (acc.engagement || 0) + (data.engagement || 0),
            clicks: (acc.clicks || 0) + (data.clicks || 0),
            shares: (acc.shares || 0) + (data.shares || 0),
            likes: (acc.likes || 0) + (data.likes || 0),
            comments: (acc.comments || 0) + (data.comments || 0),
          };
        }, {});
        setAnalytics(aggregated);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const createPost = async () => {
    if (!content || !selectedPlatform) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          platform: selectedPlatform,
          siteId,
          scheduledAt: scheduledDate?.toISOString(),
        }),
      });

      if (response.ok) {
        setContent('');
        setSelectedPlatform('');
        setScheduledDate(undefined);
        loadPosts();
      } else {
        const error = await response.json();
        alert(`Failed to create post: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social-media/${postId}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        loadPosts();
      } else {
        const error = await response.json();
        alert(`Failed to publish post: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
      alert('Failed to publish post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/social-media/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadPosts();
      } else {
        const error = await response.json();
        alert(`Failed to delete post: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      SCHEDULED: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      PUBLISHED: { color: 'bg-green-100 text-green-800', label: 'Published' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      CANCELLED: { color: 'bg-yellow-100 text-yellow-800', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Social Media Manager</h1>
        <Button onClick={loadPosts} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.impressions}</div>
                <div className="text-sm text-gray-600">Impressions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.reach}</div>
                <div className="text-sm text-gray-600">Reach</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.engagement}</div>
                <div className="text-sm text-gray-600">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.clicks}</div>
                <div className="text-sm text-gray-600">Clicks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Schedule</label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={createPost} disabled={loading || !content || !selectedPlatform}>
              {scheduledDate ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Now
                </>
              )}
            </Button>
            {scheduledDate && (
              <Button variant="outline" onClick={() => setScheduledDate(undefined)}>
                Remove Schedule
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No posts found</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{post.platform}</Badge>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm mb-2">{post.content}</p>
                      <div className="text-xs text-gray-500">
                        Created: {format(new Date(post.createdAt), 'PPP')}
                        {post.scheduledAt && (
                          <span className="ml-4">
                            Scheduled: {format(new Date(post.scheduledAt), 'PPP')}
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="ml-4">
                            Published: {format(new Date(post.publishedAt), 'PPP')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => publishPost(post.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 