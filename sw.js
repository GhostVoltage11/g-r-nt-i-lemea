const CACHE_NAME = 'pano-excel-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// App shell (HTML/CSS/JS/ikonlar): önce cache, sonra ağ.
// Gemini API çağrıları (generativelanguage.googleapis.com) her zaman ağdan gider, asla cache'lenmez.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('generativelanguage.googleapis.com')) {
    return; // API isteklerine dokunma
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      }).catch(() => cached);
    })
  );
});
