const CACHE_NAME = 'rk-emitra-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) return res;

      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return new Response('<h1>Offline</h1><p>Unable to load this page while offline.</p>', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        return new Response('Unable to load requested content while offline. Please try again later.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
