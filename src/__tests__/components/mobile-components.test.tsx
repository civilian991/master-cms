import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mobile Components
import {
  MobileCard,
  MobileCardHeader,
  MobileCardContent,
  MobileCardFooter,
  MobileArticleCard,
} from '@/components/mobile/MobileCard';

import {
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobileCheckbox,
  MobileRadioGroup,
  MobileForm,
} from '@/components/mobile/MobileForms';

import {
  MobileList,
  MobileListItem,
  MobileTable,
  MobileAccordion,
} from '@/components/mobile/MobileDataDisplay';

import {
  MobileModal,
  MobileBottomSheet,
  MobileActionSheet,
  MobileDrawer,
} from '@/components/mobile/MobileModals';

import {
  MobileArticleReader,
  MobileMediaGallery,
  MobileContentCard,
} from '@/components/mobile/MobileContentDisplay';

import {
  MobileDashboard,
  MobileWidget,
  MobileStatWidget,
  MobileQuickActions,
  MobileListWidget,
  MobileGrid,
} from '@/components/mobile/MobileDashboard';

// Mock intersection observer for lazy loading
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock createPortal for modal components
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('Mobile Card Components', () => {
  describe('MobileCard', () => {
    test('renders with default props', () => {
      render(
        <MobileCard>
          <div>Card content</div>
        </MobileCard>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('applies touch feedback classes', () => {
      const { container } = render(
        <MobileCard touchFeedback>
          <div>Content</div>
        </MobileCard>
      );
      expect(container.firstChild).toHaveClass('touch-manipulation');
    });

    test('shows loading state', () => {
      render(<MobileCard loading />);
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });

    test('handles different variants', () => {
      const { rerender, container } = render(
        <MobileCard variant="elevated">Content</MobileCard>
      );
      expect(container.firstChild).toHaveClass('shadow-md');

      rerender(<MobileCard variant="interactive">Content</MobileCard>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    test('handles different sizes', () => {
      const { rerender, container } = render(
        <MobileCard size="compact">Content</MobileCard>
      );
      expect(container.firstChild).toHaveClass('min-h-[60px]');

      rerender(<MobileCard size="comfortable">Content</MobileCard>);
      expect(container.firstChild).toHaveClass('min-h-[88px]');
    });
  });

  describe('MobileArticleCard', () => {
    const mockArticle = {
      title: 'Test Article',
      excerpt: 'This is a test article excerpt',
      author: 'John Doe',
      publishedAt: '2024-01-01',
      category: 'Tech',
      readTime: 5,
    };

    test('renders article information', () => {
      render(<MobileArticleCard {...mockArticle} />);
      
      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('This is a test article excerpt')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('5 min read')).toBeInTheDocument();
    });

    test('handles bookmark functionality', async () => {
      const user = userEvent.setup();
      const onBookmark = jest.fn();
      
      render(
        <MobileArticleCard
          {...mockArticle}
          onBookmark={onBookmark}
          bookmarked={false}
        />
      );

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      await user.click(bookmarkButton);
      
      expect(onBookmark).toHaveBeenCalled();
    });

    test('shows bookmarked state', () => {
      render(
        <MobileArticleCard
          {...mockArticle}
          onBookmark={jest.fn()}
          bookmarked={true}
        />
      );

      const bookmarkButton = screen.getByLabelText('Remove bookmark');
      expect(bookmarkButton.querySelector('svg')).toHaveClass('fill-primary');
    });
  });
});

describe('Mobile Form Components', () => {
  describe('MobileInput', () => {
    test('renders with label and hint', () => {
      render(
        <MobileInput
          label="Email"
          hint="Enter your email address"
          placeholder="email@example.com"
        />
      );
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    });

    test('shows error state', () => {
      render(
        <MobileInput
          label="Email"
          error="Email is required"
          value=""
        />
      );
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toHaveClass('border-destructive');
    });

    test('shows success state', () => {
      render(
        <MobileInput
          label="Email"
          success="Email is valid"
          value="test@example.com"
        />
      );
      
      expect(screen.getByText('Email is valid')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toHaveClass('border-green-500');
    });

    test('handles password toggle', async () => {
      const user = userEvent.setup();
      
      render(
        <MobileInput
          type="password"
          label="Password"
          value="secret123"
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByLabelText('Show password');
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'text');
    });

    test('handles clear functionality', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();
      
      render(
        <MobileInput
          label="Search"
          value="search term"
          clearable
          onClear={onClear}
        />
      );

      const clearButton = screen.getByLabelText('Clear input');
      await user.click(clearButton);
      
      expect(onClear).toHaveBeenCalled();
    });

    test('shows loading state', () => {
      render(
        <MobileInput
          label="Email"
          loading
        />
      );
      
      expect(screen.getByRole('textbox')).toBeDisabled();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('MobileCheckbox', () => {
    test('renders with label and description', () => {
      render(
        <MobileCheckbox
          label="Subscribe to newsletter"
          description="Get weekly updates about new articles"
        />
      );
      
      expect(screen.getByText('Subscribe to newsletter')).toBeInTheDocument();
      expect(screen.getByText('Get weekly updates about new articles')).toBeInTheDocument();
    });

    test('handles large size variant', () => {
      const { container } = render(
        <MobileCheckbox
          label="Large checkbox"
          size="large"
        />
      );
      
      expect(container.querySelector('input')).toHaveClass('h-6 w-6');
    });
  });

  describe('MobileRadioGroup', () => {
    const options = [
      { value: 'option1', label: 'Option 1', description: 'First option' },
      { value: 'option2', label: 'Option 2', description: 'Second option' },
    ];

    test('renders all options', () => {
      render(
        <MobileRadioGroup
          name="test"
          options={options}
          label="Choose option"
        />
      );
      
      expect(screen.getByText('Choose option')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('First option')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Second option')).toBeInTheDocument();
    });

    test('handles selection', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <MobileRadioGroup
          name="test"
          options={options}
          onChange={onChange}
        />
      );

      await user.click(screen.getByDisplayValue('option1'));
      expect(onChange).toHaveBeenCalledWith('option1');
    });
  });
});

describe('Mobile Data Display Components', () => {
  describe('MobileList', () => {
    test('shows loading state', () => {
      render(<MobileList loading />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    test('shows empty state', () => {
      render(<MobileList empty emptyMessage="No items found" />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  describe('MobileListItem', () => {
    test('renders with avatar, title, and subtitle', () => {
      render(
        <MobileListItem
          avatar={<div data-testid="avatar">Avatar</div>}
          title="John Doe"
          subtitle="Software Engineer"
          meta="2 hours ago"
        />
      );
      
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    test('handles click events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(
        <MobileListItem
          title="Clickable Item"
          onClick={onClick}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalled();
    });

    test('shows selected state', () => {
      const { container } = render(
        <MobileListItem
          title="Selected Item"
          selected
        />
      );
      
      expect(container.firstChild).toHaveClass('bg-primary/10');
    });
  });

  describe('MobileTable', () => {
    const columns = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ];

    const data = [
      { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    ];

    test('renders table data in card variant', () => {
      render(
        <MobileTable
          data={data}
          columns={columns}
          variant="card"
        />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    test('handles search functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <MobileTable
          data={data}
          columns={columns}
          variant="card"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'john');
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    test('handles pagination', async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'User',
      }));

      render(
        <MobileTable
          data={largeData}
          columns={columns}
          variant="card"
          pageSize={5}
        />
      );
      
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      
      const nextButton = screen.getByLabelText(/next/i);
      await user.click(nextButton);
      
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  describe('MobileAccordion', () => {
    const items = [
      {
        title: 'Section 1',
        children: <div>Content 1</div>,
        defaultOpen: true,
      },
      {
        title: 'Section 2',
        children: <div>Content 2</div>,
      },
    ];

    test('renders accordion items', () => {
      render(<MobileAccordion items={items} />);
      
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    test('handles expand/collapse', async () => {
      const user = userEvent.setup();
      
      render(<MobileAccordion items={items} />);
      
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      
      await user.click(screen.getByText('Section 2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    test('allows multiple open when allowMultiple is true', async () => {
      const user = userEvent.setup();
      
      render(<MobileAccordion items={items} allowMultiple />);
      
      await user.click(screen.getByText('Section 2'));
      
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });
});

describe('Mobile Modal Components', () => {
  describe('MobileModal', () => {
    test('renders when open', () => {
      render(
        <MobileModal open={true} onClose={jest.fn()} title="Test Modal">
          <div>Modal content</div>
        </MobileModal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(
        <MobileModal open={false} onClose={jest.fn()} title="Test Modal">
          <div>Modal content</div>
        </MobileModal>
      );
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    test('handles close button click', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(
        <MobileModal open={true} onClose={onClose} title="Test Modal">
          <div>Modal content</div>
        </MobileModal>
      );

      await user.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalled();
    });

    test('handles escape key', () => {
      const onClose = jest.fn();
      
      render(
        <MobileModal open={true} onClose={onClose} title="Test Modal">
          <div>Modal content</div>
        </MobileModal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('MobileActionSheet', () => {
    const actions = [
      { label: 'Edit', onClick: jest.fn() },
      { label: 'Delete', onClick: jest.fn(), destructive: true },
    ];

    test('renders actions', () => {
      render(
        <MobileActionSheet
          open={true}
          onClose={jest.fn()}
          title="Choose Action"
          actions={actions}
        />
      );
      
      expect(screen.getByText('Choose Action')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    test('handles action click', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(
        <MobileActionSheet
          open={true}
          onClose={onClose}
          actions={actions}
        />
      );

      await user.click(screen.getByText('Edit'));
      expect(actions[0].onClick).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('Mobile Dashboard Components', () => {
  describe('MobileWidget', () => {
    test('renders with title and content', () => {
      render(
        <MobileWidget title="Test Widget" subtitle="Widget subtitle">
          <div>Widget content</div>
        </MobileWidget>
      );
      
      expect(screen.getByText('Test Widget')).toBeInTheDocument();
      expect(screen.getByText('Widget subtitle')).toBeInTheDocument();
      expect(screen.getByText('Widget content')).toBeInTheDocument();
    });

    test('shows loading state', () => {
      render(<MobileWidget loading />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    test('shows error state', () => {
      render(<MobileWidget error="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('MobileStatWidget', () => {
    test('renders stat with trend', () => {
      render(
        <MobileStatWidget
          value="1,234"
          label="Total Users"
          trend={{ value: 12, direction: 'up', label: 'vs last week' }}
          icon={<div data-testid="icon">📊</div>}
        />
      );
      
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('12%')).toBeInTheDocument();
      expect(screen.getByText('vs last week')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    test('handles different trend directions', () => {
      const { rerender } = render(
        <MobileStatWidget
          value="100"
          label="Test"
          trend={{ value: 5, direction: 'up' }}
        />
      );
      
      expect(screen.getByText('5%')).toHaveClass('text-green-600');
      
      rerender(
        <MobileStatWidget
          value="100"
          label="Test"
          trend={{ value: 3, direction: 'down' }}
        />
      );
      
      expect(screen.getByText('3%')).toHaveClass('text-red-600');
    });
  });

  describe('MobileQuickActions', () => {
    const actions = [
      {
        label: 'Create',
        icon: <div data-testid="create-icon">+</div>,
        onClick: jest.fn(),
        color: 'primary' as const,
      },
      {
        label: 'Settings',
        icon: <div data-testid="settings-icon">⚙️</div>,
        onClick: jest.fn(),
      },
    ];

    test('renders action buttons', () => {
      render(<MobileQuickActions actions={actions} />);
      
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByTestId('create-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    test('handles action clicks', async () => {
      const user = userEvent.setup();
      
      render(<MobileQuickActions actions={actions} />);
      
      await user.click(screen.getByText('Create'));
      expect(actions[0].onClick).toHaveBeenCalled();
    });

    test('shows badge on action', () => {
      const actionsWithBadge = [
        {
          label: 'Notifications',
          icon: <div>🔔</div>,
          onClick: jest.fn(),
          badge: 5,
        },
      ];
      
      render(<MobileQuickActions actions={actionsWithBadge} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('MobileListWidget', () => {
    const items = [
      {
        id: '1',
        title: 'Item 1',
        subtitle: 'Subtitle 1',
        meta: '2h ago',
        onClick: jest.fn(),
      },
      {
        id: '2',
        title: 'Item 2',
        subtitle: 'Subtitle 2',
        meta: '1h ago',
        onClick: jest.fn(),
      },
    ];

    test('renders list items', () => {
      render(<MobileListWidget items={items} />);
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Subtitle 1')).toBeInTheDocument();
      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });

    test('shows empty state', () => {
      render(
        <MobileListWidget
          items={[]}
          emptyMessage="No data available"
        />
      );
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    test('handles show all functionality', async () => {
      const user = userEvent.setup();
      const onShowAll = jest.fn();
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Item ${i + 1}`,
      }));
      
      render(
        <MobileListWidget
          items={manyItems}
          maxItems={3}
          onShowAll={onShowAll}
        />
      );
      
      expect(screen.getByText('Show all 10 items')).toBeInTheDocument();
      
      await user.click(screen.getByText('Show all 10 items'));
      expect(onShowAll).toHaveBeenCalled();
    });
  });

  describe('MobileGrid', () => {
    test('applies correct grid classes', () => {
      const { container } = render(
        <MobileGrid columns={2} gap="large">
          <div>Item 1</div>
          <div>Item 2</div>
        </MobileGrid>
      );
      
      expect(container.firstChild).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'gap-6');
    });
  });
});

// Integration tests
describe('Mobile Components Integration', () => {
  test('complete mobile dashboard renders correctly', () => {
    render(
      <MobileDashboard>
        <MobileGrid columns={2}>
          <MobileStatWidget
            value="1,234"
            label="Users"
            trend={{ value: 12, direction: 'up' }}
          />
          <MobileWidget title="Quick Actions">
            <MobileQuickActions
              actions={[
                {
                  label: 'Create',
                  icon: <div>+</div>,
                  onClick: jest.fn(),
                },
              ]}
            />
          </MobileWidget>
        </MobileGrid>
      </MobileDashboard>
    );
    
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('mobile form with validation works correctly', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e) => e.preventDefault());
    
    render(
      <MobileForm onSubmit={onSubmit}>
        <MobileInput
          label="Email"
          type="email"
          required
          data-testid="email-input"
        />
        <MobileTextarea
          label="Message"
          required
          data-testid="message-input"
        />
        <MobileCheckbox
          label="I agree to terms"
          data-testid="terms-checkbox"
        />
        <button type="submit">Submit</button>
      </MobileForm>
    );
    
    expect(screen.getByTestId('email-input')).toBeRequired();
    expect(screen.getByTestId('message-input')).toBeRequired();
    
    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalled();
  });
});

// Accessibility tests
describe('Mobile Components Accessibility', () => {
  test('mobile components have proper ARIA labels', () => {
    render(
      <div>
        <MobileInput label="Email" aria-describedby="email-hint" />
        <MobileModal open={true} onClose={jest.fn()} title="Test Modal">
          Content
        </MobileModal>
        <MobileListItem
          title="Clickable item"
          onClick={jest.fn()}
        />
      </div>
    );
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('mobile components support keyboard navigation', () => {
    render(
      <MobileListItem
        title="Keyboard accessible"
        onClick={jest.fn()}
      />
    );
    
    const item = screen.getByRole('button');
    expect(item).toHaveAttribute('tabIndex', '0');
  });

  test('mobile components have minimum touch targets', () => {
    const { container } = render(
      <div>
        <MobileInput label="Test" />
        <MobileCard size="compact">
          <button>Touch target</button>
        </MobileCard>
      </div>
    );
    
    // Check for minimum 44px touch targets
    const input = screen.getByLabelText('Test');
    expect(input).toHaveClass('min-h-[48px]');
    
    const card = container.querySelector('[class*="min-h-[60px]"]');
    expect(card).toBeInTheDocument();
  });
});

describe('Mobile Components Performance', () => {
  test('lazy loading works correctly', () => {
    const { container } = render(
      <MobileMediaGallery
        items={[
          {
            id: '1',
            type: 'image',
            src: '/image1.jpg',
            alt: 'Image 1',
          },
          {
            id: '2',
            type: 'image',
            src: '/image2.jpg',
            alt: 'Image 2',
          },
        ]}
      />
    );
    
    const images = container.querySelectorAll('img');
    expect(images[0]).toHaveAttribute('loading', 'eager'); // Current image
    expect(images[1]).toHaveAttribute('loading', 'lazy'); // Other images
  });

  test('components handle large datasets efficiently', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: 'User',
    }));

    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ];

    render(
      <MobileTable
        data={largeData}
        columns={columns}
        pageSize={10}
        variant="card"
      />
    );
    
    // Should only render first page items
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.queryByText('User 50')).not.toBeInTheDocument();
  });
}); 