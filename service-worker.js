// Cache scoped to Kotoba Drive. Do not delete caches of unrelated apps hosted on github.io.
const CACHE_PREFIX = 'kotoba-drive-';
const CACHE_NAME = 'kotoba-drive-2026-10-13-v3';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) {const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));}
      return response;
    }).catch(() => caches.match(event.request).then(response => response || caches.match('./index.html'))));
  } else {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));}
      return response;
    })));
  }
});
