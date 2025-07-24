// ============================================================================
// SERVICE WORKER IMPLEMENTATION
// ============================================================================

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { 
  CacheStrategy, 
  CacheStrategyConfig, 
  BackgroundSyncConfig,
  PushNotificationConfig,
  OfflineOperation,
  ServiceWorkerConfig 
} from '../mobile/types/mobile.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SW_VERSION = '1.0.0';
const CACHE_PREFIX = 'master-cms-v';
const STATIC_CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}-dynamic`;
const API_CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}-api`;
const IMAGES_CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}-images`;

const DEFAULT_CONFIG: ServiceWorkerConfig = {
  version: SW_VERSION,
  scope: '/',
  cacheStrategies: [
    {
      name: 'static-assets',
      strategy: 'cache_first',
      urlPattern: '\\.(js|css|html|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$',
      cacheName: STATIC_CACHE_NAME,
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
    {
      name: 'api-calls',
      strategy: 'network_first',
      urlPattern: '/api/',
      cacheName: API_CACHE_NAME,
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minutes
      networkTimeoutSeconds: 10,
    },
    {
      name: 'images',
      strategy: 'cache_first',
      urlPattern: '\\.(png|jpg|jpeg|gif|webp|svg)$',
      cacheName: IMAGES_CACHE_NAME,
      maxEntries: 200,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    },
    {
      name: 'pages',
      strategy: 'stale_while_revalidate',
      urlPattern: '/',
      cacheName: DYNAMIC_CACHE_NAME,
      maxEntries: 30,
      maxAgeSeconds: 24 * 60 * 60, // 1 day
    },
  ],
  backgroundSync: {
    enabled: true,
    syncTag: 'background-sync',
    maxRetryTime: 24 * 60 * 60 * 1000,
    minSyncInterval: 5 * 60 * 1000,
    syncOnNetworkReconnect: true,
    powerConstraints: true,
  },
  pushNotifications: {
    enabled: true,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    userVisibleOnly: true,
    applicationServerKey: '',
    actions: [
      { action: 'view', title: 'View', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
    ],
    badge: '/icons/badge.png',
    icon: '/icons/notification.png',
    silent: false,
    renotify: false,
    requireInteraction: false,
    ttl: 24 * 60 * 60, // 24 hours
  },
  updatePolicy: 'on_next_visit',
  skipWaiting: false,
  clientsClaim: true,
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

let config = DEFAULT_CONFIG;
let isOnline = true;
let syncQueue: OfflineOperation[] = [];
let retryTimeouts = new Map<string, number>();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const log = (message: string, data?: any) => {
  console.log(`[SW ${SW_VERSION}] ${message}`, data || '');
};

const isUrlMatching = (url: string, pattern: string): boolean => {
  const regex = new RegExp(pattern);
  return regex.test(url);
};

const getCacheNameForUrl = (url: string): string => {
  for (const strategy of config.cacheStrategies) {
    if (isUrlMatching(url, strategy.urlPattern)) {
      return strategy.cacheName;
    }
  }
  return DYNAMIC_CACHE_NAME;
};

const getStrategyForUrl = (url: string): CacheStrategyConfig | null => {
  for (const strategy of config.cacheStrategies) {
    if (isUrlMatching(url, strategy.urlPattern)) {
      return strategy;
    }
  }
  return null;
};

const cleanupCache = async (cacheName: string, maxEntries: number, maxAge: number) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // Remove old entries
  const now = Date.now();
  const expiredKeys = [];
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const dateHeader = response.headers.get('date');
      const cacheDate = dateHeader ? new Date(dateHeader).getTime() : 0;
      
      if (now - cacheDate > maxAge * 1000) {
        expiredKeys.push(key);
      }
    }
  }
  
  // Remove expired entries
  for (const key of expiredKeys) {
    await cache.delete(key);
  }
  
  // Remove excess entries (keep most recent)
  const remainingKeys = await cache.keys();
  if (remainingKeys.length > maxEntries) {
    const keysToRemove = remainingKeys.slice(0, remainingKeys.length - maxEntries);
    for (const key of keysToRemove) {
      await cache.delete(key);
    }
  }
};

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

const cacheFirst = async (request: Request, strategy: CacheStrategyConfig): Promise<Response> => {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached response and update in background
    fetch(request).then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignore network errors when updating cache
    });
    
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    const offlineResponse = await cache.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    throw error;
  }
};

const networkFirst = async (request: Request, strategy: CacheStrategyConfig): Promise<Response> => {
  const cache = await caches.open(strategy.cacheName);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(), 
      (strategy.networkTimeoutSeconds || 10) * 1000
    );
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try cache fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Queue for background sync if it's a write operation
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      await queueForBackgroundSync(request);
    }
    
    throw error;
  }
};

const cacheOnly = async (request: Request, strategy: CacheStrategyConfig): Promise<Response> => {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    throw new Error('No cached response available');
  }
  
  return cachedResponse;
};

const networkOnly = async (request: Request): Promise<Response> => {
  return fetch(request);
};

const staleWhileRevalidate = async (request: Request, strategy: CacheStrategyConfig): Promise<Response> => {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore network errors
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network response
  return fetchPromise;
};

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

const queueForBackgroundSync = async (request: Request) => {
  if (!config.backgroundSync.enabled) return;
  
  const operation: OfflineOperation = {
    id: crypto.randomUUID(),
    type: 'update',
    resource: request.url,
    resourceId: '',
    data: await request.clone().json().catch(() => ({})),
    timestamp: new Date(),
    retryCount: 0,
    maxRetries: 5,
    priority: 1,
    status: 'pending',
  };
  
  syncQueue.push(operation);
  
  // Store in IndexedDB for persistence
  try {
    const db = await openSyncDatabase();
    const tx = db.transaction(['syncQueue'], 'readwrite');
    tx.objectStore('syncQueue').add(operation);
  } catch (error) {
    log('Failed to store sync operation', error);
  }
  
  // Register for background sync
  await self.registration.sync.register(config.backgroundSync.syncTag);
};

const openSyncDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('master-cms-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('status', 'status');
      }
    };
  });
};

const processSyncQueue = async () => {
  if (!isOnline || syncQueue.length === 0) return;
  
  log(`Processing ${syncQueue.length} sync operations`);
  
  const operations = [...syncQueue];
  syncQueue = [];
  
  for (const operation of operations) {
    try {
      await processOperation(operation);
      log(`Sync operation completed: ${operation.id}`);
    } catch (error) {
      operation.retryCount++;
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (operation.retryCount < operation.maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, operation.retryCount), 60000);
        retryTimeouts.set(operation.id, setTimeout(() => {
          syncQueue.push(operation);
          retryTimeouts.delete(operation.id);
        }, delay));
      } else {
        log(`Sync operation failed permanently: ${operation.id}`, error);
      }
    }
  }
};

const processOperation = async (operation: OfflineOperation): Promise<void> => {
  const request = new Request(operation.resource, {
    method: operation.type === 'create' ? 'POST' : 
           operation.type === 'update' ? 'PUT' : 
           operation.type === 'delete' ? 'DELETE' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined,
  });
  
  const response = await fetch(request);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  operation.status = 'completed';
};

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

const showNotification = async (data: any) => {
  const options = {
    body: data.body || '',
    icon: config.pushNotifications.icon,
    badge: config.pushNotifications.badge,
    image: data.image,
    data: data.data || {},
    actions: config.pushNotifications.actions,
    tag: data.tag,
    renotify: config.pushNotifications.renotify,
    requireInteraction: config.pushNotifications.requireInteraction,
    silent: config.pushNotifications.silent,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now(),
  };
  
  await self.registration.showNotification(data.title || 'Notification', options);
};

const handleNotificationClick = async (event: NotificationEvent) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  // Handle different notification actions
  switch (action) {
    case 'view':
      await openClientWindow(data.url || '/');
      break;
    case 'reply':
      await openClientWindow(`/messages/reply/${data.messageId}`);
      break;
    case 'dismiss':
      // Just close notification
      break;
    default:
      await openClientWindow(data.url || '/');
  }
  
  // Track notification interaction
  await trackNotificationInteraction(event.notification.tag, action);
};

const openClientWindow = async (url: string) => {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // Try to focus existing window
  for (const client of clients) {
    if (client.url.includes(url) && 'focus' in client) {
      return client.focus();
    }
  }
  
  // Open new window
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
};

const trackNotificationInteraction = async (tag: string, action: string) => {
  try {
    await fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, action, timestamp: Date.now() }),
    });
  } catch (error) {
    log('Failed to track notification interaction', error);
  }
};

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Installation
self.addEventListener('install', (event) => {
  log('Service Worker installing');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        return cache.addAll([
          '/',
          '/offline.html',
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png',
        ]);
      })
      .then(() => {
        log('Service Worker installed successfully');
        if (config.skipWaiting) {
          return self.skipWaiting();
        }
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  log('Service Worker activating');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith(CACHE_PREFIX) && 
                     !cacheName.includes(SW_VERSION);
            })
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      
      // Claim clients
      config.clientsClaim ? self.clients.claim() : Promise.resolve(),
    ]).then(() => {
      log('Service Worker activated successfully');
    })
  );
});

// Fetch handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for navigation
  if (request.method !== 'GET' && request.mode === 'navigate') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  const strategy = getStrategyForUrl(request.url);
  
  if (!strategy) {
    // Default to network first for unmatched requests
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html') || new Response('Offline');
      })
    );
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        switch (strategy.strategy) {
          case 'cache_first':
            return await cacheFirst(request, strategy);
          case 'network_first':
            return await networkFirst(request, strategy);
          case 'cache_only':
            return await cacheOnly(request, strategy);
          case 'network_only':
            return await networkOnly(request);
          case 'stale_while_revalidate':
            return await staleWhileRevalidate(request, strategy);
          default:
            return await fetch(request);
        }
      } catch (error) {
        log('Fetch failed', { url: request.url, error });
        
        // Return offline fallback
        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match('/offline.html');
          if (offlineResponse) {
            return offlineResponse;
          }
        }
        
        throw error;
      }
    })()
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  log(`Background sync triggered: ${event.tag}`);
  
  if (event.tag === config.backgroundSync.syncTag) {
    event.waitUntil(processSyncQueue());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  log('Push notification received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    event.waitUntil(showNotification(data));
  } catch (error) {
    log('Failed to parse push notification data', error);
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  log('Notification clicked', { action: event.action, tag: event.notification.tag });
  event.waitUntil(handleNotificationClick(event));
});

// Network status changes
self.addEventListener('online', () => {
  log('Network status: online');
  isOnline = true;
  processSyncQueue();
});

self.addEventListener('offline', () => {
  log('Network status: offline');
  isOnline = false;
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  log(`Periodic sync triggered: ${event.tag}`);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Message handling for configuration updates
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_CONFIG':
      config = { ...config, ...data };
      log('Service Worker configuration updated', config);
      break;
      
    case 'FORCE_SYNC':
      processSyncQueue();
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      });
      break;
      
    case 'GET_SYNC_STATUS':
      event.ports[0].postMessage({
        queueLength: syncQueue.length,
        isOnline,
        version: SW_VERSION,
      });
      break;
  }
});

// Cache cleanup on storage pressure
setInterval(() => {
  config.cacheStrategies.forEach(strategy => {
    if (strategy.maxEntries && strategy.maxAgeSeconds) {
      cleanupCache(strategy.cacheName, strategy.maxEntries, strategy.maxAgeSeconds);
    }
  });
}, 60 * 60 * 1000); // Run every hour

log('Service Worker script loaded');

export {}; 