// Service Worker for Mobile PWA - Story 5.5
// Implements offline functionality and caching strategies

const CACHE_NAME = 'himaya-cms-v1'
const OFFLINE_CACHE = 'himaya-offline-v1'
const CONTENT_CACHE = 'himaya-content-v1'
const IMAGES_CACHE = 'himaya-images-v1'
const NOTIFICATION_CACHE = 'himaya-notifications-v1'

// Assets to cache on service worker installation
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Routes that should work offline
const OFFLINE_FALLBACK_PAGE = '/offline'

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== CONTENT_CACHE && 
                cacheName !== IMAGES_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Handle different types of requests with appropriate strategies
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
  } else if (url.pathname.startsWith('/articles/')) {
    event.respondWith(handleContentRequest(request))
  } else {
    event.respondWith(handleNavigationRequest(request))
  }
})

// Image caching strategy - Cache first with network fallback
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGES_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Return cached image and update in background
      updateImageInBackground(request, cache)
      return cachedResponse
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Image request failed:', error)
    // Return placeholder image or offline fallback
    return new Response('', { status: 204 })
  }
}

// API requests - Network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request, {
      headers: {
        ...request.headers,
        'Cache-Control': 'no-cache'
      }
    })
    
    if (networkResponse.ok) {
      const cache = await caches.open(CONTENT_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache for API request')
    const cache = await caches.open(CONTENT_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API failures
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'This content is not available offline' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Content requests - Stale while revalidate
async function handleContentRequest(request) {
  const cache = await caches.open(CONTENT_CACHE)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => null)
  
  // Return cached content immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Otherwise wait for network
  return fetchPromise || getOfflinePage()
}

// Navigation requests - Cache first with network fallback
async function handleNavigationRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Return cached page and update in background
      updatePageInBackground(request, cache)
      return cachedResponse
    }
    
    // Fetch from network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Navigation request failed, serving offline page')
    return getOfflinePage()
  }
}

// Background update functions
async function updateImageInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
  } catch (error) {
    console.log('Background image update failed:', error)
  }
}

async function updatePageInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
  } catch (error) {
    console.log('Background page update failed:', error)
  }
}

// Get offline fallback page
async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME)
  const offlinePage = await cache.match(OFFLINE_FALLBACK_PAGE)
  
  if (offlinePage) {
    return offlinePage
  }
  
  // Return basic offline response if no offline page is cached
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - Himaya CMS</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .offline-message { max-width: 400px; margin: 0 auto; }
        .icon { font-size: 48px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>This page is not available offline. Please check your internet connection and try again.</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received')
  
  const options = {
    body: 'You have new content to read!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  if (event.data) {
    const pushData = event.data.json()
    options.body = pushData.body || options.body
    options.data.url = pushData.url || options.data.url
  }
  
  event.waitUntil(
    self.registration.showNotification('Himaya CMS', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync())
  }
})

// Background sync implementation
async function performBackgroundSync() {
  try {
    // Sync any pending data when back online
    console.log('Performing background sync...')
    
    // Example: Send queued analytics data
    const queuedData = await getQueuedData()
    for (const data of queuedData) {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('Failed to sync data:', error)
      }
    }
    
    console.log('Background sync completed')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Helper function to get queued data (placeholder)
async function getQueuedData() {
  // In a real implementation, this would retrieve data from IndexedDB
  return []
}

// Handle app update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
}) 

// Push Notifications with Rich Media Support - integrated with existing cache structure

// Assets to cache for rich notifications
const NOTIFICATION_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/icons/article-icon.png',
  '/icons/comment-icon.png',
  '/icons/system-icon.png',
  '/icons/digest-icon.png',
  '/icons/promotion-icon.png',
  '/sounds/notification.mp3',
  '/sounds/urgent.mp3',
];

// Install event - cache notification assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(NOTIFICATION_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching notification assets');
        return cache.addAll(NOTIFICATION_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (!event.data) {
    console.log('Service Worker: Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Service Worker: Push payload received', payload);

    event.waitUntil(
      handlePushNotification(payload)
    );
  } catch (error) {
    console.error('Service Worker: Error parsing push payload', error);
  }
});

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  event.waitUntil(
    handleNotificationClick(action, data, notification)
  );
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event);
  
  const notification = event.notification;
  const data = notification.data || {};

  // Track dismissal
  if (data.notificationId) {
    trackNotificationInteraction(data.notificationId, 'dismissed');
  }
});

