const CACHE_NAME = 'mpcpl-chat-v1';
const STATIC_CACHE = 'mpcpl-static-v1';
const DYNAMIC_CACHE = 'mpcpl-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/sw.js',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/api/employees',
  '/api/messages'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // API requests - network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses for 5 minutes
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, then network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return cached page if network fails
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Enhanced Push Notification Handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const { title, body, icon, badge, tag, data: notificationData } = data;

  const notificationOptions = {
    body: body || 'New message received',
    icon: icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMwMGE4ODQiLz4KPHBhdGggZD0iTTEyIDI0SDE2VjIwSDEyVjI0Wk0yMCAyNEgyNFYyMEgyMFYyNFpNMjggMjRIMzJWMjBIMjhWMjRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    badge: badge || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMwMGE4ODQiLz4KPC9zdmc+',
    tag: tag || 'mpcpl-chat',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      ...notificationData
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title || 'MPCPL Chat', notificationOptions)
  );
});

// Enhanced Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(clientList => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(notificationData?.url || '/');
      }
    })
  );
});

// Sync event for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync pending messages, check for updates, etc.
    const response = await fetch('/api/sync', { method: 'POST' });
    return response.json();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
