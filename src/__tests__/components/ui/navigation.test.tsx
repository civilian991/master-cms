import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { 
  PrimaryNavigation, 
  AdminNavigation, 
  BreadcrumbNavigation, 
  FooterNavigation,
  NavigationItem,
  BreadcrumbItem
} from '@/components/ui/navigation';
import { House, Article, User, Gear } from '@/components/ui/icon';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Navigation Components', () => {
  describe('PrimaryNavigation', () => {
    const mockNavigationItems: NavigationItem[] = [
      { label: 'Home', href: '/', icon: House },
      { label: 'Articles', href: '/articles', icon: Article },
      { label: 'About', href: '/about' }
    ];

    const mockUserMenu = {
      isAuthenticated: true,
      userName: 'John Doe',
      menuItems: [
        { label: 'Profile', href: '/profile', icon: User },
        { label: 'Settings', href: '/settings', icon: Gear }
      ]
    };

    it('renders primary navigation with items', () => {
      render(
        <PrimaryNavigation 
          items={mockNavigationItems}
          siteName="Test Site"
        />
      );

      expect(screen.getByText('Test Site')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('shows active state for current path', () => {
      render(
        <PrimaryNavigation 
          items={mockNavigationItems}
          currentPath="/articles"
          siteName="Test Site"
        />
      );

      const articlesLink = screen.getByText('Articles').closest('a');
      expect(articlesLink).toHaveClass('bg-accent');
    });

    it('toggles mobile menu on button click', async () => {
      render(
        <PrimaryNavigation 
          items={mockNavigationItems}
          siteName="Test Site"
        />
      );

      const mobileButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileButton).toBeInTheDocument();

      // Mobile menu should not be visible initially
      expect(screen.queryByText('Home')).toBeInTheDocument(); // Desktop nav
      
      // Click to open mobile menu
      fireEvent.click(mobileButton);
      
      // Should show mobile nav container
      expect(document.querySelector('.mobile-nav-container')).toBeInTheDocument();
    });

    it('renders search functionality when provided', async () => {
      const mockOnSearch = jest.fn();
      render(
        <PrimaryNavigation 
          items={mockNavigationItems}
          siteName="Test Site"
          onSearch={mockOnSearch}
        />
      );

      const searchButton = screen.getByLabelText('Open search');
      fireEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();

      await userEvent.type(searchInput, 'test query');
      fireEvent.submit(searchInput.closest('form')!);

      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });

    it('renders user menu when authenticated', () => {
      render(
        <PrimaryNavigation 
          items={mockNavigationItems}
          siteName="Test Site"
          userMenu={mockUserMenu}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders sign in button when not authenticated', () => {
      const unauthenticatedUserMenu = {
        isAuthenticated: false,
        menuItems: []
      };

      render(
        <PrimaryNavigation 
          items={mockNavigationItems}
          siteName="Test Site"
          userMenu={unauthenticatedUserMenu}
        />
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('supports external links with proper attributes', () => {
      const externalItem: NavigationItem = {
        label: 'External',
        href: 'https://example.com',
        isExternal: true
      };

      render(
        <PrimaryNavigation 
          items={[externalItem]}
          siteName="Test Site"
        />
      );

      const externalLink = screen.getByText('External').closest('a');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('AdminNavigation', () => {
    const mockAdminItems: NavigationItem[] = [
      { 
        label: 'Dashboard', 
        href: '/admin/dashboard', 
        icon: House 
      },
      { 
        label: 'Content', 
        href: '/admin/content', 
        icon: Article,
        children: [
          { label: 'Articles', href: '/admin/content/articles' },
          { label: 'Pages', href: '/admin/content/pages' }
        ]
      },
      { 
        label: 'Settings', 
        href: '/admin/settings', 
        icon: Gear 
      }
    ];

    it('renders admin navigation with items', () => {
      render(
        <AdminNavigation 
          items={mockAdminItems}
          currentPath="/admin/dashboard"
        />
      );

      expect(screen.getByText('Admin Menu')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('expands and collapses menu items with children', async () => {
      render(
        <AdminNavigation 
          items={mockAdminItems}
          currentPath="/admin/dashboard"
        />
      );

      const contentButton = screen.getByText('Content');
      
      // Children should not be visible initially
      expect(screen.queryByText('Articles')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(contentButton);
      
      // Children should now be visible
      await waitFor(() => {
        expect(screen.getByText('Articles')).toBeInTheDocument();
        expect(screen.getByText('Pages')).toBeInTheDocument();
      });
    });

    it('handles collapse/expand functionality', () => {
      const mockToggle = jest.fn();
      render(
        <AdminNavigation 
          items={mockAdminItems}
          isCollapsed={false}
          onToggleCollapse={mockToggle}
        />
      );

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);
      
      expect(mockToggle).toHaveBeenCalled();
    });

    it('shows collapsed state correctly', () => {
      render(
        <AdminNavigation 
          items={mockAdminItems}
          isCollapsed={true}
        />
      );

      // Admin Menu title should not be visible when collapsed
      expect(screen.queryByText('Admin Menu')).not.toBeInTheDocument();
    });

    it('shows active state for current path', () => {
      render(
        <AdminNavigation 
          items={mockAdminItems}
          currentPath="/admin/settings"
        />
      );

      const settingsItem = screen.getByText('Settings').closest('div');
      expect(settingsItem).toHaveClass('bg-accent');
    });
  });

  describe('BreadcrumbNavigation', () => {
    const mockBreadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Articles', href: '/articles' },
      { label: 'Technology', href: '/articles/technology' },
      { label: 'Current Article', isActive: true }
    ];

    it('renders breadcrumb navigation', () => {
      render(<BreadcrumbNavigation items={mockBreadcrumbs} />);

      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Current Article')).toBeInTheDocument();
    });

    it('makes non-active items clickable', () => {
      render(<BreadcrumbNavigation items={mockBreadcrumbs} />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');

      const articlesLink = screen.getByText('Articles').closest('a');
      expect(articlesLink).toHaveAttribute('href', '/articles');
    });

    it('marks active item with proper aria attribute', () => {
      render(<BreadcrumbNavigation items={mockBreadcrumbs} />);

      const activeItem = screen.getByText('Current Article');
      expect(activeItem).toHaveAttribute('aria-current', 'page');
    });

    it('returns null for empty items', () => {
      const { container } = render(<BreadcrumbNavigation items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders separators between items', () => {
      render(<BreadcrumbNavigation items={mockBreadcrumbs} />);

      // Should have 3 separators for 4 items
      const separators = document.querySelectorAll('svg');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('FooterNavigation', () => {
    const mockFooterSections = [
      {
        title: 'Company',
        items: [
          { label: 'About', href: '/about' },
          { label: 'Careers', href: '/careers' }
        ]
      },
      {
        title: 'Support',
        items: [
          { label: 'Help Center', href: '/help' },
          { label: 'Contact', href: '/contact' }
        ]
      }
    ];

    const mockSocialLinks: NavigationItem[] = [
      { label: 'Twitter', href: 'https://twitter.com', isExternal: true },
      { label: 'Facebook', href: 'https://facebook.com', isExternal: true }
    ];

    it('renders footer sections', () => {
      render(
        <FooterNavigation 
          sections={mockFooterSections}
          copyright="© 2024 Test Company"
        />
      );

      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Careers')).toBeInTheDocument();
      expect(screen.getByText('Help Center')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('renders copyright information', () => {
      render(
        <FooterNavigation 
          sections={mockFooterSections}
          copyright="© 2024 Test Company"
        />
      );

      expect(screen.getByText('© 2024 Test Company')).toBeInTheDocument();
    });

    it('renders social media links', () => {
      render(
        <FooterNavigation 
          sections={mockFooterSections}
          socialLinks={mockSocialLinks}
        />
      );

      const twitterLink = screen.getByLabelText('Twitter');
      const facebookLink = screen.getByLabelText('Facebook');
      
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
      expect(facebookLink).toHaveAttribute('href', 'https://facebook.com');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(facebookLink).toHaveAttribute('target', '_blank');
    });

    it('handles external links properly', () => {
      const sectionsWithExternal = [
        {
          title: 'External',
          items: [
            { label: 'External Link', href: 'https://example.com', isExternal: true }
          ]
        }
      ];

      render(<FooterNavigation sections={sectionsWithExternal} />);

      const externalLink = screen.getByText('External Link').closest('a');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper ARIA labels and roles', () => {
      const items: NavigationItem[] = [
        { label: 'Home', href: '/' }
      ];

      render(<PrimaryNavigation items={items} siteName="Test" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const items: NavigationItem[] = [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' }
      ];

      render(<PrimaryNavigation items={items} siteName="Test" />);

      const homeLink = screen.getByText('Home').closest('a');
      homeLink?.focus();
      expect(homeLink).toHaveFocus();

      // Tab to next item
      await userEvent.tab();
      const aboutLink = screen.getByText('About').closest('a');
      expect(aboutLink).toHaveFocus();
    });

    it('maintains focus management in mobile menu', () => {
      const items: NavigationItem[] = [
        { label: 'Home', href: '/' }
      ];

      render(<PrimaryNavigation items={items} siteName="Test" />);

      const mobileButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(mobileButton);
      expect(mobileButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
}); 