// Handle push notification display
async function handlePushNotification(payload) {
  const {
    title,
    body,
    icon,
    badge,
    image,
    tag,
    data = {},
    actions = [],
    requireInteraction = false,
    silent = false,
    vibrate,
    timestamp
  } = payload;

  // Prepare notification options
  const notificationOptions = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag: tag || 'default',
    data: {
      ...data,
      timestamp: timestamp || Date.now(),
    },
    requireInteraction,
    silent,
    renotify: true,
    actions: await prepareNotificationActions(actions),
  };

  // Add image if provided and supported
  if (image) {
    try {
      const imageResponse = await fetch(image);
      if (imageResponse.ok) {
        notificationOptions.image = image;
      }
    } catch (error) {
      console.warn('Service Worker: Failed to load notification image', error);
    }
  }

  // Add vibration pattern if supported and provided
  if (vibrate && 'vibrate' in navigator) {
    notificationOptions.vibrate = vibrate;
  }

  // Handle rich notification features
  await enhanceNotificationWithRichContent(notificationOptions);

  // Show the notification
  try {
    await self.registration.showNotification(title, notificationOptions);
    
    // Track delivery
    if (data.notificationId) {
      await trackNotificationInteraction(data.notificationId, 'received');
    }
    
    console.log('Service Worker: Notification displayed successfully');
  } catch (error) {
    console.error('Service Worker: Failed to show notification', error);
  }
}

// Prepare notification actions with proper icons
async function prepareNotificationActions(actions) {
  if (!actions || actions.length === 0) {
    return [];
  }

  const preparedActions = [];
  
  for (const action of actions.slice(0, 2)) { // Maximum 2 actions on most platforms
    const preparedAction = {
      action: action.action,
      title: action.title,
    };

    // Add icon if provided and accessible
    if (action.icon) {
      try {
        const iconResponse = await fetch(action.icon);
        if (iconResponse.ok) {
          preparedAction.icon = action.icon;
        }
      } catch (error) {
        console.warn('Service Worker: Failed to load action icon', error);
      }
    }

    preparedActions.push(preparedAction);
  }

  return preparedActions;
}

// Enhance notification with rich content features
async function enhanceNotificationWithRichContent(options) {
  const { data } = options;

  // Add notification sound based on category
  if (data.category && !options.silent) {
    const soundMap = {
      'system': '/sounds/urgent.mp3',
      'article': '/sounds/notification.mp3',
      'comment': '/sounds/notification.mp3',
      'marketing': '/sounds/notification.mp3',
      'engagement': '/sounds/notification.mp3',
    };

    const soundUrl = soundMap[data.category];
    if (soundUrl) {
      try {
        // Cache the sound for offline use
        const cache = await caches.open(NOTIFICATION_CACHE);
        await cache.add(soundUrl);
      } catch (error) {
        console.warn('Service Worker: Failed to cache notification sound', error);
      }
    }
  }

  // Add progress indicator for ongoing notifications
  if (data.type === 'progress') {
    options.tag = `progress-${data.progressId}`;
    options.renotify = true;
    
    if (data.progress !== undefined) {
      options.body = `${options.body} (${data.progress}%)`;
    }
  }

  // Add expanded content for big text style
  if (data.expandedContent) {
    options.body = data.expandedContent;
  }

  // Handle grouped notifications
  if (data.groupKey) {
    options.tag = data.groupKey;
    
    // Check for existing notifications in the same group
    const existingNotifications = await self.registration.getNotifications({
      tag: data.groupKey
    });
    
    if (existingNotifications.length > 0) {
      // Update group summary
      const groupCount = existingNotifications.length + 1;
      options.body = `${groupCount} new notifications`;
      options.data.isGroupSummary = true;
    }
  }

  return options;
}

// Handle notification click actions
async function handleNotificationClick(action, data, notification) {
  let targetUrl = data.url || '/';
  let shouldOpenWindow = true;

  // Handle specific actions
  switch (action) {
    case 'read':
    case 'view':
      targetUrl = data.url || '/';
      break;
      
    case 'reply':
      targetUrl = data.replyUrl || `${data.url}#reply`;
      break;
      
    case 'bookmark':
      await handleBookmarkAction(data);
      shouldOpenWindow = false;
      break;
      
    case 'dismiss':
    case 'not_interested':
      shouldOpenWindow = false;
      break;
      
    case 'snooze':
      await handleSnoozeAction(data);
      shouldOpenWindow = false;
      break;
      
    case 'like':
      await handleLikeAction(data);
      shouldOpenWindow = false;
      break;
      
    default:
      // Default click (no specific action)
      if (!action && data.url) {
        targetUrl = data.url;
      }
      break;
  }

  // Track the interaction
  if (data.notificationId) {
    const trackingAction = action ? 'action_clicked' : 'clicked';
    await trackNotificationInteraction(
      data.notificationId, 
      trackingAction, 
      action
    );
  }

  // Open or focus window if needed
  if (shouldOpenWindow) {
    await openOrFocusWindow(targetUrl);
  }

  // Show feedback notification for actions
  if (action && !shouldOpenWindow) {
    await showActionFeedback(action, data);
  }
}

