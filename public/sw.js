// Minimal, low-risk service worker: its ONLY job is to serve a branded offline page when a
// page navigation fails because there's no network. It does NOT cache or intercept API calls,
// JS/CSS bundles, or images — those always go straight to the network exactly as they did
// before this file existed, so there's no risk of serving stale catalog/cart/auth data.
const CACHE_NAME = 'falsafahtot-shell-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [OFFLINE_URL, '/icons/icon-192-v2.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // let every other request behave exactly as before

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
