self.addEventListener('install', event => {
  console.log('Service Worker installeren.');
});

self.addEventListener('fetch', event => {
  // Optioneel: cache strategie voor offline gebruik
});