// Handle bookmark action
async function handleBookmarkAction(data) {
  try {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: data.url,
        title: data.title,
        notificationId: data.notificationId,
      }),
    });

    if (response.ok) {
      console.log('Service Worker: Bookmark saved successfully');
    } else {
      throw new Error('Failed to save bookmark');
    }
  } catch (error) {
    console.error('Service Worker: Failed to save bookmark', error);
  }
}

// Handle snooze action
async function handleSnoozeAction(data) {
  try {
    const snoozeMinutes = data.snoozeMinutes || 60; // Default 1 hour
    const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    
    const response = await fetch('/api/notifications/snooze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: data.notificationId,
        snoozeUntil: snoozeUntil.toISOString(),
      }),
    });

    if (response.ok) {
      console.log('Service Worker: Notification snoozed successfully');
    } else {
      throw new Error('Failed to snooze notification');
    }
  } catch (error) {
    console.error('Service Worker: Failed to snooze notification', error);
  }
}

// Handle like action
async function handleLikeAction(data) {
  try {
    const response = await fetch('/api/content/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId: data.contentId,
        contentType: data.contentType,
        notificationId: data.notificationId,
      }),
    });

    if (response.ok) {
      console.log('Service Worker: Like action successful');
    } else {
      throw new Error('Failed to process like action');
    }
  } catch (error) {
    console.error('Service Worker: Failed to process like action', error);
  }
}

// Show action feedback notification
async function showActionFeedback(action, data) {
  const feedbackMessages = {
    bookmark: 'Bookmarked successfully!',
    snooze: 'Notification snoozed for 1 hour',
    like: 'Liked!',
    dismiss: 'Notification dismissed',
    not_interested: 'We\'ll show fewer notifications like this',
  };

  const message = feedbackMessages[action];
  if (!message) return;

  try {
    await self.registration.showNotification('Action Completed', {
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'action-feedback',
      silent: true,
      data: {
        type: 'feedback',
        originalNotificationId: data.notificationId,
      },
    });

    // Auto-close feedback notification after 3 seconds
    setTimeout(async () => {
      const notifications = await self.registration.getNotifications({
        tag: 'action-feedback'
      });
      notifications.forEach(notification => notification.close());
    }, 3000);
  } catch (error) {
    console.error('Service Worker: Failed to show feedback notification', error);
  }
}

// Open or focus existing window
async function openOrFocusWindow(targetUrl) {
  try {
    // Get all window clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    // Check if any client has the target URL
    for (const client of clients) {
      if (client.url === targetUrl && 'focus' in client) {
        return client.focus();
      }
    }

    // If no matching client found, open new window
    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  } catch (error) {
    console.error('Service Worker: Failed to open/focus window', error);
  }
}

// Track notification interactions
async function trackNotificationInteraction(notificationId, action, actionId = null) {
  try {
    const trackingData = {
      notificationId,
      action,
      actionId,
      timestamp: new Date().toISOString(),
      userAgent: self.navigator.userAgent,
      platform: self.navigator.platform,
    };

    // Send to analytics endpoint
    await fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });

    console.log('Service Worker: Interaction tracked', trackingData);
  } catch (error) {
    console.error('Service Worker: Failed to track interaction', error);
    
    // Store for retry if network is unavailable
    try {
      const cache = await caches.open('tracking-queue');
      await cache.put(
        `/tracking/${Date.now()}-${Math.random()}`,
        new Response(JSON.stringify({
          notificationId,
          action,
          actionId,
          timestamp: new Date().toISOString(),
        }))
      );
    } catch (cacheError) {
      console.error('Service Worker: Failed to cache tracking data', cacheError);
    }
  }
}

// Background sync for tracking data
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-tracking') {
    event.waitUntil(retryFailedTracking());
  }
});

// Retry failed tracking data
async function retryFailedTracking() {
  try {
    const cache = await caches.open('tracking-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const trackingData = await response.json();
        
        // Retry sending tracking data
        const retryResponse = await fetch('/api/notifications/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData),
        });

        if (retryResponse.ok) {
          // Remove from cache if successful
          await cache.delete(request);
          console.log('Service Worker: Retried tracking successful');
        }
      } catch (error) {
        console.error('Service Worker: Retry tracking failed', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to retry tracking', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'GET_NOTIFICATION_PERMISSION':
      event.ports[0].postMessage({
        permission: Notification.permission,
      });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      clearAllNotifications();
      break;
      
    case 'UPDATE_BADGE_COUNT':
      updateBadgeCount(payload.count);
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

// Clear all notifications
async function clearAllNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(notification => notification.close());
    console.log('Service Worker: Cleared all notifications');
  } catch (error) {
    console.error('Service Worker: Failed to clear notifications', error);
  }
}

// Update badge count (if supported)
async function updateBadgeCount(count) {
  try {
    if ('setAppBadge' in navigator) {
      await navigator.setAppBadge(count);
    }
  } catch (error) {
    console.error('Service Worker: Failed to update badge count', error);
  }
}

console.log('Service Worker: Loaded successfully'); 