var APP_VERSION = '2.1.0';
var CACHE_NAME = 'ev-gravity-logger-v' + APP_VERSION;
var ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.json',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key.startsWith('ev-gravity-logger-') && key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      // Notify all open tabs about the update
      return self.clients.matchAll({ type: 'window' });
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Network-first, fallback to cache
  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful GET responses
      if (event.request.method === 'GET' && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
