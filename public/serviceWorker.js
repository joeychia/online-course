const CACHE_VERSION = '1.0.0';
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/favicon-96x96.png',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png',
  // Cache all JavaScript files
  '/assets/**/*.js',
  // Cache all CSS files
  '/assets/**/*.css'
];

// Check if URL should be cached based on file extension
const shouldCacheURL = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname === '/index.html' ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.css');
  } catch {
    return false;
  }
};

// Function to clean up old caches
const clearOldCaches = async () => {
  const cacheKeepList = [STATIC_CACHE];
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

// Check if URL is from allowed domains
const isAllowedDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'localhost' ||
      urlObj.hostname.endsWith('.web.app') ||
      urlObj.hostname === 'class.eccseattle.org'
    );
  } catch {
    return false;
  }
};

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const url = event.request.url;
      const shouldCache = isAllowedDomain(url) && shouldCacheURL(url);

      // For non-allowed domains, directly return network response without caching
      if (!shouldCache) {
        return fetch(event.request).catch(() => {
          console.log(`[ServiceWorker] Network request failed for non-allowed domain: ${url}`);
          throw new Error('Network request failed');
        });
      }

      // Try to get the response from cache first
      const cachedResponse = await caches.match(event.request);
      
      // Start the network request in the background
      const networkPromise = fetch(event.request).then(networkResponse => {
        // Clone the response early before using it
        const responseToCache = networkResponse.clone();
        
        // Cache successful GET responses for allowed file types
        if (networkResponse.ok && event.request.method === 'GET') {
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
            console.log(`[ServiceWorker] Updated cache for: ${url}`);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, already serving from cache if available
        console.log(`[ServiceWorker] Network request failed for: ${url}`);
        return null;
      });

      // Return cached response immediately if available
      if (cachedResponse) {
        console.log(`[ServiceWorker] Cache hit for: ${url}`);
        // Update cache in background
        event.waitUntil(networkPromise);
        return cachedResponse;
      }
      console.log(`[ServiceWorker] Cache miss for: ${url}`);

      // If no cache, wait for network response
      const response = await networkPromise;
      if (!response) {
        throw new Error('Both cache and network failed');
      }
      return response;
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