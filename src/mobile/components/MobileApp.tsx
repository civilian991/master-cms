'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery,
  Signal,
  Menu,
  Bell,
  Settings,
  User,
  Home,
  Edit,
  Calendar,
  BarChart3,
  Camera,
  Mic,
  Download,
  RefreshCw as Sync,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MobileAppProps,
  MobileNavigation,
  OfflineState,
  MobileNotification,
  PWAInstallState,
  TouchGesture,
  NavigationType,
  TabItem,
} from '../types/mobile.types';
import { useMobileNavigation } from '../hooks/useMobileNavigation';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useDeviceFeatures } from '../hooks/useDeviceFeatures';
import { useTouchGestures } from '../hooks/useTouchGestures';

// Mobile screen components
interface MobileScreens {
  [key: string]: React.ComponentType<any>;
}

// Default mobile screens (these would be imported from actual screen files)
const DefaultHomeScreen = () => (
  <div className="p-4 space-y-4">
    <h1 className="text-2xl font-bold">Mobile Home</h1>
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 text-center">
        <Edit className="h-8 w-8 mx-auto mb-2" />
        <span>Create Content</span>
      </Card>
      <Card className="p-4 text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2" />
        <span>Schedule</span>
      </Card>
      <Card className="p-4 text-center">
        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
        <span>Analytics</span>
      </Card>
      <Card className="p-4 text-center">
        <Camera className="h-8 w-8 mx-auto mb-2" />
        <span>Camera</span>
      </Card>
    </div>
  </div>
);

const DefaultContentScreen = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Content</h1>
    <p>Content management screen</p>
  </div>
);

const DefaultProfileScreen = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Profile</h1>
    <p>User profile and settings</p>
  </div>
);

const DEFAULT_SCREENS: MobileScreens = {
  home: DefaultHomeScreen,
  content: DefaultContentScreen,
  profile: DefaultProfileScreen,
};

