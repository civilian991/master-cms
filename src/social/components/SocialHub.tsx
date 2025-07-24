'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  TrendingUp,
  MessageCircle,
  Calendar,
  Settings,
  Plus,
  Refresh,
  Bell,
  BarChart3,
  Camera,
  Edit,
  Share,
  Heart,
  Eye,
  UserCheck,
  Zap,
  Target,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SocialHubProps,
  SocialAccount,
  SocialPlatform,
  PostAnalytics,
  BrandMention,
  SocialCampaign,
  TrendingTopic,
} from '../types/social.types';
import { useSocialPlatforms } from '../hooks/useSocialPlatforms';
import { useSocialAnalytics } from '../hooks/useSocialAnalytics';
import { useSocialInbox } from '../hooks/useSocialInbox';

// Platform icons mapping
const PlatformIcon = ({ platform, className = "h-5 w-5" }: { platform: SocialPlatform; className?: string }) => {
  const iconMap = {
    facebook: "🟦", // Facebook blue
    twitter: "🟦",  // Twitter/X blue
    instagram: "🟨", // Instagram gradient (simplified)
    linkedin: "🟦", // LinkedIn blue
    tiktok: "⚫",   // TikTok black
    youtube: "🟥", // YouTube red
    pinterest: "🟥", // Pinterest red
    snapchat: "🟨", // Snapchat yellow
    reddit: "🟠",  // Reddit orange
    discord: "🟣", // Discord purple
  };

  return (
    <span className={`inline-block ${className}`}>
      {iconMap[platform] || "🌐"}
    </span>
  );
};

