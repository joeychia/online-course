const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `online-course-v${CACHE_VERSION}-${new Date().toISOString().split('T')[0]}`;
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-144x144.png'
];

// Function to clean up old caches
const clearOldCaches = async () => {
  const cacheKeepList = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter(key => !cacheKeepList.includes(key));
  return Promise.all(cachesToDelete.map(key => caches.delete(key)));
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      console.log('Caching static assets');
      await staticCache.addAll(STATIC_ASSETS);
      // Immediately activate the new service worker
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Try to get the response from the static cache first
      const staticResponse = await caches.match(event.request, { cacheName: STATIC_CACHE });
      if (staticResponse) {
        return staticResponse;
      }

      try {
        // If not in static cache, try network
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses in the dynamic cache
        if (networkResponse.ok && event.request.method === 'GET') {
          const dynamicCache = await caches.open(DYNAMIC_CACHE);
          dynamicCache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // If network fails, try dynamic cache
        const cachedResponse = await caches.match(event.request, { cacheName: DYNAMIC_CACHE });
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear old caches
      await clearOldCaches();
      // Take control of all clients
      await self.clients.claim();
      console.log('Service Worker activated and controlling all clients');
    })()
  );
});

// Listen for version update messages
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});