'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { socialApi } from '../services/socialApi';
import {
  SocialPlatform,
  SocialAccount,
  UseSocialPlatformsOptions,
} from '../types/social.types';

interface PlatformsState {
  accounts: SocialAccount[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt?: Date;
  connectionStatus: Record<SocialPlatform, 'connected' | 'disconnected' | 'error' | 'pending'>;
}

export function useSocialPlatforms(options: UseSocialPlatformsOptions = {}) {
  const {
    autoConnect = false,
    syncInterval = 300000, // 5 minutes
    enableWebhooks = true,
  } = options;

  const [state, setState] = useState<PlatformsState>({
    accounts: [],
    isLoading: false,
    error: null,
    connectionStatus: {
      facebook: 'disconnected',
      twitter: 'disconnected',
      instagram: 'disconnected',
      linkedin: 'disconnected',
      tiktok: 'disconnected',
      youtube: 'disconnected',
      pinterest: 'disconnected',
      snapchat: 'disconnected',
      reddit: 'disconnected',
      discord: 'disconnected',
    },
  });

  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isInitialized.current) {
      loadAccounts();
      setupSyncInterval();
      isInitialized.current = true;
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const setupSyncInterval = () => {
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        refreshAccounts();
      }, syncInterval);
    }
  };

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  const loadAccounts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, get userId from auth context
      const userId = 'current-user-id';
      const accounts = await socialApi.getAccounts(userId);
      
      const connectionStatus = { ...state.connectionStatus };
      accounts.forEach(account => {
        connectionStatus[account.platform] = account.isConnected ? 'connected' : 'disconnected';
      });

      setState(prev => ({
        ...prev,
        accounts,
        connectionStatus,
        isLoading: false,
        lastSyncAt: new Date(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load accounts',
        isLoading: false,
      }));
    }
  }, []);

  const connect = useCallback(async (platform: SocialPlatform): Promise<void> => {
    setState(prev => ({
      ...prev,
      connectionStatus: { ...prev.connectionStatus, [platform]: 'pending' },
      error: null,
    }));

    try {
      // In a real implementation, this would open OAuth flow
      const authUrl = await getAuthUrl(platform);
      const authCode = await openAuthWindow(authUrl);
      
      if (!authCode) {
        throw new Error('Authentication cancelled');
      }

      const account = await socialApi.connectAccount(platform, authCode);
      
      setState(prev => ({
        ...prev,
        accounts: [...prev.accounts.filter(acc => acc.platform !== platform), account],
        connectionStatus: { ...prev.connectionStatus, [platform]: 'connected' },
      }));

      // Setup webhooks if enabled
      if (enableWebhooks) {
        await setupWebhooks(account);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, [platform]: 'error' },
        error: error instanceof Error ? error.message : `Failed to connect ${platform}`,
      }));
      throw error;
    }
  }, [enableWebhooks]);

  const disconnect = useCallback(async (accountId: string): Promise<void> => {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (!account) return;

    setState(prev => ({
      ...prev,
      connectionStatus: { ...prev.connectionStatus, [account.platform]: 'pending' },
      error: null,
    }));

    try {
      await socialApi.disconnectAccount(accountId);
      
      setState(prev => ({
        ...prev,
        accounts: prev.accounts.filter(acc => acc.id !== accountId),
        connectionStatus: { ...prev.connectionStatus, [account.platform]: 'disconnected' },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, [account.platform]: 'error' },
        error: error instanceof Error ? error.message : `Failed to disconnect ${account.platform}`,
      }));
      throw error;
    }
  }, [state.accounts]);

  const refresh = useCallback(async (accountId?: string): Promise<void> => {
    if (accountId) {
      // Refresh specific account
      const account = state.accounts.find(acc => acc.id === accountId);
      if (!account) return;

      setState(prev => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, [account.platform]: 'pending' },
        error: null,
      }));

      try {
        const refreshedAccount = await socialApi.refreshAccount(accountId);
        
        setState(prev => ({
          ...prev,
          accounts: prev.accounts.map(acc => acc.id === accountId ? refreshedAccount : acc),
          connectionStatus: { ...prev.connectionStatus, [account.platform]: 'connected' },
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, [account.platform]: 'error' },
          error: error instanceof Error ? error.message : `Failed to refresh ${account.platform}`,
        }));
      }
    } else {
      // Refresh all accounts
      await loadAccounts();
    }
  }, [state.accounts, loadAccounts]);

  const refreshAccounts = useCallback(async () => {
    // Silently refresh without loading state
    try {
      const userId = 'current-user-id';
      const accounts = await socialApi.getAccounts(userId);
      
      const connectionStatus = { ...state.connectionStatus };
      accounts.forEach(account => {
        connectionStatus[account.platform] = account.isConnected ? 'connected' : 'disconnected';
      });

      setState(prev => ({
        ...prev,
        accounts,
        connectionStatus,
        lastSyncAt: new Date(),
      }));
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }, [state.connectionStatus]);

  // ============================================================================
  // PLATFORM-SPECIFIC UTILITIES
  // ============================================================================

  const getAccount = useCallback((platform: SocialPlatform): SocialAccount | undefined => {
    return state.accounts.find(account => account.platform === platform);
  }, [state.accounts]);

  const getConnectedPlatforms = useCallback((): SocialPlatform[] => {
    return state.accounts
      .filter(account => account.isConnected)
      .map(account => account.platform);
  }, [state.accounts]);

  const getDisconnectedPlatforms = useCallback((): SocialPlatform[] => {
    const connectedPlatforms = new Set(getConnectedPlatforms());
    return (['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'] as SocialPlatform[])
      .filter(platform => !connectedPlatforms.has(platform));
  }, [getConnectedPlatforms]);

  const isConnected = useCallback((platform: SocialPlatform): boolean => {
    return state.connectionStatus[platform] === 'connected';
  }, [state.connectionStatus]);

  const isPending = useCallback((platform: SocialPlatform): boolean => {
    return state.connectionStatus[platform] === 'pending';
  }, [state.connectionStatus]);

  const hasError = useCallback((platform: SocialPlatform): boolean => {
    return state.connectionStatus[platform] === 'error';
  }, [state.connectionStatus]);

  const getTotalFollowers = useCallback((): number => {
    return state.accounts.reduce((total, account) => total + account.followerCount, 0);
  }, [state.accounts]);

  const getAccountMetrics = useCallback(async (accountId: string, dateRange?: { start: Date; end: Date }) => {
    try {
      return await socialApi.getAccountMetrics(accountId, dateRange);
    } catch (error) {
      console.error('Failed to get account metrics:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // PLATFORM CAPABILITIES
  // ============================================================================

  const getPlatformCapabilities = useCallback((platform: SocialPlatform) => {
    const capabilities = {
      facebook: {
        supportsScheduling: true,
        supportsStories: true,
        supportsVideos: true,
        supportsPolls: true,
        supportsLiveStreaming: true,
        maxTextLength: 63206,
        maxImages: 10,
        maxVideoSize: 4000000000,
        supportedFormats: ['jpg', 'png', 'gif', 'mp4', 'mov'],
      },
      twitter: {
        supportsScheduling: true,
        supportsStories: false,
        supportsVideos: true,
        supportsPolls: true,
        supportsLiveStreaming: true,
        maxTextLength: 280,
        maxImages: 4,
        maxVideoSize: 512000000,
        supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
      },
      instagram: {
        supportsScheduling: true,
        supportsStories: true,
        supportsVideos: true,
        supportsPolls: true,
        supportsLiveStreaming: true,
        maxTextLength: 2200,
        maxImages: 10,
        maxVideoSize: 4000000000,
        supportedFormats: ['jpg', 'png', 'mp4', 'mov'],
      },
      linkedin: {
        supportsScheduling: true,
        supportsStories: false,
        supportsVideos: true,
        supportsPolls: true,
        supportsLiveStreaming: false,
        maxTextLength: 3000,
        maxImages: 9,
        maxVideoSize: 5000000000,
        supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
      },
      tiktok: {
        supportsScheduling: false,
        supportsStories: false,
        supportsVideos: true,
        supportsPolls: false,
        supportsLiveStreaming: true,
        maxTextLength: 150,
        maxImages: 0,
        maxVideoSize: 287000000,
        supportedFormats: ['mp4', 'mov'],
      },
      youtube: {
        supportsScheduling: true,
        supportsStories: true,
        supportsVideos: true,
        supportsPolls: true,
        supportsLiveStreaming: true,
        maxTextLength: 5000,
        maxImages: 1,
        maxVideoSize: 137000000000,
        supportedFormats: ['mp4', 'mov', 'avi', 'wmv'],
      },
      pinterest: {
        supportsScheduling: true,
        supportsStories: true,
        supportsVideos: true,
        supportsPolls: false,
        supportsLiveStreaming: false,
        maxTextLength: 500,
        maxImages: 1,
        maxVideoSize: 2000000000,
        supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
      },
      snapchat: {
        supportsScheduling: false,
        supportsStories: true,
        supportsVideos: true,
        supportsPolls: false,
        supportsLiveStreaming: false,
        maxTextLength: 80,
        maxImages: 1,
        maxVideoSize: 32000000,
        supportedFormats: ['jpg', 'png', 'mp4'],
      },
      reddit: {
        supportsScheduling: false,
        supportsStories: false,
        supportsVideos: true,
        supportsPolls: true,
        supportsLiveStreaming: true,
        maxTextLength: 40000,
        maxImages: 20,
        maxVideoSize: 1000000000,
        supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
      },
      discord: {
        supportsScheduling: false,
        supportsStories: false,
        supportsVideos: true,
        supportsPolls: false,
        supportsLiveStreaming: true,
        maxTextLength: 2000,
        maxImages: 10,
        maxVideoSize: 100000000,
        supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
      },
    };

    return capabilities[platform] || null;
  }, []);

  // ============================================================================
  // HELPER FUNCTIONS (Mock implementations)
  // ============================================================================

  const getAuthUrl = async (platform: SocialPlatform): Promise<string> => {
    // Mock implementation - in real app, this would generate OAuth URLs
    const authUrls = {
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      twitter: 'https://api.twitter.com/oauth/authenticate',
      instagram: 'https://api.instagram.com/oauth/authorize',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      tiktok: 'https://www.tiktok.com/auth/authorize/',
      youtube: 'https://accounts.google.com/oauth2/v2/auth',
      pinterest: 'https://www.pinterest.com/oauth/',
      snapchat: 'https://accounts.snapchat.com/login/oauth2/authorize',
      reddit: 'https://www.reddit.com/api/v1/authorize',
      discord: 'https://discord.com/api/oauth2/authorize',
    };

    return authUrls[platform] + '?client_id=mock&redirect_uri=mock&response_type=code';
  };

  const openAuthWindow = async (authUrl: string): Promise<string | null> => {
    // Mock implementation - in real app, this would open OAuth window
    return new Promise((resolve) => {
      // Simulate OAuth flow
      setTimeout(() => {
        resolve('mock_auth_code_' + Math.random().toString(36).substr(2, 9));
      }, 1000);
    });
  };

  const setupWebhooks = async (account: SocialAccount): Promise<void> => {
    // Mock implementation - in real app, this would setup platform webhooks
    console.log(`Setting up webhooks for ${account.platform} account ${account.id}`);
  };

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // State
    accounts: state.accounts,
    isLoading: state.isLoading,
    error: state.error,
    lastSyncAt: state.lastSyncAt,
    connectionStatus: state.connectionStatus,

    // Platform management
    connect,
    disconnect,
    refresh,
    loadAccounts,

    // Platform queries
    getAccount,
    getConnectedPlatforms,
    getDisconnectedPlatforms,
    isConnected,
    isPending,
    hasError,
    getTotalFollowers,
    getAccountMetrics,
    getPlatformCapabilities,

    // Computed values
    platforms: state.accounts,
    connectedCount: getConnectedPlatforms().length,
    totalFollowers: getTotalFollowers(),
    hasAnyConnected: getConnectedPlatforms().length > 0,
    hasErrors: Object.values(state.connectionStatus).some(status => status === 'error'),

    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
}

export default useSocialPlatforms; 