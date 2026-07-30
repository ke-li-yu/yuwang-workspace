const CACHE_NAME = 'yuwang-workspace-v6';
const ASSETS = [
  './huang-yingying-workspace.html',
  './assets/charts.js',
  './assets/materials.js',
  './_shared/js/echarts.min.js',
  './_shared/fonts/Outfit-Regular.ttf',
  './_shared/fonts/Outfit-Bold.ttf',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy: always fetch latest, fallback to cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Only cache successful basic responses
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Fallback to cache when network fails
      return caches.match(event.request);
    })
  );
});
