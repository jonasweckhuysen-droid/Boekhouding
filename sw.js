self.addEventListener('install', event => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open('boekhouding-v1').then(cache => cache.addAll([
      '/Boekhouding/index.html',
      '/Boekhouding/main.js',
      '/Boekhouding/styles.css',
      '/Boekhouding/icons/icon-192.png',
      '/Boekhouding/icons/icon-512.png'
    ]))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
