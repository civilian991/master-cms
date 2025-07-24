'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  UseOfflineSyncOptions,
  OfflineOperation,
  SyncQueueItem,
  ConflictItem,
  SyncStatus,
} from '../types/mobile.types';

interface OfflineSyncState {
  syncStatus: SyncStatus;
  pendingOperations: OfflineOperation[];
  syncQueue: SyncQueueItem[];
  conflicts: ConflictItem[];
  lastSyncTime?: Date;
  isOnline: boolean;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 30000,
    retryAttempts = 3,
    conflictStrategy = 'manual',
  } = options;

  const [state, setState] = useState<OfflineSyncState>({
    syncStatus: 'synced',
    pendingOperations: [],
    syncQueue: [],
    conflicts: [],
    isOnline: navigator.onLine,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isInitialized.current) {
      loadPersistedState();
      setupEventListeners();
      isInitialized.current = true;
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const loadPersistedState = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Load from IndexedDB or localStorage
      const stored = localStorage.getItem('offline-sync-state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          pendingOperations: parsedState.pendingOperations || [],
          conflicts: parsedState.conflicts || [],
          lastSyncTime: parsedState.lastSyncTime ? new Date(parsedState.lastSyncTime) : undefined,
        }));
      }
    } catch (error) {
      console.warn('Failed to load persisted sync state:', error);
    }
  };

  const setupEventListeners = () => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (autoSync) {
        sync();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToStore = {
        pendingOperations: state.pendingOperations,
        conflicts: state.conflicts,
        lastSyncTime: state.lastSyncTime,
      };
      localStorage.setItem('offline-sync-state', JSON.stringify(stateToStore));
    }
  }, [state.pendingOperations, state.conflicts, state.lastSyncTime]);

  // ============================================================================
  // AUTO SYNC
  // ============================================================================

  useEffect(() => {
    if (autoSync && state.isOnline && syncInterval > 0) {
      syncTimeoutRef.current = setTimeout(() => {
        if (state.pendingOperations.length > 0) {
          sync();
        }
      }, syncInterval);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [autoSync, state.isOnline, state.pendingOperations.length, syncInterval]);

  // ============================================================================
  // OPERATIONS MANAGEMENT
  // ============================================================================

  const addOperation = useCallback((operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    setState(prev => ({
      ...prev,
      pendingOperations: [...prev.pendingOperations, newOperation],
    }));

    if (state.isOnline && autoSync) {
      // Trigger sync after a short delay to batch operations
      setTimeout(() => sync(), 1000);
    }

    return newOperation.id;
  }, [state.isOnline, autoSync]);

  const removeOperation = useCallback((operationId: string) => {
    setState(prev => ({
      ...prev,
      pendingOperations: prev.pendingOperations.filter(op => op.id !== operationId),
      syncQueue: prev.syncQueue.filter(item => item.operation.id !== operationId),
    }));
  }, []);

  const updateOperation = useCallback((operationId: string, updates: Partial<OfflineOperation>) => {
    setState(prev => ({
      ...prev,
      pendingOperations: prev.pendingOperations.map(op =>
        op.id === operationId ? { ...op, ...updates } : op
      ),
    }));
  }, []);

  // ============================================================================
  // SYNC FUNCTIONALITY
  // ============================================================================

  const sync = useCallback(async () => {
    if (!state.isOnline || state.syncStatus === 'syncing') {
      return false;
    }

    setState(prev => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const operationsToSync = state.pendingOperations.filter(op => op.status === 'pending');
      
      if (operationsToSync.length === 0) {
        setState(prev => ({ 
          ...prev, 
          syncStatus: 'synced',
          lastSyncTime: new Date(),
        }));
        return true;
      }

      // Process operations in batches
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < operationsToSync.length; i += batchSize) {
        batches.push(operationsToSync.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await processBatch(batch);
      }

      setState(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncTime: new Date(),
      }));

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ ...prev, syncStatus: 'failed' }));
      return false;
    }
  }, [state.isOnline, state.syncStatus, state.pendingOperations]);

  const processBatch = async (operations: OfflineOperation[]) => {
    const promises = operations.map(async (operation) => {
      try {
        await processOperation(operation);
        
        // Mark operation as completed
        setState(prev => ({
          ...prev,
          pendingOperations: prev.pendingOperations.filter(op => op.id !== operation.id),
        }));
      } catch (error) {
        // Handle operation failure
        const updatedOperation = {
          ...operation,
          retryCount: operation.retryCount + 1,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        if (updatedOperation.retryCount >= retryAttempts) {
          // Move to conflicts if max retries reached
          const conflict: ConflictItem = {
            id: crypto.randomUUID(),
            resourceType: operation.resource,
            resourceId: operation.resourceId,
            localVersion: operation.data,
            remoteVersion: null,
            conflictFields: ['*'],
            timestamp: new Date(),
            isResolved: false,
          };

          setState(prev => ({
            ...prev,
            pendingOperations: prev.pendingOperations.filter(op => op.id !== operation.id),
            conflicts: [...prev.conflicts, conflict],
          }));
        } else {
          // Update operation for retry
          setState(prev => ({
            ...prev,
            pendingOperations: prev.pendingOperations.map(op =>
              op.id === operation.id ? updatedOperation : op
            ),
          }));
        }
      }
    });

    await Promise.allSettled(promises);
  };

  const processOperation = async (operation: OfflineOperation): Promise<void> => {
    const method = operation.type === 'create' ? 'POST' :
                  operation.type === 'update' ? 'PUT' :
                  operation.type === 'delete' ? 'DELETE' : 'GET';

    const response = await fetch(operation.resource, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle potential conflicts from server
    if (response.status === 409) {
      const conflictData = await response.json();
      const conflict: ConflictItem = {
        id: crypto.randomUUID(),
        resourceType: operation.resource,
        resourceId: operation.resourceId,
        localVersion: operation.data,
        remoteVersion: conflictData.remoteVersion,
        conflictFields: conflictData.conflictFields || ['*'],
        timestamp: new Date(),
        isResolved: false,
      };

      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflict],
      }));

      throw new Error('Conflict detected');
    }
  };

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote' | 'merge' | any) => {
    setState(prev => {
      const conflict = prev.conflicts.find(c => c.id === conflictId);
      if (!conflict) return prev;

      const resolvedConflict = {
        ...conflict,
        resolution: typeof resolution === 'string' ? resolution : 'manual',
        isResolved: true,
      };

      // Apply resolution logic based on strategy
      if (conflictStrategy === 'client' || resolution === 'local') {
        // Keep local version - re-add to pending operations
        const operation: OfflineOperation = {
          id: crypto.randomUUID(),
          type: 'update',
          resource: conflict.resourceType,
          resourceId: conflict.resourceId,
          data: conflict.localVersion,
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: retryAttempts,
          priority: 1,
          status: 'pending',
        };

        return {
          ...prev,
          conflicts: prev.conflicts.map(c => c.id === conflictId ? resolvedConflict : c),
          pendingOperations: [...prev.pendingOperations, operation],
        };
      } else if (resolution === 'remote') {
        // Accept server version - just mark as resolved
        return {
          ...prev,
          conflicts: prev.conflicts.map(c => c.id === conflictId ? resolvedConflict : c),
        };
      } else {
        // Manual or merge resolution
        return {
          ...prev,
          conflicts: prev.conflicts.map(c => c.id === conflictId ? resolvedConflict : c),
        };
      }
    });
  }, [conflictStrategy, retryAttempts]);

  const clearResolvedConflicts = useCallback(() => {
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(c => !c.isResolved),
    }));
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const forceSync = useCallback(async () => {
    return await sync();
  }, [sync]);

  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingOperations: [],
      syncQueue: [],
      conflicts: [],
    }));
  }, []);

  const getQueueStats = useCallback(() => {
    return {
      total: state.pendingOperations.length,
      pending: state.pendingOperations.filter(op => op.status === 'pending').length,
      failed: state.pendingOperations.filter(op => op.status === 'failed').length,
      conflicts: state.conflicts.filter(c => !c.isResolved).length,
    };
  }, [state.pendingOperations, state.conflicts]);

  return {
    // State
    syncStatus: state.syncStatus,
    pendingOperations: state.pendingOperations,
    syncQueue: state.syncQueue,
    conflicts: state.conflicts.filter(c => !c.isResolved),
    lastSyncTime: state.lastSyncTime,
    isOnline: state.isOnline,
    
    // Operations
    addOperation,
    removeOperation,
    updateOperation,
    
    // Sync
    sync: forceSync,
    
    // Conflicts
    resolveConflict,
    clearResolvedConflicts,
    
    // Utilities
    clearQueue,
    getQueueStats,
  };
}

export default useOfflineSync; 