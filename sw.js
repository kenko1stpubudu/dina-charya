/* දින චර්යා — offline service worker
   Bump CACHE when you change any file, otherwise phones keep the old copy. */
var CACHE = 'dina-charya-v7';

var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    var c = await caches.open(CACHE);
    // cache each file on its own so one missing icon can't break the whole install
    await Promise.all(ASSETS.map(function (u) {
      return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) {
      return k === CACHE ? null : caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith((async function () {
    var cached = await caches.match(req, { ignoreSearch: true });

    if (cached) {
      // serve instantly from cache, quietly refresh in the background
      fetch(req).then(function (r) {
        if (r && r.ok) caches.open(CACHE).then(function (c) { c.put(req, r.clone()); });
      }).catch(function () {});
      return cached;
    }

    try {
      var res = await fetch(req);
      if (res && res.ok) {
        var c = await caches.open(CACHE);
        c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        var idx = await caches.match('./index.html') || await caches.match('./');
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
