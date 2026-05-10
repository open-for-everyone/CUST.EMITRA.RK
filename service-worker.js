const CACHE_NAME = 'rk-emitra-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) return res;

      return fetch(event.request)
        .then((response) => response)
        .catch(
          () =>
            new Response('Unable to load requested content while offline. Please try again later.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            })
        );
    })
  );
});
