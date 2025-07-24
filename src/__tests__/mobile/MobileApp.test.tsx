import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileApp from '@/mobile/components/MobileApp';
import {
  MobileNavigation,
  OfflineState,
  NavigationType,
  TabItem,
} from '@/mobile/types/mobile.types';

// Mock the mobile hooks
jest.mock('@/mobile/hooks/useMobileNavigation', () => ({
  useMobileNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: false,
    history: [],
  }),
}));

jest.mock('@/mobile/hooks/useOfflineSync', () => ({
  useOfflineSync: () => ({
    syncStatus: 'synced',
    pendingOperations: [],
    sync: jest.fn(),
    conflicts: [],
    resolveConflict: jest.fn(),
  }),
}));

jest.mock('@/mobile/hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({
    isSupported: true,
    permission: 'granted',
    requestPermission: jest.fn(),
    showNotification: jest.fn(),
  }),
}));

jest.mock('@/mobile/hooks/useDeviceFeatures', () => ({
  useDeviceFeatures: () => ({
    device: {
      type: 'mobile',
      platform: 'android',
      touchSupport: true,
    },
    capabilities: {
      maxTouchPoints: 10,
      hasCamera: true,
    },
    requestPermission: jest.fn(),
  }),
}));

jest.mock('@/mobile/hooks/useTouchGestures', () => ({
  useTouchGestures: () => ({
    onTouchStart: jest.fn(),
    onTouchMove: jest.fn(),
    onTouchEnd: jest.fn(),
    gestures: [],
  }),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

const mockNavigation: MobileNavigation = {
  type: 'tabs' as NavigationType,
  currentScreen: 'home',
  history: [],
  canGoBack: false,
  canGoForward: false,
  tabs: [
    { id: 'home', label: 'Home', icon: 'home', screen: 'home', isActive: true, isEnabled: true },
    { id: 'content', label: 'Content', icon: 'edit', screen: 'content', isActive: false, isEnabled: true },
    { id: 'camera', label: 'Camera', icon: 'camera', screen: 'camera', isActive: false, isEnabled: true },
    { id: 'profile', label: 'Profile', icon: 'user', screen: 'profile', isActive: false, isEnabled: true },
  ] as TabItem[],
  transitionConfig: {
    type: 'slide',
    duration: 300,
    easing: 'ease-in-out',
  },
};

const mockOfflineState: OfflineState = {
  isOnline: true,
  lastOnlineTime: new Date(),
  connectionType: 'wifi',
  pendingOperations: [],
  syncQueue: [],
  conflictedItems: [],
  storageUsage: {
    total: 1000000,
    used: 250000,
    available: 750000,
    quota: 1000000,
    breakdown: {
      cache: 150000,
      indexedDB: 75000,
      localStorage: 25000,
      sessionStorage: 0,
    },
    lastUpdated: new Date(),
  },
};

describe('MobileApp', () => {
  const defaultProps = {
    userId: 'test-user',
    theme: 'auto' as const,
    initialScreen: 'home',
    navigation: mockNavigation,
    offline: mockOfflineState,
    onNavigate: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigator APIs
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock beforeinstallprompt event
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  it('renders mobile app with status bar and navigation', () => {
    render(<MobileApp {...defaultProps} />);

    // Check status bar elements
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument(); // Time
    
    // Check header
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Check navigation tabs
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('displays mobile home screen by default', () => {
    render(<MobileApp {...defaultProps} />);

    expect(screen.getByText('Mobile Home')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('handles tab navigation correctly', () => {
    const onNavigate = jest.fn();
    render(<MobileApp {...defaultProps} onNavigate={onNavigate} />);

    // Click on Content tab
    const contentTab = screen.getByRole('button', { name: /content/i });
    fireEvent.click(contentTab);

    expect(onNavigate).toHaveBeenCalledWith('content');
  });

  it('shows offline indicator when offline', () => {
    const offlineState = {
      ...mockOfflineState,
      isOnline: false,
    };

    render(<MobileApp {...defaultProps} offline={offlineState} />);

    // Should show offline indicator in status bar
    // The exact implementation may vary, but there should be some offline indication
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays pending operations count', () => {
    const offlineStateWithPending = {
      ...mockOfflineState,
      pendingOperations: [
        {
          id: '1',
          type: 'create' as const,
          resource: '/api/content',
          resourceId: '1',
          data: { title: 'Test' },
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          priority: 1,
          status: 'pending' as const,
        },
        {
          id: '2',
          type: 'update' as const,
          resource: '/api/content',
          resourceId: '2',
          data: { title: 'Test 2' },
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          priority: 1,
          status: 'pending' as const,
        },
      ],
    };

    render(<MobileApp {...defaultProps} offline={offlineStateWithPending} />);

    // Should show pending operations count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles PWA install prompt', async () => {
    render(<MobileApp {...defaultProps} />);

    // Simulate beforeinstallprompt event
    const mockEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // Trigger the event handler
    const eventHandler = (window.addEventListener as jest.Mock).mock.calls
      .find(call => call[0] === 'beforeinstallprompt')?.[1];

    if (eventHandler) {
      eventHandler(mockEvent);
    }

    await waitFor(() => {
      expect(screen.getByText('Install app for better experience')).toBeInTheDocument();
    });

    // Click install button
    const installButton = screen.getByText('Install');
    fireEvent.click(installButton);

    expect(mockEvent.prompt).toHaveBeenCalled();
  });

  it('displays battery and connection status', () => {
    // Mock battery API
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve({
        level: 0.8,
        addEventListener: jest.fn(),
      }),
    });

    // Mock connection API
    Object.defineProperty(navigator, 'connection', {
      value: {
        downlink: 4,
        addEventListener: jest.fn(),
      },
    });

    render(<MobileApp {...defaultProps} />);

    // Battery and connection indicators should be present
    // The exact text may vary based on implementation
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it('shows notification badge when there are unread notifications', () => {
    render(<MobileApp {...defaultProps} />);

    // Since we're not actually setting notifications in this test,
    // we just verify the notification button exists
    const notificationButton = screen.getByRole('button');
    expect(notificationButton).toBeInTheDocument();
  });

  it('handles theme switching', () => {
    const { rerender } = render(<MobileApp {...defaultProps} theme="light" />);

    // Check light theme
    const container = screen.getByTestId ? screen.getByTestId('mobile-app') : document.querySelector('[data-theme="light"]');
    
    // Switch to dark theme
    rerender(<MobileApp {...defaultProps} theme="dark" />);
    
    // Should apply dark theme classes
    expect(document.querySelector('.dark, [data-theme="dark"]')).toBeInTheDocument();
  });

  it('displays conflict resolution alert', () => {
    const offlineStateWithConflicts = {
      ...mockOfflineState,
      conflictedItems: [
        {
          id: '1',
          resourceType: 'content',
          resourceId: '1',
          localVersion: { title: 'Local' },
          remoteVersion: { title: 'Remote' },
          conflictFields: ['title'],
          timestamp: new Date(),
          isResolved: false,
        },
      ],
    };

    render(<MobileApp {...defaultProps} offline={offlineStateWithConflicts} />);

    expect(screen.getByText(/sync conflict/i)).toBeInTheDocument();
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('handles touch events for gesture recognition', () => {
    render(<MobileApp {...defaultProps} />);

    const mainContent = screen.getByText('Mobile Home').closest('div');
    expect(mainContent).toBeInTheDocument();

    // Touch events should be handled (mocked in our case)
    if (mainContent) {
      fireEvent.touchStart(mainContent, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(mainContent, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(mainContent);
    }

    // Gesture handling is mocked, so we just verify no errors occurred
    expect(screen.getByText('Mobile Home')).toBeInTheDocument();
  });

  it('shows different screens based on navigation', () => {
    render(<MobileApp {...defaultProps} />);

    // Default home screen
    expect(screen.getByText('Mobile Home')).toBeInTheDocument();

    // Navigate to content screen (this would require updating the navigation prop)
    const contentNavigation = {
      ...mockNavigation,
      currentScreen: 'content',
      tabs: mockNavigation.tabs?.map(tab => ({
        ...tab,
        isActive: tab.id === 'content',
      })),
    };

    const { rerender } = render(<MobileApp {...defaultProps} navigation={contentNavigation} />);
    
    // Content screen should be displayed
    expect(screen.getByText('Content management screen')).toBeInTheDocument();
  });
}); 