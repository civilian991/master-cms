'use client';

import { z } from 'zod';

// Validation schemas
const OfflineActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'create_post', 'update_post', 'delete_post',
    'create_comment', 'update_comment', 'delete_comment',
    'like_post', 'unlike_post',
    'bookmark_post', 'unbookmark_post',
    'join_community', 'leave_community',
    'follow_user', 'unfollow_user',
    'update_profile', 'upload_media'
  ]),
  data: z.record(z.any()),
  timestamp: z.number(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'syncing', 'completed', 'failed']).default('pending'),
});

const CachedDataSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()),
  timestamp: z.number(),
  expiresAt: z.number().optional(),
  version: z.number().default(1),
  lastModified: z.number(),
});

const ConflictResolutionSchema = z.object({
  localData: z.record(z.any()),
  remoteData: z.record(z.any()),
  strategy: z.enum(['local-wins', 'remote-wins', 'merge', 'manual']),
  resolvedData: z.record(z.any()).optional(),
});

export type OfflineAction = z.infer<typeof OfflineActionSchema>;
export type CachedData = z.infer<typeof CachedDataSchema>;
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

export interface SyncStatus {
  isOnline: boolean;
  issyncing: boolean;
  pendingActions: number;
  lastSyncTime: number;
  syncErrors: string[];
}

export interface OfflineConfig {
  maxCacheSize: number;
  maxPendingActions: number;
  syncInterval: number;
  retryDelay: number;
  enableAutoSync: boolean;
  enableConflictResolution: boolean;
}

