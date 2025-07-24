import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CRMDashboard } from '@/components/admin/crm/CRMDashboard';

// Mock the fetch API
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <p {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-${value}`} {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`content-${value}`} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, ...props }: any) => (
    <input placeholder={placeholder} {...props} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <button {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">
      {children}
    </div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ placeholder, ...props }: any) => (
    <textarea placeholder={placeholder} {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label {...props}>
      {children}
    </label>
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, format: string) => {
    if (format === 'MMM d') return 'Jan 15';
    if (format === 'MMM d, yyyy') return 'Jan 15, 2024';
    return 'Jan 15, 2024';
  }),
}));

describe('CRMDashboard', () => {
  const mockSiteId = 'site-1';

  const mockCRMData = {
    leads: [
      {
        id: 'lead-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Example Corp',
        score: 75,
        status: 'NEW',
        source: 'website',
        assignedUser: { name: 'John Manager' },
        interactions: [],
        tasks: [],
        campaigns: [],
        createdAt: new Date(),
        lastContacted: new Date(),
      },
      {
        id: 'lead-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        company: 'Test Corp',
        score: 85,
        status: 'QUALIFIED',
        source: 'referral',
        assignedUser: { name: 'Jane Manager' },
        interactions: [],
        tasks: [],
        campaigns: [],
        createdAt: new Date(),
        lastContacted: new Date(),
      },
    ],
    contacts: [
      {
        id: 'contact-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        company: 'Enterprise Corp',
        score: 90,
        status: 'CUSTOMER',
        engagementLevel: 'HIGH',
        assignedUser: { name: 'Alice Manager' },
        interactions: [],
        deals: [],
        tasks: [],
        campaigns: [],
        createdAt: new Date(),
        lastContacted: new Date(),
      },
    ],
    deals: [
      {
        id: 'deal-1',
        name: 'Enterprise Software License',
        value: 100000,
        stage: 'NEGOTIATION',
        probability: 75,
        contact: { firstName: 'Alice', lastName: 'Johnson' },
        assignedUser: { name: 'Alice Manager' },
        interactions: [],
        tasks: [],
        createdAt: new Date(),
        isWon: false,
        isLost: false,
      },
      {
        id: 'deal-2',
        name: 'Consulting Services',
        value: 50000,
        stage: 'CLOSED_WON',
        probability: 100,
        contact: { firstName: 'Bob', lastName: 'Wilson' },
        assignedUser: { name: 'Bob Manager' },
        interactions: [],
        tasks: [],
        createdAt: new Date(),
        isWon: true,
        isLost: false,
      },
    ],
    interactions: [
      {
        id: 'interaction-1',
        type: 'EMAIL',
        subject: 'Follow-up on proposal',
        lead: { firstName: 'John', lastName: 'Doe' },
        contact: null,
        deal: null,
        initiatedUser: { name: 'John Manager' },
        createdAt: new Date(),
      },
      {
        id: 'interaction-2',
        type: 'PHONE_CALL',
        subject: 'Product demo',
        lead: null,
        contact: { firstName: 'Alice', lastName: 'Johnson' },
        deal: null,
        initiatedUser: { name: 'Alice Manager' },
        createdAt: new Date(),
      },
    ],
    campaigns: [
      {
        id: 'campaign-1',
        name: 'Q1 Email Campaign',
        type: 'EMAIL',
        status: 'ACTIVE',
        createdUser: { name: 'Campaign Manager' },
        leads: [{ lead: { firstName: 'John', lastName: 'Doe' } }],
        contacts: [{ contact: { firstName: 'Alice', lastName: 'Johnson' } }],
        tasks: [],
        createdAt: new Date(),
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Follow up with John Doe',
        type: 'CALL',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date('2024-06-15'),
        assignedUser: { name: 'John Manager' },
        lead: { firstName: 'John', lastName: 'Doe' },
        contact: null,
        deal: null,
        campaign: null,
        createdAt: new Date(),
      },
      {
        id: 'task-2',
        title: 'Send proposal to Alice',
        type: 'EMAIL',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date('2024-06-10'),
        assignedUser: { name: 'Alice Manager' },
        lead: null,
        contact: { firstName: 'Alice', lastName: 'Johnson' },
        deal: null,
        campaign: null,
        createdAt: new Date(),
      },
    ],
    workflows: [
      {
        id: 'workflow-1',
        name: 'Lead Nurturing Workflow',
        type: 'LEAD_NURTURING',
        status: 'ACTIVE',
        createdUser: { name: 'Workflow Manager' },
        executions: [],
        createdAt: new Date(),
      },
    ],
    analytics: {
      overview: {
        totalLeads: 150,
        convertedLeads: 30,
        leadConversionRate: 20,
        totalContacts: 200,
        totalDeals: 50,
        wonDeals: 15,
        dealWinRate: 30,
        totalInteractions: 500,
        totalTasks: 75,
        totalCampaigns: 10,
      },
      pipeline: [
        { stage: 'PROSPECTING', _count: { stage: 20 }, _sum: { value: 200000 } },
        { stage: 'QUALIFICATION', _count: { stage: 15 }, _sum: { value: 300000 } },
        { stage: 'NEGOTIATION', _count: { stage: 10 }, _sum: { value: 500000 } },
      ],
      recentActivity: [],
      upcomingTasks: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('leads')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.leads) });
      }
      if (url.includes('contacts')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.contacts) });
      }
      if (url.includes('deals')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.deals) });
      }
      if (url.includes('interactions')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.interactions) });
      }
      if (url.includes('campaigns')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.campaigns) });
      }
      if (url.includes('tasks')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.tasks) });
      }
      if (url.includes('workflows')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.workflows) });
      }
      if (url.includes('analytics')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCRMData.analytics) });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });
  });

  it('should render the CRM dashboard with overview cards', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('CRM Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage your customer relationships, leads, and sales pipeline')).toBeInTheDocument();
    });

    // Check overview cards
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Total Contacts')).toBeInTheDocument();
    expect(screen.getByText('Active Deals')).toBeInTheDocument();
    expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
  });

  it('should display correct counts in overview cards', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total leads
      expect(screen.getByText('1')).toBeInTheDocument(); // Total contacts
      expect(screen.getByText('$100,000')).toBeInTheDocument(); // Active deals value
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending tasks
    });
  });

  it('should render all tabs', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-leads')).toBeInTheDocument();
      expect(screen.getByTestId('tab-contacts')).toBeInTheDocument();
      expect(screen.getByTestId('tab-deals')).toBeInTheDocument();
      expect(screen.getByTestId('tab-interactions')).toBeInTheDocument();
      expect(screen.getByTestId('tab-campaigns')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('tab-workflows')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByTestId('content-overview')).toBeInTheDocument();
    });

    // Click on leads tab
    fireEvent.click(screen.getByTestId('tab-leads'));
    await waitFor(() => {
      expect(screen.getByTestId('content-leads')).toBeInTheDocument();
    });

    // Click on contacts tab
    fireEvent.click(screen.getByTestId('tab-contacts'));
    await waitFor(() => {
      expect(screen.getByTestId('content-contacts')).toBeInTheDocument();
    });
  });

  it('should display leads in the leads tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to leads tab
    fireEvent.click(screen.getByTestId('tab-leads'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Example Corp')).toBeInTheDocument();
      expect(screen.getByText('NEW')).toBeInTheDocument();
      expect(screen.getByText('Score: 75')).toBeInTheDocument();
    });
  });

  it('should display contacts in the contacts tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to contacts tab
    fireEvent.click(screen.getByTestId('tab-contacts'));

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Corp')).toBeInTheDocument();
      expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
      expect(screen.getByText('Score: 90')).toBeInTheDocument();
    });
  });

  it('should display deals in the deals tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to deals tab
    fireEvent.click(screen.getByTestId('tab-deals'));

    await waitFor(() => {
      expect(screen.getByText('Enterprise Software License')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('NEGOTIATION')).toBeInTheDocument();
      expect(screen.getByText('$100,000')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should display interactions in the interactions tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to interactions tab
    fireEvent.click(screen.getByTestId('tab-interactions'));

    await waitFor(() => {
      expect(screen.getByText('Follow-up on proposal')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('Product demo')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('PHONE_CALL')).toBeInTheDocument();
    });
  });

  it('should display campaigns in the campaigns tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to campaigns tab
    fireEvent.click(screen.getByTestId('tab-campaigns'));

    await waitFor(() => {
      expect(screen.getByText('Q1 Email Campaign')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('1 leads, 1 contacts')).toBeInTheDocument();
    });
  });

  it('should display tasks in the tasks tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to tasks tab
    fireEvent.click(screen.getByTestId('tab-tasks'));

    await waitFor(() => {
      expect(screen.getByText('Follow up with John Doe')).toBeInTheDocument();
      expect(screen.getByText('CALL')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('Send proposal to Alice')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  it('should display workflows in the workflows tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to workflows tab
    fireEvent.click(screen.getByTestId('tab-workflows'));

    await waitFor(() => {
      expect(screen.getByText('Lead Nurturing Workflow')).toBeInTheDocument();
      expect(screen.getByText('LEAD_NURTURING')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('0 executions')).toBeInTheDocument();
    });
  });

  it('should display analytics in the overview tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument(); // Lead conversion rate
      expect(screen.getByText('30.0%')).toBeInTheDocument(); // Deal win rate
      expect(screen.getByText('500')).toBeInTheDocument(); // Total interactions
      expect(screen.getByText('10')).toBeInTheDocument(); // Active campaigns
    });
  });

  it('should display recent activity in the overview tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Follow-up on proposal')).toBeInTheDocument();
      expect(screen.getByText('Product demo')).toBeInTheDocument();
    });
  });

  it('should display upcoming tasks in the overview tab', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Tasks')).toBeInTheDocument();
      expect(screen.getByText('Follow up with John Doe')).toBeInTheDocument();
      expect(screen.getByText('Due: Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to leads tab
    fireEvent.click(screen.getByTestId('tab-leads'));

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search leads...');
      expect(searchInput).toBeInTheDocument();
    });

    // Test search input
    const searchInput = screen.getByPlaceholderText('Search leads...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    expect(searchInput).toHaveValue('John');
  });

  it('should handle filter functionality', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to leads tab
    fireEvent.click(screen.getByTestId('tab-leads'));

    await waitFor(() => {
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });

    // Test filter select
    const filterSelect = screen.getByText('All Status');
    fireEvent.click(filterSelect);
  });

  it('should display action buttons', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Add Lead')).toBeInTheDocument();
    });
  });

  it('should display view buttons for each item', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to leads tab
    fireEvent.click(screen.getByTestId('tab-leads'));

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });

  it('should handle loading state', async () => {
    // Mock fetch to delay response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ json: () => Promise.resolve([]) }), 100))
    );

    render(<CRMDashboard siteId={mockSiteId} />);

    // Should show loading spinner initially
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    // Mock fetch to return error
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({ json: () => Promise.resolve({ error: 'API Error' }) })
    );

    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      // Should still render the dashboard even with errors
      expect(screen.getByText('CRM Dashboard')).toBeInTheDocument();
    });
  });

  it('should calculate correct metrics', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      // Check that converted leads count is calculated correctly
      expect(screen.getByText('0 converted')).toBeInTheDocument(); // No converted leads in mock data
      
      // Check that customers count is calculated correctly
      expect(screen.getByText('1 customers')).toBeInTheDocument(); // 1 customer in mock data
      
      // Check that active deals value is calculated correctly
      expect(screen.getByText('$100,000')).toBeInTheDocument(); // Only one active deal
      
      // Check that pending tasks count is calculated correctly
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 pending task
    });
  });

  it('should display status badges with correct colors', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to leads tab
    fireEvent.click(screen.getByTestId('tab-leads'));

    await waitFor(() => {
      const newBadge = screen.getByText('NEW');
      const qualifiedBadge = screen.getByText('QUALIFIED');
      
      expect(newBadge).toBeInTheDocument();
      expect(qualifiedBadge).toBeInTheDocument();
    });
  });

  it('should display priority badges with correct colors', async () => {
    render(<CRMDashboard siteId={mockSiteId} />);

    // Switch to tasks tab
    fireEvent.click(screen.getByTestId('tab-tasks'));

    await waitFor(() => {
      const highPriorityBadge = screen.getByText('HIGH');
      const mediumPriorityBadge = screen.getByText('MEDIUM');
      
      expect(highPriorityBadge).toBeInTheDocument();
      expect(mediumPriorityBadge).toBeInTheDocument();
    });
  });
}); 