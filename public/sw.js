// Think Tank Technologies Installation Scheduler - Service Worker
// Progressive Web App implementation with offline capabilities

const CACHE_NAME = 'ttt-scheduler-v1';
const RUNTIME_CACHE = 'ttt-scheduler-runtime';

// Cache strategy configurations
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Resources to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Route patterns and their caching strategies
const ROUTE_CACHE_STRATEGIES = [
  {
    pattern: /\.(js|css|html)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: CACHE_NAME
  },
  {
    pattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: `${CACHE_NAME}-images`,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  {
    pattern: /\/api\/installations/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: `${CACHE_NAME}-installations`,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  {
    pattern: /\/api\/assignments/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: `${CACHE_NAME}-assignments`,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  {
    pattern: /\/api\/team/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: `${CACHE_NAME}-team`,
    maxAge: 10 * 60 * 1000, // 10 minutes
    maxEntries: 30
  }
];

// Background sync tags
const SYNC_TAGS = {
  INSTALLATION_SYNC: 'installation-sync',
  ASSIGNMENT_SYNC: 'assignment-sync',
  TEAM_SYNC: 'team-sync',
  ANALYTICS_SYNC: 'analytics-sync'
};

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Static resources cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        const deletePromises = cacheNames
          .filter(cacheName => cacheName.startsWith('ttt-scheduler-') && cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          });
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('Old caches cleaned up');
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Failed to clean up old caches:', error);
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Find matching route strategy
  const routeConfig = ROUTE_CACHE_STRATEGIES.find(config => 
    config.pattern.test(request.url)
  );

  if (routeConfig) {
    event.respondWith(
      handleRequest(request, routeConfig)
    );
  } else {
    // Default strategy for unmatched routes
    event.respondWith(
      handleRequest(request, {
        strategy: CACHE_STRATEGIES.NETWORK_FIRST,
        cacheName: RUNTIME_CACHE
      })
    );
  }
});

// Handle different caching strategies
async function handleRequest(request, config) {
  const { strategy, cacheName, maxAge, maxEntries } = config;
  
  try {
    switch (strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request, cacheName, maxAge, maxEntries);
        
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request, cacheName, maxAge, maxEntries);
        
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidate(request, cacheName, maxAge, maxEntries);
        
      case CACHE_STRATEGIES.NETWORK_ONLY:
        return await fetch(request);
        
      case CACHE_STRATEGIES.CACHE_ONLY:
        return await cacheOnly(request, cacheName);
        
      default:
        return await networkFirst(request, cacheName, maxAge, maxEntries);
    }
  } catch (error) {
    console.error('Request handling failed:', error);
    return await handleOfflineFallback(request);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still fresh
    if (maxAge && isCacheExpired(cachedResponse, maxAge)) {
      // Cache expired, try network
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          await updateCache(cache, request, networkResponse.clone(), maxEntries);
        }
        return networkResponse;
      } catch {
        // Network failed, return stale cache
        return cachedResponse;
      }
    }
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    await updateCache(cache, request, networkResponse.clone(), maxEntries);
  }
  return networkResponse;
}

// Network First strategy
async function networkFirst(request, cacheName, maxAge, maxEntries) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await updateCache(cache, request, networkResponse.clone(), maxEntries);
    }
    return networkResponse;
  } catch {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available, return offline fallback
    throw new Error('Network failed and no cache available');
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        updateCache(cache, request, response.clone(), maxEntries);
      }
      return response;
    })
    .catch(error => {
      console.error('Background fetch failed:', error);
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // No cache, wait for network
  return await networkResponsePromise;
}

// Cache Only strategy
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  throw new Error('Resource not in cache');
}

// Update cache with size and age limits
async function updateCache(cache, request, response, maxEntries) {
  // Add timestamp to response headers for expiry checking
  const responseToCache = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cache-timestamp': Date.now().toString()
    }
  });
  
  await cache.put(request, responseToCache);
  
  // Enforce cache size limit
  if (maxEntries) {
    await enforceCacheSizeLimit(cache, maxEntries);
  }
}