export class OfflineSyncService {
  private config: OfflineConfig;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncWorker: Worker | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxPendingActions: 1000,
      syncInterval: 30000, // 30 seconds
      retryDelay: 5000, // 5 seconds
      enableAutoSync: true,
      enableConflictResolution: true,
      ...config,
    };

    this.initializeOfflineSync();
  }

  private initializeOfflineSync(): void {
    // Setup online/offline event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      if (this.config.enableAutoSync) {
        this.syncPendingActions();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });

    // Setup periodic sync
    if (this.config.enableAutoSync) {
      this.startPeriodicSync();
    }

    // Initialize web worker for background sync
    this.initializeSyncWorker();

    // Setup storage event listener for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('offline-sync-')) {
        this.handleStorageChange(e);
      }
    });
  }

  private initializeSyncWorker(): void {
    if ('Worker' in window) {
      try {
        const workerCode = `
          self.addEventListener('message', function(e) {
            const { type, data } = e.data;
            
            switch (type) {
              case 'sync':
                // Perform background sync
                self.postMessage({ type: 'sync-complete', success: true });
                break;
              case 'cleanup':
                // Cleanup old cache entries
                self.postMessage({ type: 'cleanup-complete' });
                break;
            }
          });
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.syncWorker = new Worker(URL.createObjectURL(blob));
        
        this.syncWorker.addEventListener('message', (e) => {
          this.handleWorkerMessage(e.data);
        });
      } catch (error) {
        console.warn('Failed to initialize sync worker:', error);
      }
    }
  }

  private handleWorkerMessage(message: any): void {
    switch (message.type) {
      case 'sync-complete':
        this.emit('sync-complete', message.success);
        break;
      case 'cleanup-complete':
        this.emit('cleanup-complete');
        break;
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'offline-sync-status') {
      const status = JSON.parse(event.newValue || '{}');
      this.emit('sync-status-changed', status);
    }
  }

  // Event system
  public on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: any[]): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // Cache management
  public async cacheData(id: string, type: string, data: any, expiresIn?: number): Promise<void> {
    const cachedData: CachedData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      version: 1,
      lastModified: Date.now(),
    };

    try {
      const key = `offline-cache-${type}-${id}`;
      localStorage.setItem(key, JSON.stringify(cachedData));
      
      // Check cache size and cleanup if necessary
      await this.enforceMaxCacheSize();
      
      this.emit('data-cached', { id, type });
    } catch (error) {
      console.error('Error caching data:', error);
      // Try to free up space and retry
      await this.cleanupExpiredCache();
      try {
        localStorage.setItem(`offline-cache-${type}-${id}`, JSON.stringify(cachedData));
      } catch (retryError) {
        console.error('Failed to cache data after cleanup:', retryError);
      }
    }
  }

  public async getCachedData(id: string, type: string): Promise<CachedData | null> {
    try {
      const key = `offline-cache-${type}-${id}`;
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached) as CachedData;
      
      // Check if expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }

  public async removeCachedData(id: string, type: string): Promise<void> {
    const key = `offline-cache-${type}-${id}`;
    localStorage.removeItem(key);
    this.emit('data-removed', { id, type });
  }

  // Action queue management
  public async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<string> {
    const actionWithId: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const validatedAction = OfflineActionSchema.parse(actionWithId);

    try {
      const pendingActions = await this.getPendingActions();
      
      // Check max pending actions limit
      if (pendingActions.length >= this.config.maxPendingActions) {
        // Remove oldest low-priority actions
        await this.cleanupOldActions();
      }

      const key = `offline-action-${validatedAction.id}`;
      localStorage.setItem(key, JSON.stringify(validatedAction));
      
      this.emit('action-queued', validatedAction);
      
      // Try to sync immediately if online
      if (this.isOnline && this.config.enableAutoSync) {
        this.syncPendingActions();
      }
      
      return validatedAction.id;
    } catch (error) {
      console.error('Error queueing action:', error);
      throw error;
    }
  }

  public async getPendingActions(): Promise<OfflineAction[]> {
    const actions: OfflineAction[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline-action-')) {
        try {
          const action = JSON.parse(localStorage.getItem(key)!);
          if (action.status === 'pending') {
            actions.push(action);
          }
        } catch (error) {
          console.error('Error parsing action:', error);
          localStorage.removeItem(key);
        }
      }
    }
    
    // Sort by priority and timestamp
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });
  }

  public async removeAction(actionId: string): Promise<void> {
    const key = `offline-action-${actionId}`;
    localStorage.removeItem(key);
    this.emit('action-removed', actionId);
  }

  // Sync operations
  public async syncPendingActions(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.emit('sync-started');

    try {
      const pendingActions = await this.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          await this.handleSyncError(action, error);
        }
      }
      
      this.emit('sync-completed');
    } catch (error) {
      console.error('Sync process failed:', error);
      this.emit('sync-failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncAction(action: OfflineAction): Promise<void> {
    // Update action status
    action.status = 'syncing';
    const key = `offline-action-${action.id}`;
    localStorage.setItem(key, JSON.stringify(action));

    try {
      const result = await this.executeAction(action);
      
      if (result.success) {
        // Action completed successfully
        action.status = 'completed';
        localStorage.removeItem(key);
        this.emit('action-synced', action);
        
        // Update cached data if applicable
        if (result.data) {
          await this.updateCacheFromSync(action, result.data);
        }
      } else {
        throw new Error(result.error || 'Unknown sync error');
      }
    } catch (error) {
      action.status = 'pending';
      action.retryCount++;
      localStorage.setItem(key, JSON.stringify(action));
      throw error;
    }
  }

  private async executeAction(action: OfflineAction): Promise<{ success: boolean; data?: any; error?: string }> {
    const { type, data } = action;
    
    try {
      let response: Response;
      
      switch (type) {
        case 'create_post':
          response = await fetch('/api/content/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;
          
        case 'update_post':
          response = await fetch(`/api/content/articles/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;
          
        case 'delete_post':
          response = await fetch(`/api/content/articles/${data.id}`, {
            method: 'DELETE',
          });
          break;
          
        case 'like_post':
          response = await fetch(`/api/content/articles/${data.postId}/like`, {
            method: 'POST',
          });
          break;
          
        case 'join_community':
          response = await fetch(`/api/communities/${data.communityId}/join`, {
            method: 'POST',
          });
          break;
          
        // Add more action types as needed
        default:
          throw new Error(`Unknown action type: ${type}`);
      }
      
      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || response.statusText };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async handleSyncError(action: OfflineAction, error: any): Promise<void> {
    if (action.retryCount >= action.maxRetries) {
      action.status = 'failed';
      const key = `offline-action-${action.id}`;
      localStorage.setItem(key, JSON.stringify(action));
      this.emit('action-failed', { action, error });
    } else {
      // Schedule retry
      setTimeout(() => {
        if (this.isOnline) {
          this.syncAction(action);
        }
      }, this.config.retryDelay * Math.pow(2, action.retryCount)); // Exponential backoff
    }
  }

  private async updateCacheFromSync(action: OfflineAction, data: any): Promise<void> {
    const { type } = action;
    
    // Update relevant cached data based on action type
    switch (type) {
      case 'create_post':
      case 'update_post':
        if (data.id) {
          await this.cacheData(data.id, 'post', data);
        }
        break;
        
      case 'join_community':
        if (data.communityId) {
          const cachedCommunity = await this.getCachedData(data.communityId, 'community');
          if (cachedCommunity) {
            cachedCommunity.data.memberCount = (cachedCommunity.data.memberCount || 0) + 1;
            await this.cacheData(data.communityId, 'community', cachedCommunity.data);
          }
        }
        break;
    }
  }

  // Conflict resolution
  public async resolveConflict(
    localData: any,
    remoteData: any,
    strategy: ConflictResolution['strategy'] = 'remote-wins'
  ): Promise<any> {
    if (!this.config.enableConflictResolution) {
      return remoteData; // Default to remote wins
    }

    switch (strategy) {
      case 'local-wins':
        return localData;
        
      case 'remote-wins':
        return remoteData;
        
      case 'merge':
        return this.mergeData(localData, remoteData);
        
      case 'manual':
        // Emit event for manual resolution
        this.emit('conflict-detected', { localData, remoteData });
        return null; // Let user decide
        
      default:
        return remoteData;
    }
  }

  private mergeData(localData: any, remoteData: any): any {
    // Simple merge strategy - can be customized based on data type
    if (typeof localData === 'object' && typeof remoteData === 'object') {
      return {
        ...remoteData,
        ...localData,
        // Use remote timestamp if available
        updatedAt: remoteData.updatedAt || localData.updatedAt,
      };
    }
    
    // For non-objects, prefer remote data
    return remoteData;
  }

  // Utility methods
  public async getStatus(): Promise<SyncStatus> {
    const pendingActions = await this.getPendingActions();
    const syncErrors = pendingActions
      .filter(action => action.status === 'failed')
      .map(action => `Action ${action.type} failed`);

    return {
      isOnline: this.isOnline,
      issyncing: this.isSyncing,
      pendingActions: pendingActions.length,
      lastSyncTime: this.getLastSyncTime(),
      syncErrors,
    };
  }

  private getLastSyncTime(): number {
    const lastSync = localStorage.getItem('offline-sync-last-sync');
    return lastSync ? parseInt(lastSync, 10) : 0;
  }

  private setLastSyncTime(): void {
    localStorage.setItem('offline-sync-last-sync', Date.now().toString());
  }

  public startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.config.enableAutoSync) {
        this.syncPendingActions();
      }
    }, this.config.syncInterval);
  }

  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Cleanup methods
  private async enforceMaxCacheSize(): Promise<void> {
    let totalSize = 0;
    const cacheEntries: Array<{ key: string; size: number; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline-cache-')) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          
          try {
            const data = JSON.parse(value);
            cacheEntries.push({
              key,
              size,
              timestamp: data.timestamp || 0,
            });
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      }
    }

    if (totalSize > this.config.maxCacheSize) {
      // Sort by timestamp (oldest first)
      cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest entries until under limit
      for (const entry of cacheEntries) {
        localStorage.removeItem(entry.key);
        totalSize -= entry.size;
        
        if (totalSize <= this.config.maxCacheSize * 0.8) { // 80% of max
          break;
        }
      }
    }
  }

  private async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline-cache-')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            if (data.expiresAt && now > data.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    }
  }

  private async cleanupOldActions(): Promise<void> {
    const actions = await this.getPendingActions();
    const lowPriorityActions = actions.filter(action => action.priority === 'low');
    
    // Remove oldest low-priority actions
    const toRemove = Math.min(10, lowPriorityActions.length);
    for (let i = 0; i < toRemove; i++) {
      await this.removeAction(lowPriorityActions[i].id);
    }
  }

  public async clearAll(): Promise<void> {
    // Clear all offline data
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline-')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    this.emit('data-cleared');
  }

  public destroy(): void {
    this.stopPeriodicSync();
    
    if (this.syncWorker) {
      this.syncWorker.terminate();
      this.syncWorker = null;
    }
    
    this.eventListeners.clear();
  }
}

// Global offline sync service instance
export const offlineSyncService = new OfflineSyncService({
  enableAutoSync: true,
  enableConflictResolution: true,
  syncInterval: 30000, // 30 seconds
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxPendingActions: 500,
});

// Auto-start sync service
if (typeof window !== 'undefined') {
  // Add unload handler to cleanup
  window.addEventListener('beforeunload', () => {
    offlineSyncService.destroy();
  });
} 