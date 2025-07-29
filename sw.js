const CACHE_NAME = 'hjmops-cache-v1';
// List of core assets to cache for offline use.  When adding new assets such
// as additional scripts or pages be sure to update this list.  The root
// entry ('/') is included to handle navigation requests properly.
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache first.
      if (response) {
        return response;
      }
      // Otherwise fetch from network and cache a copy of the response if valid.
      return fetch(event.request)
        .then(res => {
          // Only cache valid responses (status 200 and basic).  Opaque
          // responses (like third‑party requests) are not cached.
          if (
            res &&
            res.status === 200 &&
            res.type === 'basic'
          ) {
            const responseToCache = res.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return res;
        })
        .catch(() => {
          // If network fetch fails, serve the cached root page as a fallback.
          return caches.match('/');
        });
    })
  );
});