// Check if cached response has expired
function isCacheExpired(response, maxAge) {
  const cacheTimestamp = response.headers.get('sw-cache-timestamp');
  if (!cacheTimestamp) return false;
  
  const age = Date.now() - parseInt(cacheTimestamp);
  return age > maxAge;
}

// Enforce cache size limit by removing oldest entries
async function enforceCacheSizeLimit(cache, maxEntries) {
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    const entriesToDelete = keys.length - maxEntries;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For HTML pages, return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // For API requests, return cached data or error response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request requires an internet connection',
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Generic offline response
  return new Response('Offline', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Background sync event
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.INSTALLATION_SYNC:
      event.waitUntil(syncInstallations());
      break;
      
    case SYNC_TAGS.ASSIGNMENT_SYNC:
      event.waitUntil(syncAssignments());
      break;
      
    case SYNC_TAGS.TEAM_SYNC:
      event.waitUntil(syncTeamData());
      break;
      
    case SYNC_TAGS.ANALYTICS_SYNC:
      event.waitUntil(syncAnalytics());
      break;
      
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Sync functions
async function syncInstallations() {
  try {
    console.log('Syncing installations...');
    
    // Get pending installation updates from IndexedDB
    const pendingUpdates = await getPendingUpdates('installations');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/installations/${update.id}`, {
          method: update.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removePendingUpdate('installations', update.id);
          console.log('Installation synced:', update.id);
        }
      } catch (error) {
        console.error('Failed to sync installation:', update.id, error);
      }
    }
    
    console.log('Installation sync completed');
  } catch (error) {
    console.error('Installation sync failed:', error);
  }
}

async function syncAssignments() {
  try {
    console.log('Syncing assignments...');
    
    const pendingUpdates = await getPendingUpdates('assignments');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/assignments/${update.id}`, {
          method: update.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removePendingUpdate('assignments', update.id);
          console.log('Assignment synced:', update.id);
        }
      } catch (error) {
        console.error('Failed to sync assignment:', update.id, error);
      }
    }
    
    console.log('Assignment sync completed');
  } catch (error) {
    console.error('Assignment sync failed:', error);
  }
}

async function syncTeamData() {
  try {
    console.log('Syncing team data...');
    
    const pendingUpdates = await getPendingUpdates('team');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/team/${update.id}`, {
          method: update.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removePendingUpdate('team', update.id);
          console.log('Team member synced:', update.id);
        }
      } catch (error) {
        console.error('Failed to sync team member:', update.id, error);
      }
    }
    
    console.log('Team data sync completed');
  } catch (error) {
    console.error('Team data sync failed:', error);
  }
}

async function syncAnalytics() {
  try {
    console.log('Syncing analytics...');
    
    const pendingAnalytics = await getPendingUpdates('analytics');
    
    for (const analytics of pendingAnalytics) {
      try {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analytics.data)
        });
        
        if (response.ok) {
          await removePendingUpdate('analytics', analytics.id);
          console.log('Analytics synced:', analytics.id);
        }
      } catch (error) {
        console.error('Failed to sync analytics:', analytics.id, error);
      }
    }
    
    console.log('Analytics sync completed');
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// IndexedDB operations for offline storage
async function getPendingUpdates(store) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ttt-scheduler-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const getAllRequest = objectStore.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath: 'id' });
      }
    };
  });
}

async function removePendingUpdate(store, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ttt-scheduler-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const deleteRequest = objectStore.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification event
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Failed to parse push data:', error);
      data = { title: 'Notification', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'You have a new update',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'default',
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Think Tank Scheduler', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let targetUrl = '/';
  
  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        targetUrl = notificationData.url || '/';
        break;
      case 'dismiss':
        return; // Just close notification
      default:
        targetUrl = '/';
    }
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(error => event.ports[0].postMessage({ error: error.message }));
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls)
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(error => event.ports[0].postMessage({ error: error.message }));
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Utility functions
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames
    .filter(name => name.startsWith('ttt-scheduler-'))
    .map(name => caches.delete(name));
  
  await Promise.all(deletePromises);
  console.log('All caches cleared');
}

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(urls);
  console.log('URLs cached:', urls);
}

console.log('Service Worker initialized:', CACHE_NAME);