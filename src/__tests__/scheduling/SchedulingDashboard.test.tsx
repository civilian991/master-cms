import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchedulingDashboard } from '@/components/scheduling/components/SchedulingDashboard';
import { schedulingApi } from '@/components/scheduling/services/schedulingApi';

// Mock the scheduling API service
jest.mock('@/components/scheduling/services/schedulingApi', () => ({
  schedulingApi: {
    getScheduledContent: jest.fn(),
    getCalendarEvents: jest.fn(),
    createSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
    checkConflicts: jest.fn(),
  },
}));

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  AlertTitle: ({ children }: any) => <h3>{children}</h3>,
}));

const mockScheduledContent = [
  {
    id: '1',
    contentId: 'content-1',
    title: 'Test Article',
    contentType: 'article' as const,
    status: 'scheduled' as const,
    priority: 'high' as const,
    platforms: ['website' as const],
    scheduledAt: new Date('2024-01-15T10:00:00Z'),
    createdBy: 'user-1',
    currentStage: 'scheduling' as const,
    tags: ['tech'],
    metadata: {},
    content: {
      title: 'Test Article',
      body: 'Article content',
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '2',
    contentId: 'content-2',
    title: 'Published Post',
    contentType: 'blog_post' as const,
    status: 'published' as const,
    priority: 'medium' as const,
    platforms: ['facebook' as const, 'twitter' as const],
    scheduledAt: new Date('2024-01-10T14:00:00Z'),
    publishedAt: new Date('2024-01-10T14:00:00Z'),
    createdBy: 'user-1',
    currentStage: 'completed' as const,
    tags: ['news'],
    metadata: {},
    content: {
      title: 'Published Post',
      body: 'Post content',
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-10T14:00:00Z'),
  },
];

const mockCalendarEvents = [
  {
    id: 'event-1',
    scheduledContentId: '1',
    title: 'Test Article',
    startTime: new Date('2024-01-15T10:00:00Z'),
    allDay: false,
    isEditable: true,
    metadata: {},
  },
];

const mockCalendarResponse = {
  success: true,
  events: mockCalendarEvents,
  conflicts: [],
  summary: {
    totalEvents: 1,
    eventsByStatus: { scheduled: 1, published: 0, draft: 0, pending_approval: 0, publishing: 0, failed: 0, cancelled: 0 },
    eventsByPlatform: { website: 1, facebook: 0, twitter: 0, instagram: 0, linkedin: 0, youtube: 0, tiktok: 0, pinterest: 0 },
    busyDays: [],
    freeDays: [],
  },
};

describe('SchedulingDashboard', () => {
  const defaultProps = {
    userId: 'user-1',
    view: 'month' as const,
    onViewChange: jest.fn(),
    filters: {},
    onFiltersChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (schedulingApi.getScheduledContent as jest.Mock).mockResolvedValue(mockScheduledContent);
    (schedulingApi.getCalendarEvents as jest.Mock).mockResolvedValue(mockCalendarResponse);
  });

  it('renders scheduling dashboard with overview cards', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Content Scheduling')).toBeInTheDocument();
    });

    // Check overview cards
    expect(screen.getByText('Total Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('displays scheduled content statistics correctly', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total scheduled
    });

    // Should show 50% success rate (1 published out of 2 total)
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows calendar interface with events', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    });

    expect(screen.getByText('1 events')).toBeInTheDocument();
  });

  it('displays upcoming content section', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Content')).toBeInTheDocument();
    });

    // Should show the scheduled article
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('shows platform distribution analytics', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Platform Distribution')).toBeInTheDocument();
    });
  });

  it('handles view changes correctly', async () => {
    const onViewChange = jest.fn();
    render(<SchedulingDashboard {...defaultProps} onViewChange={onViewChange} />);

    await waitFor(() => {
      expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    });

    // Click on week view button
    const weekButton = screen.getByText(/week/i);
    fireEvent.click(weekButton);

    expect(onViewChange).toHaveBeenCalledWith('week');
  });

  it('handles date navigation', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    });

    // Should have navigation buttons
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays conflicts when present', async () => {
    const conflictsResponse = {
      ...mockCalendarResponse,
      conflicts: [{
        type: 'time' as const,
        description: 'Schedule conflict detected',
        conflictingItems: ['1', '2'],
        severity: 'high' as const,
      }],
    };

    (schedulingApi.getCalendarEvents as jest.Mock).mockResolvedValue(conflictsResponse);

    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Scheduling Conflicts Detected')).toBeInTheDocument();
    });

    expect(screen.getByText(/1 conflict found/)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<SchedulingDashboard {...defaultProps} />);

    expect(screen.getByText('Loading scheduling dashboard...')).toBeInTheDocument();
  });

  it('displays error state when API calls fail', async () => {
    (schedulingApi.getScheduledContent as jest.Mock).mockRejectedValue(
      new Error('Failed to load data')
    );

    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('handles refresh action', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    });

    // Find and click refresh button
    const refreshButtons = screen.getAllByRole('button');
    const refreshButton = refreshButtons.find(button => 
      button.querySelector('svg') // Contains an icon
    );

    if (refreshButton) {
      fireEvent.click(refreshButton);
    }

    // API should be called again
    await waitFor(() => {
      expect(schedulingApi.getScheduledContent).toHaveBeenCalledTimes(2);
    });
  });

  it('displays quick actions section', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('New Schedule')).toBeInTheDocument();
    expect(screen.getByText('Workflow Settings')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('AI Optimization')).toBeInTheDocument();
  });

  it('shows different status badges with correct colors', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Content Scheduling')).toBeInTheDocument();
    });

    // Should display content with different statuses
    expect(screen.getByText('high')).toBeInTheDocument(); // Priority badge
    expect(screen.getByText('website')).toBeInTheDocument(); // Platform badge
  });

  it('handles empty state correctly', async () => {
    (schedulingApi.getScheduledContent as jest.Mock).mockResolvedValue([]);
    (schedulingApi.getCalendarEvents as jest.Mock).mockResolvedValue({
      ...mockCalendarResponse,
      events: [],
    });

    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Total scheduled should be 0
    });

    expect(screen.getByText('No upcoming content scheduled')).toBeInTheDocument();
  });

  it('updates when filters change', async () => {
    const { rerender } = render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(schedulingApi.getScheduledContent).toHaveBeenCalledTimes(1);
    });

    // Change filters
    const newFilters = { status: ['scheduled' as const] };
    rerender(<SchedulingDashboard {...defaultProps} filters={newFilters} />);

    await waitFor(() => {
      expect(schedulingApi.getScheduledContent).toHaveBeenCalledTimes(2);
    });

    expect(schedulingApi.getScheduledContent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: ['scheduled'],
      })
    );
  });

  it('calculates success rate correctly with different scenarios', async () => {
    // Test with no published content
    (schedulingApi.getScheduledContent as jest.Mock).mockResolvedValue([
      { ...mockScheduledContent[0], status: 'scheduled' },
    ]);

    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', async () => {
    render(<SchedulingDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });
}); 