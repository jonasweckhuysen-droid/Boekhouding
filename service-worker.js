const CACHE_NAME = "boekhouding-v3";

const FILES_TO_CACHE = [
  "/Boekhouding/",
  "/Boekhouding/index.html",
  "/Boekhouding/overzicht.html",
  "/Boekhouding/style.css",
  "/Boekhouding/script.js",
  "/Boekhouding/manifest.json",
  "/Boekhouding/icons/icon-192.png",
  "/Boekhouding/icons/icon-512.png"
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
  const url = event.request.url;

  // 🚫 Firebase & Google auth NOOIT cachen
  if (
    url.includes("google.com") ||
    url.includes("firebaseapp.com") ||
    url.includes("gstatic.com")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ App files wel cachen
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
