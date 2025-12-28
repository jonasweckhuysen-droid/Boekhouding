const CACHE_NAME = "boekhouding-v2";

const FILES_TO_CACHE = [
  "/Boekhouding/",
  "/Boekhouding/index.html",
  "/Boekhouding/overzicht.html",
  "/Boekhouding/style.css",
  "/Boekhouding/script.js",
  "/Boekhouding/manifest.json",
  "/Boekhouding/icons/icon-192.png",
  "/Boekhouding/icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
