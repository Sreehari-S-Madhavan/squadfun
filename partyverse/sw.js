const CACHE_NAME = 'partyverse-v1';
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './style.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/router.js',
  './js/storage.js',
  './js/ui.js',
  './js/randomizer.js',
  './js/scoring.js',
  './js/timer.js',
  './js/tournament.js',
  './js/screens/home.js',
  './js/screens/collection.js',
  './js/screens/game.js',
  './js/screens/scoreboard.js',
  './js/screens/settings.js',
  './js/screens/tournament.js',
  './js/games/registry.js',
  './js/games/charades.js',
  './js/games/imposter.js',
  './js/games/word-bomb.js',
  './js/games/snakes-ladders.js',
  './js/games/memory-match.js',
  './js/games/reaction-test.js',
  './js/games/quick-quiz.js',
  './js/games/rock-paper-scissors.js',
  './assets/icons/icon.svg',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch((err) => {
      console.warn('[SW] Cache addAll warning:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./offline.html') || caches.match('./index.html');
        }
        return caches.match('./offline.html');
      });
    })
  );
});
