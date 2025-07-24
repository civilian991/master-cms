'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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

interface CalendarEvent {
  date: Date;
  posts: SocialMediaPost[];
}

export function SocialMediaCalendar({ siteId }: { siteId: string }) {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [siteId]);

  useEffect(() => {
    generateCalendarEvents();
  }, [posts]);

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

  const generateCalendarEvents = () => {
    const events: CalendarEvent[] = [];
    const scheduledPosts = posts.filter(post => post.scheduledAt);
    
    scheduledPosts.forEach(post => {
      const postDate = new Date(post.scheduledAt!);
      const existingEvent = events.find(event => isSameDay(event.date, postDate));
      
      if (existingEvent) {
        existingEvent.posts.push(post);
      } else {
        events.push({
          date: postDate,
          posts: [post]
        });
      }
    });

    setCalendarEvents(events);
  };

  const getPostsForDate = (date: Date) => {
    return calendarEvents.find(event => isSameDay(event.date, date))?.posts || [];
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
    return <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>;
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

  const renderDayContent = (date: Date) => {
    const dayPosts = getPostsForDate(date);
    
    if (dayPosts.length === 0) {
      return null;
    }

    return (
      <div className="absolute inset-0 p-1">
        <div className="flex flex-col gap-1">
          {dayPosts.slice(0, 2).map((post) => (
            <div
              key={post.id}
              className="text-xs bg-blue-100 rounded px-1 py-0.5 truncate"
              title={post.content}
            >
              {post.platform}: {post.content.substring(0, 20)}...
            </div>
          ))}
          {dayPosts.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{dayPosts.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Content Calendar</h2>
        <Button onClick={loadPosts} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate && (
                <div className="space-y-4">
                  {getPostsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No posts scheduled for this date
                    </p>
                  ) : (
                    getPostsForDate(selectedDate).map((post) => (
                      <div key={post.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{post.platform}</Badge>
                            {getStatusBadge(post.status)}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm mb-2">{post.content}</p>
                        <div className="text-xs text-gray-500">
                          Scheduled: {format(new Date(post.scheduledAt!), 'h:mm a')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 