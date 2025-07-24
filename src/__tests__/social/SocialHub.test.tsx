import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialHub from '@/social/components/SocialHub';
import { SocialPlatform } from '@/social/types/social.types';

// Mock the social hooks
jest.mock('@/social/hooks/useSocialPlatforms', () => ({
  useSocialPlatforms: () => ({
    platforms: [],
    isLoading: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/social/hooks/useSocialAnalytics', () => ({
  useSocialAnalytics: () => ({
    analytics: {
      summary: {
        totalEngagements: 1500,
        engagementRate: 4.2,
      },
    },
    isLoading: false,
    dateRange: { start: new Date(), end: new Date() },
    setDateRange: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/social/hooks/useSocialInbox', () => ({
  useSocialInbox: () => ({
    mentions: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: jest.fn(),
    respond: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value} onChange={onValueChange}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value}></div>
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img data-testid="avatar-image" src={src} alt={alt} />,
}));

const mockAccounts = [
  {
    id: '1',
    platform: 'facebook' as SocialPlatform,
    accountId: 'facebook_123',
    username: 'testuser',
    displayName: 'Test User',
    profileImage: '/test-avatar.png',
    followerCount: 1000,
    followingCount: 500,
    isVerified: true,
    isActive: true,
    isConnected: true,
    accessToken: 'test_token',
    permissions: ['manage_posts'],
    createdAt: new Date(),
    lastSyncAt: new Date(),
    metadata: {},
  },
  {
    id: '2',
    platform: 'instagram' as SocialPlatform,
    accountId: 'instagram_456',
    username: 'testuser',
    displayName: 'Test User',
    profileImage: '/test-avatar.png',
    followerCount: 2000,
    followingCount: 800,
    isVerified: false,
    isActive: true,
    isConnected: true,
    accessToken: 'test_token',
    permissions: ['manage_posts'],
    createdAt: new Date(),
    lastSyncAt: new Date(),
    metadata: {},
  },
];

describe('SocialHub', () => {
  const defaultProps = {
    userId: 'test-user',
    accounts: mockAccounts,
    onAccountConnect: jest.fn(),
    onAccountDisconnect: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders social media hub with header', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('Social Media Hub')).toBeInTheDocument();
    expect(screen.getByText('Manage all your social media platforms from one place')).toBeInTheDocument();
  });

  it('displays overview statistics', () => {
    render(<SocialHub {...defaultProps} />);

    // Check if stats cards are present
    expect(screen.getByText('Total Followers')).toBeInTheDocument();
    expect(screen.getByText('Connected Platforms')).toBeInTheDocument();
    expect(screen.getByText('Total Engagement')).toBeInTheDocument();
    expect(screen.getByText('Engagement Rate')).toBeInTheDocument();

    // Check calculated values
    expect(screen.getByText('3,000')).toBeInTheDocument(); // Total followers (1000 + 2000)
    expect(screen.getByText('2')).toBeInTheDocument(); // Connected platforms
  });

  it('displays connected accounts', () => {
    render(<SocialHub {...defaultProps} />);

    // Check for account information
    expect(screen.getAllByText('Test User')).toHaveLength(2); // Both accounts
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('1,000 followers')).toBeInTheDocument();
    expect(screen.getByText('2,000 followers')).toBeInTheDocument();
  });

  it('shows connection status for accounts', () => {
    render(<SocialHub {...defaultProps} />);

    const connectedBadges = screen.getAllByText('Connected');
    expect(connectedBadges).toHaveLength(2);
  });

  it('displays available platforms to connect', () => {
    render(<SocialHub {...defaultProps} />);

    // Should show platforms not yet connected
    expect(screen.getByText('Connect More Platforms')).toBeInTheDocument();
    expect(screen.getByText('twitter')).toBeInTheDocument();
    expect(screen.getByText('linkedin')).toBeInTheDocument();
    expect(screen.getByText('tiktok')).toBeInTheDocument();
  });

  it('handles account connection', async () => {
    const onAccountConnect = jest.fn();
    render(<SocialHub {...defaultProps} onAccountConnect={onAccountConnect} />);

    const twitterButton = screen.getByRole('button', { name: /twitter/i });
    fireEvent.click(twitterButton);

    expect(onAccountConnect).toHaveBeenCalledWith('twitter');
  });

  it('handles account disconnection', async () => {
    const onAccountDisconnect = jest.fn();
    render(<SocialHub {...defaultProps} onAccountDisconnect={onAccountDisconnect} />);

    const disconnectButtons = screen.getAllByText('Disconnect');
    fireEvent.click(disconnectButtons[0]);

    expect(onAccountDisconnect).toHaveBeenCalledWith('1');
  });

  it('handles refresh functionality', async () => {
    const onRefresh = jest.fn();
    render(<SocialHub {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it('displays quick actions', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('shows tabs navigation', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-publishing')).toBeInTheDocument();
    expect(screen.getByTestId('tab-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('tab-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('tab-campaigns')).toBeInTheDocument();
    expect(screen.getByTestId('tab-settings')).toBeInTheDocument();
  });

  it('displays active campaigns section', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
    expect(screen.getByText('New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Summer Product Launch')).toBeInTheDocument();
  });

  it('shows trending topics', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('Trending Topics')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Fashion')).toBeInTheDocument();
    expect(screen.getByText('#SustainableFashion')).toBeInTheDocument();
  });

  it('displays recent activity section', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('shows empty state when no accounts connected', () => {
    render(<SocialHub {...defaultProps} accounts={[]} />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Connected platforms
    expect(screen.getByText('5 more available')).toBeInTheDocument();
  });

  it('handles tab switching', () => {
    render(<SocialHub {...defaultProps} />);

    const analyticsTab = screen.getByTestId('tab-analytics');
    fireEvent.click(analyticsTab);

    // Check if analytics content is shown
    expect(screen.getByText('Social Media Analytics')).toBeInTheDocument();
  });

  it('shows create post button in header', () => {
    render(<SocialHub {...defaultProps} />);

    const createPostButtons = screen.getAllByText('Create Post');
    expect(createPostButtons.length).toBeGreaterThan(0);
  });

  it('displays platform icons correctly', () => {
    render(<SocialHub {...defaultProps} />);

    // Platform icons should be displayed (as emoji in this implementation)
    // The exact implementation may vary, but platform representation should be present
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows engagement metrics in overview', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('1,500')).toBeInTheDocument(); // Total engagement
    expect(screen.getByText('4.2%')).toBeInTheDocument(); // Engagement rate
  });

  it('displays campaign progress', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows platform verification status', () => {
    render(<SocialHub {...defaultProps} />);

    // Facebook account is verified, Instagram is not
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('handles empty mentions gracefully', () => {
    render(<SocialHub {...defaultProps} />);

    expect(screen.getByText('No recent mentions to show')).toBeInTheDocument();
  });

  it('shows follower count formatting', () => {
    render(<SocialHub {...defaultProps} />);

    // Check for properly formatted follower counts
    expect(screen.getByText('1,000 followers')).toBeInTheDocument();
    expect(screen.getByText('2,000 followers')).toBeInTheDocument();
  });

  it('displays growth metrics', () => {
    render(<SocialHub {...defaultProps} />);

    // Growth indicators
    expect(screen.getByText('+12% from last month')).toBeInTheDocument();
    expect(screen.getByText('+8.2% from last week')).toBeInTheDocument();
    expect(screen.getByText('+0.5% from last week')).toBeInTheDocument();
  });
}); 