export function SocialHub({
  userId,
  accounts,
  onAccountConnect,
  onAccountDisconnect,
  onRefresh,
}: SocialHubProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);

  // Social media hooks
  const {
    platforms,
    isLoading: platformsLoading,
    connect,
    disconnect,
    refresh: refreshPlatforms,
  } = useSocialPlatforms({
    autoConnect: false,
    syncInterval: 300000, // 5 minutes
  });

  const {
    analytics,
    isLoading: analyticsLoading,
    dateRange,
    setDateRange,
    refresh: refreshAnalytics,
  } = useSocialAnalytics({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    includeCompetitors: true,
  });

  const {
    mentions,
    unreadCount,
    isLoading: inboxLoading,
    markAsRead,
    respond,
    refresh: refreshInbox,
  } = useSocialInbox({
    autoAssign: true,
    realtime: true,
  });

  // Mock data for demonstration
  const mockCampaigns: SocialCampaign[] = [
    {
      id: '1',
      name: 'Summer Product Launch',
      description: 'Multi-platform campaign for new product line',
      type: 'awareness',
      status: 'active',
      platforms: ['facebook', 'instagram', 'twitter'],
      objective: 'Increase brand awareness by 25%',
      team: {
        owner: userId,
        members: [],
        collaborators: [],
        approvers: [],
      },
      settings: {
        autoPost: true,
        requireApproval: false,
        enableTracking: true,
        customFields: {},
      },
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(),
      tags: ['summer', 'product-launch'],
      notes: [],
    } as SocialCampaign,
  ];

  const mockTrendingTopics: TrendingTopic[] = [
    {
      id: '1',
      topic: 'Sustainable Fashion',
      hashtag: '#SustainableFashion',
      volume: 12500,
      growth: 15.2,
      sentiment: 'positive',
      platforms: {
        instagram: 5000,
        twitter: 4500,
        facebook: 2000,
        linkedin: 1000,
        tiktok: 0,
        youtube: 0,
        pinterest: 0,
        snapchat: 0,
        reddit: 0,
        discord: 0,
      },
      demographics: {
        gender: { female: 70, male: 25, other: 5 },
        age: { '18-24': 30, '25-34': 40, '35-44': 20, '45+': 10 },
        location: { 'North America': 40, 'Europe': 35, 'Asia': 20, 'Other': 5 },
        language: { 'English': 80, 'Spanish': 10, 'French': 5, 'Other': 5 },
        device: { 'Mobile': 75, 'Desktop': 20, 'Tablet': 5 },
        interests: { 'Fashion': 100, 'Sustainability': 85, 'Environment': 70 },
      },
      relatedTopics: ['eco-friendly', 'circular-economy', 'green-fashion'],
      influencers: [],
      samplePosts: [],
      peakTime: new Date(),
      decayRate: 5,
      category: 'educational',
      relevanceScore: 85,
      opportunityScore: 92,
      discoveredAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const totalFollowers = accounts.reduce((sum, account) => sum + account.followerCount, 0);
  const connectedPlatforms = accounts.length;
  const totalEngagement = analytics?.summary?.totalEngagements || 0;
  const engagementRate = analytics?.summary?.engagementRate || 0;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAccountConnect = async (platform: SocialPlatform) => {
    try {
      await connect(platform);
      onAccountConnect(platform);
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
    }
  };

  const handleAccountDisconnect = async (accountId: string) => {
    try {
      await disconnect(accountId);
      onAccountDisconnect(accountId);
    } catch (error) {
      console.error(`Failed to disconnect account ${accountId}:`, error);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refreshPlatforms(),
        refreshAnalytics(),
        refreshInbox(),
      ]);
      onRefresh();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderOverviewStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +12% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{connectedPlatforms}</div>
          <p className="text-xs text-muted-foreground">
            {5 - connectedPlatforms} more available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +8.2% from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{engagementRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            +0.5% from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderConnectedAccounts = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Connected Accounts</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={platformsLoading}
          >
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <PlatformIcon platform={account.platform} />
                <div>
                  <p className="font-medium">{account.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{account.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.followerCount.toLocaleString()} followers
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={account.isConnected ? "default" : "secondary"}>
                  {account.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAccountDisconnect(account.id)}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new platform connections */}
        <div className="mt-6 p-4 border-2 border-dashed rounded-lg">
          <div className="text-center">
            <h3 className="font-medium mb-2">Connect More Platforms</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Expand your social media presence by connecting additional platforms
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'] as SocialPlatform[])
                .filter(platform => !accounts.some(acc => acc.platform === platform))
                .map((platform) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAccountConnect(platform)}
                    className="capitalize"
                  >
                    <PlatformIcon platform={platform} className="h-4 w-4 mr-2" />
                    {platform}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentActivity = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mentions.slice(0, 5).map((mention) => (
            <div key={mention.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <PlatformIcon platform={mention.platform} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{mention.author.displayName}</p>
                  <Badge variant={mention.sentiment === 'positive' ? "default" : mention.sentiment === 'negative' ? "destructive" : "secondary"}>
                    {mention.sentiment}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {mention.content}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <span>{mention.reach.toLocaleString()} reach</span>
                  <span>{mention.engagement.toLocaleString()} engagement</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Respond
              </Button>
            </div>
          ))}
          {mentions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No recent mentions to show
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderActiveCampaigns = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Campaigns</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCampaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{campaign.name}</h3>
                <Badge variant={campaign.status === 'active' ? "default" : "secondary"}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {campaign.description}
              </p>
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-1">
                  {campaign.platforms.map((platform) => (
                    <PlatformIcon key={platform} platform={platform} className="h-4 w-4" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {campaign.platforms.length} platforms
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderTrendingTopics = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Trending Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTrendingTopics.map((topic) => (
            <div key={topic.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{topic.topic}</h3>
                <Badge variant="outline">{topic.hashtag}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Volume: </span>
                  <span className="font-medium">{topic.volume.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Growth: </span>
                  <span className="font-medium text-green-600">+{topic.growth}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sentiment: </span>
                  <Badge variant={topic.sentiment === 'positive' ? "default" : "secondary"}>
                    {topic.sentiment}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Opportunity: </span>
                  <span className="font-medium">{topic.opportunityScore}/100</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button className="h-20 flex flex-col items-center justify-center space-y-2">
            <Edit className="h-6 w-6" />
            <span>Create Post</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <Calendar className="h-6 w-6" />
            <span>Schedule</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <BarChart3 className="h-6 w-6" />
            <span>Analytics</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <MessageCircle className="h-6 w-6" />
            <span>Inbox</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Hub</h1>
          <p className="text-muted-foreground">
            Manage all your social media platforms from one place
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              {unreadCount} notifications
            </Button>
          )}
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {renderOverviewStats()}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {renderConnectedAccounts()}
              {renderRecentActivity()}
              {renderActiveCampaigns()}
            </div>
            <div className="space-y-6">
              {renderTrendingTopics()}
              {renderQuickActions()}
            </div>
          </div>
        </TabsContent>

        {/* Other tabs content */}
        <TabsContent value="publishing">
          <Card>
            <CardHeader>
              <CardTitle>Publishing Center</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Publishing features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Social inbox will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Campaign management will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SocialHub; 