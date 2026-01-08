// Service Worker with Cache Versioning
// Ensures old cache is cleared when app updates

const CACHE_VERSION = 'v1.0.0'; // INCREMENT THIS ON EACH DEPLOYMENT
const CACHE_NAME = `aprendeai-${CACHE_VERSION}`;

// Resources to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  // Add critical assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force activation immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches except current version
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // API requests - Network First with cache fallback for offline support
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful API responses for offline access
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving cached API response:', request.url);
              return cachedResponse;
            }
            // No cache available, return error
            return new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache, but fetch update in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {
          // Network failed, cached version is still valid
        });
        
        return cachedResponse;
      }
      
      // Not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Cache successful responses (including HTML pages for offline navigation)
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed and not in cache - show offline page
        if (request.mode === 'navigate') {
          return caches.match('/offline').then((offlinePage) => {
            if (offlinePage) {
              return offlinePage;
            }
            // Fallback offline response
            return new Response(
              '<html><body><h1>Offline</h1><p>Você está offline. Algumas funcionalidades podem estar limitadas.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        }
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  // Sync queued game submissions when back online
  // This would integrate with IndexedDB queue
  console.log('[SW] Syncing offline game data');
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'AprendeAI';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