export function MobileApp({
  userId,
  theme = 'auto',
  initialScreen = 'home',
  navigation,
  offline,
  onNavigate,
  onError,
}: MobileAppProps) {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [pwaInstallState, setPwaInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    installPrompt: 'auto',
    promptDismissCount: 0,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>();
  const [connectionStrength, setConnectionStrength] = useState(100);

  // Mobile hooks
  const {
    navigate,
    goBack,
    canGoBack,
    history,
  } = useMobileNavigation({
    type: navigation.type,
    initialScreen,
  });

  const {
    syncStatus,
    pendingOperations,
    sync,
    conflicts,
    resolveConflict,
  } = useOfflineSync({
    autoSync: true,
    syncInterval: 30000, // 30 seconds
  });

  const {
    isSupported: notificationsSupported,
    permission: notificationPermission,
    requestPermission,
    showNotification,
  } = usePushNotifications({
    enableOnMount: true,
    requestPermission: false,
  });

  const {
    device,
    capabilities,
    requestPermission: requestDevicePermission,
  } = useDeviceFeatures({
    requestPermissions: false,
  });

  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    gestures,
  } = useTouchGestures({
    enableSwipe: true,
    enablePinch: true,
    enableLongPress: true,
  });

  // ============================================================================
  // PWA INSTALLATION
  // ============================================================================

  useEffect(() => {
    let deferredPrompt: any;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setPwaInstallState(prev => ({
        ...prev,
        isInstallable: true,
        installEvent: e as any,
      }));
    };

    const handleAppInstalled = () => {
      setPwaInstallState(prev => ({
        ...prev,
        isInstalled: true,
        installDate: new Date(),
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstallState(prev => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!pwaInstallState.installEvent) return;

    try {
      await (pwaInstallState.installEvent as any).prompt();
      const choiceResult = await (pwaInstallState.installEvent as any).userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setPwaInstallState(prev => ({
          ...prev,
          installPrompt: 'dismissed',
          isInstalled: true,
        }));
      } else {
        setPwaInstallState(prev => ({
          ...prev,
          installPrompt: 'dismissed',
          promptDismissCount: prev.promptDismissCount + 1,
        }));
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  };

  // ============================================================================
  // DEVICE STATUS
  // ============================================================================

  useEffect(() => {
    // Battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Connection status
    const updateConnectionStatus = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const strength = Math.min(100, Math.max(0, 
          (connection.downlink || 1) * 25
        ));
        setConnectionStrength(strength);
      }
    };

    updateConnectionStatus();
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleTabPress = useCallback((tabId: string) => {
    setCurrentScreen(tabId);
    navigate(tabId);
    onNavigate(tabId);
  }, [navigate, onNavigate]);

  const handleScreenNavigation = useCallback((screen: string, params?: any) => {
    setCurrentScreen(screen);
    navigate(screen, params);
    onNavigate(screen, params);
  }, [navigate, onNavigate]);

  const handleBackPress = useCallback(() => {
    if (canGoBack) {
      const previousScreen = history[history.length - 2];
      if (previousScreen) {
        setCurrentScreen(previousScreen.screen);
        goBack();
        onNavigate(previousScreen.screen, previousScreen.params);
      }
    }
  }, [canGoBack, history, goBack, onNavigate]);

  // ============================================================================
  // GESTURE HANDLERS
  // ============================================================================

  const handleGesture = useCallback((gesture: TouchGesture) => {
    switch (gesture.type) {
      case 'swipe':
        if (gesture.direction === 'right' && canGoBack) {
          handleBackPress();
        } else if (gesture.direction === 'left' && isMenuOpen) {
          setIsMenuOpen(false);
        } else if (gesture.direction === 'right' && !isMenuOpen) {
          setIsMenuOpen(true);
        }
        break;
      
      case 'long_press':
        // Show context menu or quick actions
        break;
    }
  }, [canGoBack, handleBackPress, isMenuOpen]);

  useEffect(() => {
    if (gestures.length > 0) {
      handleGesture(gestures[gestures.length - 1]);
    }
  }, [gestures, handleGesture]);

  // ============================================================================
  // OFFLINE HANDLING
  // ============================================================================

  const handleOfflineAction = useCallback(async () => {
    if (offline.isOnline) {
      await sync();
    } else {
      // Show offline capabilities
      await showNotification({
        title: 'Offline Mode',
        body: 'You are currently offline. Your changes will sync when connection returns.',
        priority: 'default',
      });
    }
  }, [offline.isOnline, sync, showNotification]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBar = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm">
      {/* Left side - Time */}
      <div className="font-medium">
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      
      {/* Right side - Status indicators */}
      <div className="flex items-center space-x-2">
        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {offline.isOnline ? (
            <>
              <Signal className="h-3 w-3" />
              <span className="text-xs">{connectionStrength}%</span>
            </>
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
        
        {/* Battery level */}
        {batteryLevel !== undefined && (
          <div className="flex items-center space-x-1">
            <Battery className="h-3 w-3" />
            <span className="text-xs">{batteryLevel}%</span>
          </div>
        )}
        
        {/* Sync indicator */}
        {pendingOperations.length > 0 && (
          <Badge variant="outline" className="text-xs px-1">
            {pendingOperations.length}
          </Badge>
        )}
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b">
      {/* Left side - Menu/Back */}
      <div className="flex items-center space-x-3">
        {canGoBack ? (
          <Button variant="ghost" size="sm" onClick={handleBackPress}>
            ←
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <h1 className="text-lg font-semibold capitalize">
          {currentScreen.replace('_', ' ')}
        </h1>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Offline indicator */}
        {!offline.isOnline && (
          <Button variant="ghost" size="sm" onClick={handleOfflineAction}>
            <WifiOff className="h-4 w-4 text-orange-500" />
          </Button>
        )}
        
        {/* Sync button */}
        {syncStatus === 'pending' && (
          <Button variant="ghost" size="sm" onClick={sync}>
            <Sync className="h-4 w-4 animate-spin" />
          </Button>
        )}
        
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {notifications.filter(n => !n.isRead).length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              {notifications.filter(n => !n.isRead).length}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );

  const renderTabNavigation = () => {
    const defaultTabs: TabItem[] = [
      { id: 'home', label: 'Home', icon: 'home', screen: 'home', isActive: currentScreen === 'home', isEnabled: true },
      { id: 'content', label: 'Content', icon: 'edit', screen: 'content', isActive: currentScreen === 'content', isEnabled: true },
      { id: 'camera', label: 'Camera', icon: 'camera', screen: 'camera', isActive: currentScreen === 'camera', isEnabled: true },
      { id: 'profile', label: 'Profile', icon: 'user', screen: 'profile', isActive: currentScreen === 'profile', isEnabled: true },
    ];

    const tabs = navigation.tabs || defaultTabs;

    return (
      <div className="flex bg-white dark:bg-gray-900 border-t">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabPress(tab.id)}
            disabled={!tab.isEnabled}
            className={`
              flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[60px]
              ${tab.isActive 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
              ${!tab.isEnabled ? 'opacity-50' : 'hover:text-blue-500'}
              transition-colors duration-200
            `}
          >
            <div className="relative">
              {tab.icon === 'home' && <Home className="h-5 w-5" />}
              {tab.icon === 'edit' && <Edit className="h-5 w-5" />}
              {tab.icon === 'camera' && <Camera className="h-5 w-5" />}
              {tab.icon === 'user' && <User className="h-5 w-5" />}
              
              {tab.badge && tab.badge > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs mt-1 truncate max-w-full">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderScreen = () => {
    const ScreenComponent = DEFAULT_SCREENS[currentScreen] || DefaultHomeScreen;
    
    return (
      <div 
        className="flex-1 overflow-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <ScreenComponent 
          navigation={navigation}
          offline={offline}
          userId={userId}
          onNavigate={handleScreenNavigation}
        />
      </div>
    );
  };

  const renderPWAInstallPrompt = () => {
    if (!pwaInstallState.isInstallable || pwaInstallState.isInstalled || 
        pwaInstallState.promptDismissCount >= 3) {
      return null;
    }

    return (
      <Alert className="mx-4 mb-4">
        <Download className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Install app for better experience</span>
          <div className="flex space-x-2">
            <Button size="sm" onClick={handlePWAInstall}>
              Install
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPwaInstallState(prev => ({ 
                ...prev, 
                promptDismissCount: prev.promptDismissCount + 1 
              }))}
            >
              Later
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderConflictAlert = () => {
    if (conflicts.length === 0) return null;

    return (
      <Alert className="mx-4 mb-4" variant="destructive">
        <AlertDescription>
          {conflicts.length} sync conflict{conflicts.length > 1 ? 's' : ''} need resolution
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-2"
            onClick={() => {
              // Handle conflict resolution
              conflicts.forEach(conflict => {
                resolveConflict(conflict.id, 'local');
              });
            }}
          >
            Resolve
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div 
      className={`
        min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col
        ${theme === 'dark' ? 'dark' : ''}
      `}
      data-theme={theme}
    >
      {/* Status Bar */}
      {renderStatusBar()}
      
      {/* Header */}
      {renderHeader()}
      
      {/* PWA Install Prompt */}
      {renderPWAInstallPrompt()}
      
      {/* Conflict Alert */}
      {renderConflictAlert()}
      
      {/* Main Content */}
      {renderScreen()}
      
      {/* Bottom Navigation */}
      {navigation.type === 'tabs' && renderTabNavigation()}
      
      {/* Loading overlay for sync */}
      {syncStatus === 'syncing' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 text-center">
            <Sync className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Syncing data...</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default MobileApp; 