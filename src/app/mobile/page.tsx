'use client';

import React, { useState, useEffect } from 'react';
import MobileApp from '@/mobile/components/MobileApp';
import {
  MobileNavigation,
  OfflineState,
  NavigationType,
  TabItem,
} from '@/mobile/types/mobile.types';

export default function MobilePage() {
  const [navigation] = useState<MobileNavigation>({
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
  });

  const [offline] = useState<OfflineState>({
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
  });

  const handleNavigate = (screen: string, params?: any) => {
    console.log('Navigate to:', screen, params);
  };

  const handleError = (error: any) => {
    console.error('Mobile app error:', error);
  };

  // PWA installation check
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <div className="min-h-screen">
      <MobileApp
        userId="mobile-user"
        theme="auto"
        initialScreen="home"
        navigation={navigation}
        offline={offline}
        onNavigate={handleNavigate}
        onError={handleError}
      />
    </div>
  );
} 